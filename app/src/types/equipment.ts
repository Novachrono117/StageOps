export type EquipmentStatus =
  | "available"
  | "reserved"
  | "maintenance"
  | "unavailable"
  | "out_of_stock";

export type EquipmentCategory =
  | "audio"
  | "lighting"
  | "led"
  | "stage"
  | "backline"
  | "structure"
  | "cables"
  | "accessories";

export type Equipment = {
  id: string;
  organizationId: string;
  name: string;
  category: EquipmentCategory;
  totalQuantity: number;
  reservedQuantity: number;
  maintenanceQuantity: number;
  unavailableQuantity: number;
  operationalNotes?: string;
  createdAt: string;
  updatedAt: string;
};

export type EquipmentFormData = {
  name: string;
  category: EquipmentCategory;
  totalQuantity: number;
  operationalNotes: string;
};

export type EquipmentUpdateData = Partial<EquipmentFormData> & {
  reservedQuantity?: number;
  maintenanceQuantity?: number;
  unavailableQuantity?: number;
};

export type EquipmentQuantityOperation = {
  equipmentId: string;
  quantity: number;
};

export const equipmentCategoryLabels: Record<EquipmentCategory, string> = {
  audio: "Som",
  lighting: "Iluminação",
  led: "Painel de LED",
  stage: "Palco",
  backline: "Backline",
  structure: "Estrutura",
  cables: "Cabos",
  accessories: "Acessórios"
};

export const equipmentStatusLabels: Record<EquipmentStatus, string> = {
  available: "Disponível",
  reserved: "Reservado",
  maintenance: "Manutenção",
  unavailable: "Indisponível",
  out_of_stock: "Sem disponibilidade"
};
