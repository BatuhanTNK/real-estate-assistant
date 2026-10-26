import { DashboardNavigation } from "@/components/dashboard-navigation";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  return (
    <div className="workspace-shell">
      <DashboardNavigation />
      <div className="workspace-content">
        {children}
      </div>
    </div>
  );
}
