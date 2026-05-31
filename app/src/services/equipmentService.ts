import type {
  Equipment,
  EquipmentFormData,
  EquipmentUpdateData
} from "../types/equipment";
import { calculateAvailableQuantity, validateInventoryQuantities } from "../utils/equipmentInventory";
import { createId } from "../utils/id";

const STORAGE_KEY = "stageops.equipment.v1";
const DEMO_ORGANIZATION_ID = "org_demo";

type LegacyEquipment = Partial<Equipment> & {
  status?: string;
};

class EquipmentServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EquipmentServiceError";
  }
}

function toSafeInteger(value: unknown, fallback = 0) {
  return Number.isInteger(value) && Number(value) >= 0 ? Number(value) : fallback;
}

function normalizeEquipment(item: LegacyEquipment): Equipment {
  const now = new Date().toISOString();
  const totalQuantity = toSafeInteger(item.totalQuantity);
  const legacyReserved =
    item.status === "reserved" || item.status === "rented" || item.status === "in_event"
      ? totalQuantity
      : 0;
  const legacyMaintenance = item.status === "maintenance" ? totalQuantity : 0;
  const legacyUnavailable = item.status === "lost" ? totalQuantity : 0;

  const normalized: Equipment = {
    id: item.id ?? createId("eqp"),
    organizationId: item.organizationId ?? DEMO_ORGANIZATION_ID,
    name: item.name?.trim() || "Equipamento sem nome",
    category: item.category ?? "accessories",
    totalQuantity,
    reservedQuantity: toSafeInteger(item.reservedQuantity, legacyReserved),
    maintenanceQuantity: toSafeInteger(item.maintenanceQuantity, legacyMaintenance),
    unavailableQuantity: toSafeInteger(item.unavailableQuantity, legacyUnavailable),
    operationalNotes: item.operationalNotes?.trim() || undefined,
    createdAt: item.createdAt ?? now,
    updatedAt: item.updatedAt ?? now
  };

  const validation = validateInventoryQuantities(normalized);
  if (validation.isValid) {
    return normalized;
  }

  return {
    ...normalized,
    reservedQuantity: 0,
    maintenanceQuantity: 0,
    unavailableQuantity: 0,
    updatedAt: now
  };
}

function readStorage(): Equipment[] {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    const normalized = parsed.map((item) => normalizeEquipment(item));
    if (JSON.stringify(parsed) !== JSON.stringify(normalized)) {
      writeStorage(normalized);
    }
    return normalized;
  } catch {
    return [];
  }
}

function writeStorage(equipment: Equipment[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(equipment));
}

function getExistingEquipment(equipmentId: string) {
  const equipment = readStorage();
  const existing = equipment.find((item) => item.id === equipmentId);

  if (!existing) {
    throw new EquipmentServiceError("Equipamento não encontrado.");
  }

  return { equipment, existing };
}

function saveUpdatedEquipment(
  equipment: Equipment[],
  updatedEquipment: Equipment
): Equipment {
  const validation = validateInventoryQuantities(updatedEquipment);

  if (!validation.isValid) {
    throw new EquipmentServiceError(validation.message ?? "Quantidades inválidas.");
  }

  const nextEquipment = equipment.map((item) =>
    item.id === updatedEquipment.id ? updatedEquipment : item
  );
  writeStorage(nextEquipment);
  return updatedEquipment;
}

function validateOperationQuantity(quantity: number) {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new EquipmentServiceError("Informe uma quantidade inteira maior que zero.");
  }
}

