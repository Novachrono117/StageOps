export type Supplier = {
  id: string;
  organizationId: string;
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  operationalNotes?: string;
};

export type SubrentedEquipment = {
  id: string;
  organizationId: string;
  supplierId: string;
  eventId: string;
  equipmentName: string;
  category: string;
  quantity: number;
  startsAt: string;
  endsAt: string;
  cost?: number;
};

export type EventEquipmentRequirement = {
  id: string;
  organizationId: string;
  eventId: string;
  equipmentName: string;
  ownReservedQuantity: number;
  subrentedQuantity: number;
  totalRequiredQuantity: number;
};
