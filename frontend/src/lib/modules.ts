import {
  Building2,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  HardHat,
  MapPin,
  Package,
  ScanBarcode,
  Settings2,
  ShieldCheck,
  Truck,
  Users,
  Warehouse,
  Wrench
} from "lucide-react";

export const modules = [
  {
    slug: "empresas",
    title: "Empresas",
    description: "Cadastro das empresas operadoras da plataforma.",
    icon: Building2
  },
  {
    slug: "usuarios-funcionarios",
    title: "Usuários e funcionários",
    description: "Acessos, cargos, equipes e responsáveis operacionais.",
    icon: Users
  },
  {
    slug: "galpoes-localizacoes",
    title: "Galpões e localizações",
    description: "Galpões, ruas, prateleiras, racks e posições internas.",
    icon: Warehouse
  },
  {
    slug: "categorias-equipamentos",
    title: "Categorias de equipamentos",
    description: "Som, luz, LED, estrutura, palco, energia e periféricos.",
    icon: Package
  },
  {
    slug: "modelos-equipamentos",
    title: "Modelos de equipamentos",
    description: "Modelos técnicos com fabricante, peso e especificações.",
    icon: Settings2
  },
  {
    slug: "equipamentos-fisicos",
    title: "Equipamentos físicos",
    description: "Unidades, patrimônio, status e localização atual.",
    icon: ScanBarcode
  },
  {
    slug: "eventos",
    title: "Eventos",
    description: "Reservas, execução, clientes, datas e logística.",
    icon: CalendarDays
  },
  {
    slug: "checklist-saida",
    title: "Checklist de saída",
    description: "Separação, conferência e expedição para eventos.",
    icon: ClipboardCheck
  },
  {
    slug: "checklist-retorno",
    title: "Checklist de retorno",
    description: "Retorno, avarias, faltas e baixa no galpão.",
    icon: ClipboardList
  },
  {
    slug: "manutencao",
    title: "Manutenção",
    description: "Ordens de serviço, custos, prazos e resolução.",
    icon: Wrench
  },
  {
    slug: "locais-eventos",
    title: "Locais de eventos",
    description: "Endereços, avaliação interna e notas de acesso.",
    icon: MapPin
  },
  {
    slug: "observacoes-operacionais",
    title: "Observações operacionais",
    description: "Detalhes práticos de montagem, carga e restrições.",
    icon: Truck
  },
  {
    slug: "epis-obrigatorios",
    title: "EPIs obrigatórios",
    description: "Requisitos de segurança por local de evento.",
    icon: ShieldCheck
  },
  {
    slug: "praticaveis-palcos",
    title: "Praticáveis e palcos",
    description: "Placas, pés, alturas, escadas e cálculo de área.",
    icon: HardHat
  }
];

export function getModule(slug: string) {
  return modules.find((module) => module.slug === slug);
}
