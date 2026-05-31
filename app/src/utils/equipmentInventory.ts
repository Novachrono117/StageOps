import type { Equipment, EquipmentStatus } from "../types/equipment";

export type InventoryValidationResult = {
  isValid: boolean;
  message?: string;
};

export function calculateAvailableQuantity(
  equipment: Pick<
    Equipment,
    | "totalQuantity"
    | "reservedQuantity"
    | "maintenanceQuantity"
    | "unavailableQuantity"
  >
) {
  return (
    equipment.totalQuantity -
    equipment.reservedQuantity -
    equipment.maintenanceQuantity -
    equipment.unavailableQuantity
  );
}

export function validateInventoryQuantities(
  equipment: Pick<
    Equipment,
    | "totalQuantity"
    | "reservedQuantity"
    | "maintenanceQuantity"
    | "unavailableQuantity"
  >
): InventoryValidationResult {
  const quantities = [
    equipment.totalQuantity,
    equipment.reservedQuantity,
    equipment.maintenanceQuantity,
    equipment.unavailableQuantity
  ];

  if (quantities.some((quantity) => !Number.isInteger(quantity) || quantity < 0)) {
    return {
      isValid: false,
      message: "As quantidades devem ser números inteiros iguais ou maiores que zero."
    };
  }

  if (calculateAvailableQuantity(equipment) < 0) {
    return {
      isValid: false,
      message:
        "A soma de reservado, manutenção e indisponível não pode superar a quantidade total."
    };
  }

  return { isValid: true };
}

export function getEquipmentStatus(equipment: Equipment): EquipmentStatus {
  const availableQuantity = calculateAvailableQuantity(equipment);

  if (availableQuantity > 0) {
    return "available";
  }

  if (equipment.reservedQuantity > 0) {
    return "reserved";
  }

  if (equipment.maintenanceQuantity > 0) {
    return "maintenance";
  }

  if (equipment.unavailableQuantity > 0) {
    return "unavailable";
  }

  return "out_of_stock";
}
