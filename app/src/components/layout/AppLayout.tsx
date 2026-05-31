import type { ReactNode } from "react";

import { Sidebar } from "./Sidebar";

type AppLayoutProps = {
  children: ReactNode;
  currentPage: "dashboard" | "equipment" | "clients" | "events";
  onNavigate: (page: "dashboard" | "equipment" | "clients" | "events") => void;
};

export function AppLayout({ children, currentPage, onNavigate }: AppLayoutProps) {
  return (
    <div className="min-h-screen">
      <Sidebar currentPage={currentPage} onNavigate={onNavigate} />
      <main className="px-4 py-6 sm:px-6 lg:ml-72 lg:px-8">{children}</main>
    </div>
  );
}
