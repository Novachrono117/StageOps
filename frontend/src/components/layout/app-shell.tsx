import { Sidebar } from "@/components/layout/sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="px-4 pb-8 pt-20 sm:px-6 lg:ml-72 lg:px-8 lg:pt-8">
        {children}
      </main>
    </div>
  );
}