export const equipmentService = {
  async list(): Promise<Equipment[]> {
    return readStorage().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  async createEquipment(data: EquipmentFormData): Promise<Equipment> {
    const now = new Date().toISOString();
    const equipment: Equipment = {
      id: createId("eqp"),
      organizationId: DEMO_ORGANIZATION_ID,
      name: data.name.trim(),
      category: data.category,
      totalQuantity: data.totalQuantity,
      reservedQuantity: 0,
      maintenanceQuantity: 0,
      unavailableQuantity: 0,
      operationalNotes: data.operationalNotes.trim() || undefined,
      createdAt: now,
      updatedAt: now
    };

    const validation = validateInventoryQuantities(equipment);
    if (!validation.isValid) {
      throw new EquipmentServiceError(validation.message ?? "Quantidades inválidas.");
    }

    writeStorage([equipment, ...readStorage()]);
    return equipment;
  },

  async updateEquipment(
    equipmentId: string,
    data: EquipmentUpdateData
  ): Promise<Equipment> {
    const { equipment, existing } = getExistingEquipment(equipmentId);
    const updatedEquipment: Equipment = {
      ...existing,
      ...data,
      name: data.name?.trim() ?? existing.name,
      operationalNotes:
        data.operationalNotes !== undefined
          ? data.operationalNotes.trim() || undefined
          : existing.operationalNotes,
      updatedAt: new Date().toISOString()
    };

    return saveUpdatedEquipment(equipment, updatedEquipment);
  },

  async deleteEquipment(equipmentId: string): Promise<void> {
    const equipment = readStorage();
    writeStorage(equipment.filter((item) => item.id !== equipmentId));
  },

  async reserveEquipmentUnits(
    equipmentId: string,
    quantity: number
  ): Promise<Equipment> {
    validateOperationQuantity(quantity);
    const { equipment, existing } = getExistingEquipment(equipmentId);

    if (quantity > calculateAvailableQuantity(existing)) {
      throw new EquipmentServiceError("Não há unidades disponíveis suficientes.");
    }

    return saveUpdatedEquipment(equipment, {
      ...existing,
      reservedQuantity: existing.reservedQuantity + quantity,
      updatedAt: new Date().toISOString()
    });
  },

  async returnEquipmentUnits(
    equipmentId: string,
    quantity: number
  ): Promise<Equipment> {
    validateOperationQuantity(quantity);
    const { equipment, existing } = getExistingEquipment(equipmentId);

    if (quantity > existing.reservedQuantity) {
      throw new EquipmentServiceError("A quantidade informada supera o total reservado.");
    }

    return saveUpdatedEquipment(equipment, {
      ...existing,
      reservedQuantity: existing.reservedQuantity - quantity,
      updatedAt: new Date().toISOString()
    });
  },

  async sendEquipmentUnitsToMaintenance(
    equipmentId: string,
    quantity: number
  ): Promise<Equipment> {
    validateOperationQuantity(quantity);
    const { equipment, existing } = getExistingEquipment(equipmentId);

    if (quantity > calculateAvailableQuantity(existing)) {
      throw new EquipmentServiceError("Não há unidades disponíveis suficientes.");
    }

    return saveUpdatedEquipment(equipment, {
      ...existing,
      maintenanceQuantity: existing.maintenanceQuantity + quantity,
      updatedAt: new Date().toISOString()
    });
  },

  async returnEquipmentUnitsFromMaintenance(
    equipmentId: string,
    quantity: number
  ): Promise<Equipment> {
    validateOperationQuantity(quantity);
    const { equipment, existing } = getExistingEquipment(equipmentId);

    if (quantity > existing.maintenanceQuantity) {
      throw new EquipmentServiceError(
        "A quantidade informada supera o total em manutenção."
      );
    }

    return saveUpdatedEquipment(equipment, {
      ...existing,
      maintenanceQuantity: existing.maintenanceQuantity - quantity,
      updatedAt: new Date().toISOString()
    });
  },

  async setEquipmentUnitsUnavailable(
    equipmentId: string,
    quantity: number
  ): Promise<Equipment> {
    validateOperationQuantity(quantity);
    const { equipment, existing } = getExistingEquipment(equipmentId);

    if (quantity > calculateAvailableQuantity(existing)) {
      throw new EquipmentServiceError("Não há unidades disponíveis suficientes.");
    }

    return saveUpdatedEquipment(equipment, {
      ...existing,
      unavailableQuantity: existing.unavailableQuantity + quantity,
      updatedAt: new Date().toISOString()
    });
  },

  create: (data: EquipmentFormData) => equipmentService.createEquipment(data)
};
