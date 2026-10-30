// Next.js 16 client instrumentation — runs before React hydration.
// Prevents browser extensions (including Chrome Isolated World content scripts)
// that inject <div> elements at the start of document.body from colliding with
// Next.js MetadataWrapper's <div hidden> boundary during React 19 hydration.
try {
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    const nativeFirstChildGetter = Object.getOwnPropertyDescriptor(
      Node.prototype,
      "firstChild"
    )?.get;
    const nativeNextSiblingGetter = Object.getOwnPropertyDescriptor(
      Node.prototype,
      "nextSibling"
    )?.get;
    const nativeInsertBefore = Node.prototype.insertBefore;
    const nativeAppendChild = Node.prototype.appendChild;
    const nativeRemoveChild = Node.prototype.removeChild;
    const nativePrepend = Element.prototype.prepend;

    let isSanitizing = false;
    let guardActive = true;
    let knownMetadataDiv: HTMLElement | null = null;
    let observer: MutationObserver | null = null;

    const hasSuspenseComment = (el: Node): boolean => {
      if (!nativeFirstChildGetter || !nativeNextSiblingGetter) {
        return (el as HTMLElement).innerHTML?.includes("<!--$-->") ?? false;
      }
      for (
        let c = nativeFirstChildGetter.call(el);
        c;
        c = nativeNextSiblingGetter.call(c)
      ) {
        if (
          c.nodeType === Node.COMMENT_NODE &&
          ((c as Comment).data === "$" || (c as Comment).data === "$?")
        ) {
          return true;
        }
      }
      return false;
    };

    const isGenuineNextMetadataDiv = (el: HTMLElement): boolean => {
      if (el === knownMetadataDiv) return true;
      if (el.tagName !== "DIV") return false;
      if (el.shadowRoot) return false;
      if (el.children.length > 0) return false;
      // Must have either the SSR `hidden` attribute or React's <!--$--> Suspense comment marker
      if (!el.hasAttribute("hidden") && !hasSuspenseComment(el)) {
        return false;
      }
      for (let i = 0; i < el.attributes.length; i++) {
        if (el.attributes[i].name.toLowerCase() !== "hidden") {
          return false;
        }
      }
      return true;
    };

    const ensureMetadataBoundaryBeforeHydration = () => {
      if (isSanitizing || !guardActive) return;
      const body = document.body;
      if (!body || !nativeFirstChildGetter || !nativeNextSiblingGetter) return;

      const skipLink = body.querySelector("a.skip-link");
      if (!skipLink || skipLink.parentNode !== body) return;

      // Fast path: check if body.firstChild is already our valid metadataDiv right before skipLink
      const first = nativeFirstChildGetter.call(body);
      if (
        first &&
        first.nodeType === Node.ELEMENT_NODE &&
        isGenuineNextMetadataDiv(first as HTMLElement) &&
        (first as HTMLElement).hasAttribute("hidden") &&
        hasSuspenseComment(first) &&
        nativeNextSiblingGetter.call(first) === skipLink
      ) {
        knownMetadataDiv = first as HTMLElement;
        return;
      }

      isSanitizing = true;
      try {
        let current: ChildNode | null = nativeFirstChildGetter.call(body);
        let metadataDiv: HTMLElement | null = null;
        const nodesToMoveToEnd: Element[] = [];
        const nodesToRemove: ChildNode[] = [];

        while (current && current !== skipLink) {
          const next: ChildNode | null = nativeNextSiblingGetter.call(current);
          if (current.nodeType === Node.ELEMENT_NODE) {
            const el = current as HTMLElement;
            if (!metadataDiv && isGenuineNextMetadataDiv(el)) {
              metadataDiv = el;
              knownMetadataDiv = el;
            } else {
              nodesToMoveToEnd.push(el);
            }
          } else if (current.nodeType === Node.TEXT_NODE) {
            nodesToRemove.push(current);
          }
          current = next;
        }

        for (const textNode of nodesToRemove) {
          nativeRemoveChild.call(body, textNode);
        }

        for (const extEl of nodesToMoveToEnd) {
          nativeAppendChild.call(body, extEl);
        }

        if (!metadataDiv) {
          metadataDiv = document.createElement("div");
          metadataDiv.setAttribute("hidden", "");
          metadataDiv.innerHTML = "<!--$--><!--/$-->";
          nativeInsertBefore.call(body, metadataDiv, skipLink);
          knownMetadataDiv = metadataDiv;
        } else {
          if (!metadataDiv.hasAttribute("hidden")) {
            metadataDiv.setAttribute("hidden", "");
          }
          if (!hasSuspenseComment(metadataDiv)) {
            metadataDiv.innerHTML = "<!--$--><!--/$-->";
          }
        }

        observer?.takeRecords();
      } finally {
        isSanitizing = false;
      }
    };

    // 1. Intercept Node.prototype.firstChild getter so that at the exact instant
    // React's hydrateRoot reads `document.body.firstChild` in the Main World,
    // any extension-injected <div> (even from a Chrome Isolated World content script)
    // is moved to the end of document.body before React claims the first child.
    if (nativeFirstChildGetter) {
      Object.defineProperty(Node.prototype, "firstChild", {
        configurable: true,
        enumerable: true,
        get() {
          if (guardActive && !isSanitizing && this === document.body) {
            ensureMetadataBoundaryBeforeHydration();
          }
          return nativeFirstChildGetter.call(this);
        },
      });
    }

    // 2. Intercept Main World prepend / insertBefore on document.body before hydration
    Element.prototype.prepend = function (...nodes: (Node | string)[]) {
      if (guardActive && !isSanitizing && this === document.body) {
        for (const node of nodes) {
          if (typeof node === "string") {
            nativeAppendChild.call(this, document.createTextNode(node));
          } else {
            nativeAppendChild.call(this, node);
          }
        }
        ensureMetadataBoundaryBeforeHydration();
        return;
      }
      return nativePrepend.apply(this, nodes);
    };

    Node.prototype.insertBefore = function <T extends Node>(
      newNode: T,
      referenceNode: Node | null
    ): T {
      if (
        guardActive &&
        !isSanitizing &&
        this === document.body &&
        referenceNode &&
        (newNode as Node) !== knownMetadataDiv
      ) {
        const skipLink = document.body.querySelector("a.skip-link");
        if (
          referenceNode === knownMetadataDiv ||
          referenceNode === skipLink ||
          referenceNode === nativeFirstChildGetter?.call(document.body)
        ) {
          return nativeAppendChild.call(this, newNode) as T;
        }
      }
      return nativeInsertBefore.call(this, newNode, referenceNode) as T;
    };

    // 3. Observe direct childList mutations on document.body (catches Isolated World injections immediately)
    const startObserver = () => {
      if (observer || !document.body || !guardActive) return;
      ensureMetadataBoundaryBeforeHydration();
      observer = new MutationObserver(() => {
        ensureMetadataBoundaryBeforeHydration();
      });
      observer.observe(document.body, { childList: true });
    };

    ensureMetadataBoundaryBeforeHydration();
    startObserver();

    document.addEventListener("readystatechange", () => {
      ensureMetadataBoundaryBeforeHydration();
      startObserver();
    });
    document.addEventListener(
      "DOMContentLoaded",
      () => {
        ensureMetadataBoundaryBeforeHydration();
        startObserver();
      },
      { once: true }
    );

    // Deactivate guard after hydration has settled
    const stopGuard = () => {
      setTimeout(() => {
        guardActive = false;
        if (observer) {
          observer.disconnect();
          observer = null;
        }
      }, 6000);
    };
    if (document.readyState === "complete") {
      stopGuard();
    } else {
      window.addEventListener("load", stopGuard, { once: true });
    }
  }
} catch {
  // Ignore DOM guard errors
}
