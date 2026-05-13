import Link from "next/link";
import { ArrowUpRight, Boxes, CalendarCheck, MapPinned, Wrench } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { modules } from "@/lib/modules";

const stats = [
  { label: "Equipamentos", value: "0", icon: Boxes },
  { label: "Eventos ativos", value: "0", icon: CalendarCheck },
  { label: "Em manutenção", value: "0", icon: Wrench },
  { label: "Locais cadastrados", value: "0", icon: MapPinned }
];

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Badge>Primeira versão operacional</Badge>
            <h1 className="mt-3 text-2xl font-semibold tracking-normal sm:text-3xl">
              Painel StageOps
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Controle central de equipamentos, eventos, galpões, manutenção,
              locais, EPIs e praticáveis.
            </p>
          </div>
          <Button asChild>
            <Link href="/modules/eventos">
              Novo evento
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-sm text-muted-foreground">
                    {stat.label}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold">{stat.value}</p>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <Link key={module.slug} href={`/modules/${module.slug}`}>
                <Card className="h-full transition-colors hover:border-primary">
                  <CardHeader className="flex flex-row items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                      <Icon className="h-5 w-5 text-primary" />
                    </span>
                    <CardTitle>{module.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {module.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </section>
      </div>
    </AppShell>
  );
}
