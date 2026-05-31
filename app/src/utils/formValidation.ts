import type { EquipmentFormData } from "../types/equipment";

export type EquipmentFormErrors = Partial<Record<keyof EquipmentFormData, string>>;

export function validateEquipmentForm(data: EquipmentFormData) {
  const errors: EquipmentFormErrors = {};

  if (data.name.trim().length < 2) {
    errors.name = "Informe um nome com pelo menos 2 caracteres.";
  }

  if (!Number.isInteger(data.totalQuantity) || data.totalQuantity < 0) {
    errors.totalQuantity = "Informe uma quantidade inteira igual ou maior que zero.";
  }

  if (data.operationalNotes.length > 500) {
    errors.operationalNotes = "Use no máximo 500 caracteres.";
  }

  return errors;
}
