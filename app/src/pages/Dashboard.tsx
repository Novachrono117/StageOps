import { AlertTriangle, Boxes, CalendarClock, ShieldCheck, Wrench } from "lucide-react";

import { Card } from "../components/ui/Card";
import type { Equipment } from "../types/equipment";
import { calculateAvailableQuantity } from "../utils/equipmentInventory";

type DashboardProps = {
  equipment: Equipment[];
};

export function Dashboard({ equipment }: DashboardProps) {
  const totalOwnUnits = equipment.reduce(
    (sum, item) => sum + item.totalQuantity,
    0
  );
  const availableOwnUnits = equipment.reduce(
    (sum, item) => sum + calculateAvailableQuantity(item),
    0
  );
  const reservedOwnUnits = equipment.reduce(
    (sum, item) => sum + item.reservedQuantity,
    0
  );
  const maintenanceOwnUnits = equipment.reduce(
    (sum, item) => sum + item.maintenanceQuantity,
    0
  );

  const cards = [
    {
      label: "Equipamentos cadastrados",
      value: equipment.length.toString(),
      icon: Boxes,
      tone: "text-stage-cyan"
    },
    {
      label: "Unidades próprias totais",
      value: totalOwnUnits.toString(),
      icon: CalendarClock,
      tone: "text-stage-green"
    },
    {
      label: "Unidades próprias disponíveis",
      value: availableOwnUnits.toString(),
      icon: ShieldCheck,
      tone: "text-stage-green"
    },
    {
      label: "Reservadas/locadas",
      value: reservedOwnUnits.toString(),
      icon: Boxes,
      tone: "text-stage-purple"
    },
    {
      label: "Em manutenção",
      value: maintenanceOwnUnits.toString(),
      icon: Wrench,
      tone: "text-stage-amber"
    }
  ];

  return (
    <div className="mx-auto grid max-w-7xl gap-6">
      <header className="grid gap-3">
        <span className="w-fit rounded-full border border-stage-line bg-white/5 px-3 py-1 text-xs font-semibold text-stage-muted">
          MVP seguro e escalável
        </span>
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              Painel operacional
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-stage-muted">
              Base inicial para controlar estoque próprio, eventos, checklists,
              logística e manutenção com isolamento futuro por organização.
            </p>
          </div>
          <div className="rounded-2xl border border-stage-line bg-stage-panel/70 px-4 py-3 text-sm text-stage-muted">
            Disponibilidade calculada automaticamente pelo estoque próprio.
          </div>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card className="p-5" key={card.label}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-stage-muted">{card.label}</p>
                <Icon className={`h-5 w-5 ${card.tone}`} />
              </div>
              <p className="mt-4 text-3xl font-black">{card.value}</p>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-5">
          <h2 className="text-lg font-bold">Próximos fluxos do MVP</h2>
          <div className="mt-4 grid gap-3">
            {[
              "Cadastro mínimo de clientes com dados estritamente necessários.",
              "Reservas por data com quantidade própria e quantidade sublocada.",
              "Checklists de saída e retorno por evento.",
              "Manutenção com histórico técnico sem exposição de dados pessoais."
            ].map((item) => (
              <div className="rounded-xl bg-white/5 p-3 text-sm text-stage-muted" key={item}>
                {item}
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-1 h-5 w-5 text-stage-amber" />
            <div>
              <h2 className="text-lg font-bold">Segurança e Auditoria</h2>
              <p className="mt-2 text-sm leading-6 text-stage-muted">
                O menu já prevê Logs de Segurança apenas para administradores.
                A implementação futura deve registrar ações por identificadores
                internos, sem senhas, tokens, cookies, chaves ou conteúdo integral
                de campos pessoais.
              </p>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
