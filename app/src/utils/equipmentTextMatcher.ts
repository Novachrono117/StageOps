import type { Equipment } from "../types/equipment";
import { equipmentCategoryLabels } from "../types/equipment";

export function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function suggestEquipmentFromText(text: string, equipment: Equipment[]) {
  const normalizedText = normalizeSearchText(text);

  if (!normalizedText) {
    return [];
  }

  return equipment.filter((item) => {
    const terms = [
      item.name,
      equipmentCategoryLabels[item.category],
      ...item.name.split(/\s+/)
    ]
      .map(normalizeSearchText)
      .filter((term) => term.length >= 3);

    return Array.from(new Set(terms)).some((term) => normalizedText.includes(term));
  });
}
