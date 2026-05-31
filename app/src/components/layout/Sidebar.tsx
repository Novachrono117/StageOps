import {
  BarChart3,
  Boxes,
  CalendarDays,
  FileText,
  LockKeyhole,
  Settings,
  ShieldCheck,
  Users
} from "lucide-react";

type SidebarProps = {
  currentPage: "dashboard" | "equipment" | "clients";
  onNavigate: (page: "dashboard" | "equipment" | "clients") => void;
};

const mainItems = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "equipment", label: "Equipamentos", icon: Boxes },
  { id: "clients", label: "Clientes", icon: Users }
] as const;

const futureItems = [
  { label: "Eventos", icon: CalendarDays },
  { label: "Orçamentos", icon: FileText },
  { label: "Política de Privacidade", icon: ShieldCheck },
  { label: "Logs de Segurança", icon: LockKeyhole, adminOnly: true },
  { label: "Configurações", icon: Settings }
];

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  return (
    <aside className="border-b border-stage-line bg-stage-panel/90 backdrop-blur lg:fixed lg:inset-y-0 lg:left-0 lg:w-72 lg:border-b-0 lg:border-r">
      <div className="flex h-20 items-center gap-3 px-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-stage-purple text-lg font-black">
          S
        </div>
        <div>
          <p className="text-base font-bold">StageOps</p>
          <p className="text-xs text-stage-muted">Operação SaaS</p>
        </div>
      </div>

      <nav className="flex gap-2 overflow-x-auto px-4 pb-4 lg:flex-col lg:overflow-visible">
        {mainItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              className={`flex h-11 shrink-0 items-center gap-3 rounded-xl px-4 text-sm font-semibold transition ${
                isActive
                  ? "bg-stage-purple text-white"
                  : "text-stage-muted hover:bg-white/10 hover:text-stage-text"
              }`}
              key={item.id}
              onClick={() => onNavigate(item.id)}
              type="button"
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="hidden px-4 lg:block">
        <p className="mb-3 px-4 text-xs font-semibold uppercase tracking-widest text-stage-muted">
          Próximos módulos
        </p>
        <div className="grid gap-1">
          {futureItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                className="flex items-center justify-between rounded-xl px-4 py-3 text-sm text-stage-muted"
                key={item.label}
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-4 w-4" />
                  {item.label}
                </span>
                {item.adminOnly ? (
                  <span className="rounded-full border border-stage-line px-2 py-0.5 text-[10px] uppercase">
                    Admin
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
