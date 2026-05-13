import { notFound } from "next/navigation";
import { Plus } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getModule, modules } from "@/lib/modules";

type ModulePageProps = {
  params: {
    slug: string;
  };
};

export function generateStaticParams() {
  return modules.map((module) => ({ slug: module.slug }));
}

export default function ModulePage({ params }: ModulePageProps) {
  const module = getModule(params.slug);

  if (!module) {
    notFound();
  }

  const Icon = module.icon;

  return (
    <AppShell>
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Icon className="h-6 w-6" />
            </span>
            <div>
              <Badge>Módulo inicial</Badge>
              <h1 className="mt-2 text-2xl font-semibold tracking-normal">
                {module.title}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                {module.description}
              </p>
            </div>
          </div>
          <Button>
            <Plus className="h-4 w-4" />
            Novo registro
          </Button>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Registros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex min-h-64 items-center justify-center rounded-md border border-dashed bg-background px-4 text-center">
              <p className="max-w-md text-sm leading-6 text-muted-foreground">
                Esta página já está reservada para o CRUD do módulo. A API
                correspondente foi criada no backend e a interface pode evoluir
                para tabela, filtros, edição e ações em lote.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
