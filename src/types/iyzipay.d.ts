declare module "iyzipay" {
  interface IyzipayOptions {
    apiKey: string;
    secretKey: string;
    uri: string;
  }

  interface CheckoutFormInitializeRequest {
    locale?: string;
    conversationId?: string;
    price: string;
    paidPrice: string;
    currency: string;
    basketId: string;
    paymentGroup?: string;
    callbackUrl: string;
    enabledInstallments?: number[];
    buyer: Record<string, unknown>;
    shippingAddress: Record<string, unknown>;
    billingAddress: Record<string, unknown>;
    basketItems: Array<Record<string, unknown>>;
  }

  interface CheckoutFormRetrieveRequest {
    token: string;
    locale?: string;
  }

  interface IyzipayResponse {
    status: string;
    errorCode?: string;
    errorMessage?: string;
    checkoutFormContent?: string;
    token?: string;
    paymentStatus?: string;
    basketId?: string;
    price?: number;
    paymentId?: string;
    [key: string]: unknown;
  }

  type Callback = (err: unknown, result: IyzipayResponse) => void;

  export default class Iyzipay {
    constructor(options: IyzipayOptions);
    checkoutFormInitialize: {
      create(request: CheckoutFormInitializeRequest, callback: Callback): void;
    };
    checkoutForm: {
      retrieve(request: CheckoutFormRetrieveRequest, callback: Callback): void;
    };
  }
}
