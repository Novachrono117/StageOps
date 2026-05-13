"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { modules } from "@/lib/modules";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-x-0 top-0 z-40 border-b bg-card lg:inset-y-0 lg:left-0 lg:right-auto lg:w-72 lg:border-b-0 lg:border-r">
      <div className="flex h-16 items-center justify-between px-4 lg:h-20">
        <Link href="/dashboard" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Activity className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-base font-semibold">StageOps</span>
            <span className="block text-xs text-muted-foreground">
              Operação técnica
            </span>
          </span>
        </Link>
        <Button className="lg:hidden" variant="ghost" size="icon" title="Menu">
          <Menu className="h-5 w-5" />
        </Button>
      </div>
      <nav className="flex gap-2 overflow-x-auto px-4 pb-3 lg:hidden">
        {modules.map((module) => {
          const href = `/modules/${module.slug}`;
          const Icon = module.icon;
          return (
            <Link
              key={module.slug}
              href={href}
              className={cn(
                "flex h-10 shrink-0 items-center gap-2 rounded-md border bg-background px-3 text-sm",
                pathname === href && "border-primary text-primary"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{module.title}</span>
            </Link>
          );
        })}
      </nav>
      <nav className="hidden h-[calc(100vh-5rem)] gap-1 overflow-y-auto px-3 pb-4 lg:flex lg:flex-col">
        <Link
          href="/dashboard"
          className={cn(
            "rounded-md px-3 py-2 text-sm font-medium hover:bg-muted",
            pathname === "/dashboard" && "bg-muted"
          )}
        >
          Dashboard
        </Link>
        {modules.map((module) => {
          const href = `/modules/${module.slug}`;
          const Icon = module.icon;
          return (
            <Link
              key={module.slug}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground",
                pathname === href && "bg-muted text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{module.title}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
