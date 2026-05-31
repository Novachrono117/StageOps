import { FormEvent, useState } from "react";
import { Edit3, Plus } from "lucide-react";

import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Textarea } from "../components/ui/Textarea";
import { equipmentService } from "../services/equipmentService";
import { securityAuditService } from "../services/securityAuditService";
import type { Equipment, EquipmentFormData } from "../types/equipment";
import {
  equipmentCategoryLabels,
  equipmentStatusLabels
} from "../types/equipment";
import {
  calculateAvailableQuantity,
  getEquipmentStatus
} from "../utils/equipmentInventory";
import { validateEquipmentForm } from "../utils/formValidation";

type EquipmentPageProps = {
  equipment: Equipment[];
  onEquipmentChanged: (equipment: Equipment[]) => void;
};

type QuantityAction =
  | "reserve"
  | "return"
  | "send_maintenance"
  | "return_maintenance"
  | "unavailable";

const initialForm: EquipmentFormData = {
  name: "",
  category: "audio",
  totalQuantity: 0,
  operationalNotes: ""
};

const actionLabels: Record<QuantityAction, string> = {
  reserve: "Reservar/locar",
  return: "Devolver",
  send_maintenance: "Enviar para manutenção",
  return_maintenance: "Retirar da manutenção",
  unavailable: "Marcar como indisponível"
};

export function EquipmentPage({
  equipment,
  onEquipmentChanged
}: EquipmentPageProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEquipmentId, setEditingEquipmentId] = useState<string | null>(null);
  const [formData, setFormData] = useState<EquipmentFormData>(initialForm);
  const [errors, setErrors] = useState(validateEquipmentForm(initialForm));
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function resetForm() {
    setFormData(initialForm);
    setErrors(validateEquipmentForm(initialForm));
    setEditingEquipmentId(null);
    setIsFormOpen(false);
  }

  function upsertEquipment(updated: Equipment) {
    const exists = equipment.some((item) => item.id === updated.id);
    const nextEquipment = exists
      ? equipment.map((item) => (item.id === updated.id ? updated : item))
      : [updated, ...equipment];
    onEquipmentChanged(nextEquipment);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateEquipmentForm(formData);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const saved = editingEquipmentId
        ? await equipmentService.updateEquipment(editingEquipmentId, formData)
        : await equipmentService.createEquipment(formData);

      await securityAuditService.record({
        eventType: editingEquipmentId ? "equipment.updated" : "equipment.created",
        organizationId: saved.organizationId,
        entityType: "equipment",
        entityId: saved.id
      });

      upsertEquipment(saved);
      resetForm();
      setFeedback(
        editingEquipmentId
          ? "Equipamento atualizado com sucesso."
          : "Equipamento cadastrado com sucesso."
      );
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar agora. Tente novamente em instantes."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleEdit(item: Equipment) {
    setEditingEquipmentId(item.id);
    setFormData({
      name: item.name,
      category: item.category,
      totalQuantity: item.totalQuantity,
      operationalNotes: item.operationalNotes ?? ""
    });
    setErrors({});
    setIsFormOpen(true);
    setFeedback(null);
  }

  async function handleQuantityAction(item: Equipment, action: QuantityAction) {
    const input = window.prompt(`Quantidade para ${actionLabels[action].toLowerCase()}:`);
    if (input === null) {
      return;
    }

    const quantity = Number(input);
    setFeedback(null);

    try {
      const updated = await runQuantityAction(item.id, action, quantity);
      upsertEquipment(updated);
      await securityAuditService.record({
        eventType: "equipment.updated",
        organizationId: updated.organizationId,
        entityType: "equipment",
        entityId: updated.id
      });
      setFeedback(`${actionLabels[action]} realizado com sucesso.`);
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "Não foi possível concluir a ação. Tente novamente."
      );
    }
  }

  async function runQuantityAction(
    equipmentId: string,
    action: QuantityAction,
    quantity: number
  ) {
    if (action === "reserve") {
      return equipmentService.reserveEquipmentUnits(equipmentId, quantity);
    }
    if (action === "return") {
      return equipmentService.returnEquipmentUnits(equipmentId, quantity);
    }
    if (action === "send_maintenance") {
      return equipmentService.sendEquipmentUnitsToMaintenance(equipmentId, quantity);
    }
    if (action === "return_maintenance") {
      return equipmentService.returnEquipmentUnitsFromMaintenance(
        equipmentId,
        quantity
      );
    }
    return equipmentService.setEquipmentUnitsUnavailable(equipmentId, quantity);
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-6">
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <span className="rounded-full border border-stage-line bg-white/5 px-3 py-1 text-xs font-semibold text-stage-muted">
            Estoque próprio
          </span>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
            Equipamentos
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-stage-muted">
            Este módulo controla o estoque próprio. A sublocação de equipamentos
            será tratada no módulo de Eventos/Reservas.
          </p>
          <p className="mt-2 max-w-2xl text-xs leading-5 text-stage-muted">
            Disponível é calculado automaticamente: total menos reservado/locado,
            manutenção e indisponível.
          </p>
        </div>
        <Button
          onClick={() => {
            setIsFormOpen(true);
            setEditingEquipmentId(null);
            setFormData(initialForm);
            setFeedback(null);
          }}
          type="button"
        >
          <Plus className="h-4 w-4" />
          Adicionar equipamento
        </Button>
      </header>

      {feedback ? (
        <div className="rounded-xl border border-stage-line bg-white/5 px-4 py-3 text-sm text-stage-muted">
          {feedback}
        </div>
      ) : null}

      {isFormOpen ? (
        <Card className="p-5">
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold">
                {editingEquipmentId ? "Editar equipamento" : "Novo equipamento"}
              </h2>
              {editingEquipmentId ? (
                <span className="rounded-full border border-stage-line px-3 py-1 text-xs text-stage-muted">
                  Quantidades ocupadas serão preservadas
                </span>
              ) : null}
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Input
                error={errors.name}
                label="Nome do equipamento"
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    name: event.target.value
                  }))
                }
                placeholder="Ex: Caixa ativa 12 polegadas"
                value={formData.name}
              />
              <Select
                label="Categoria"
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    category: event.target.value as EquipmentFormData["category"]
                  }))
                }
                value={formData.category}
              >
                {Object.entries(equipmentCategoryLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
              <Input
                error={errors.totalQuantity}
                label="Quantidade total própria"
                min={0}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    totalQuantity: Number(event.target.value)
                  }))
                }
                type="number"
                value={formData.totalQuantity}
              />
            </div>
            <Textarea
              error={errors.operationalNotes}
              label="Observações"
              maxLength={500}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  operationalNotes: event.target.value
                }))
              }
              placeholder="Anote apenas informações operacionais necessárias."
              value={formData.operationalNotes}
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button onClick={resetForm} type="button" variant="secondary">
                Cancelar
              </Button>
              <Button disabled={isSubmitting} type="submit">
                {isSubmitting ? "Salvando..." : "Salvar equipamento"}
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      <Card className="overflow-hidden">
        <div className="border-b border-stage-line p-5">
          <h2 className="text-lg font-bold">Listagem</h2>
          <p className="mt-1 text-sm text-stage-muted">
            Quantidades separadas para estoque próprio. Sublocações futuras não
            aumentam a quantidade total própria.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
            <thead className="bg-white/5 text-xs uppercase tracking-wider text-stage-muted">
              <tr>
                <th className="px-5 py-3">Equipamento</th>
                <th className="px-5 py-3">Categoria</th>
                <th className="px-5 py-3">Total</th>
                <th className="px-5 py-3">Disponível</th>
                <th className="px-5 py-3">Reservado/locado</th>
                <th className="px-5 py-3">Manutenção</th>
                <th className="px-5 py-3">Indisponível</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {equipment.length === 0 ? (
                <tr>
                  <td className="px-5 py-10 text-center text-stage-muted" colSpan={9}>
                    Nenhum equipamento cadastrado ainda.
                  </td>
                </tr>
              ) : (
                equipment.map((item) => {
                  const availableQuantity = calculateAvailableQuantity(item);
                  const status = getEquipmentStatus(item);
                  return (
                    <tr className="border-t border-stage-line" key={item.id}>
                      <td className="px-5 py-4">
                        <p className="font-semibold">{item.name}</p>
                        <p className="mt-1 max-w-xs truncate text-xs text-stage-muted">
                          {item.operationalNotes ?? "Sem observações"}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-stage-muted">
                        {equipmentCategoryLabels[item.category]}
                      </td>
                      <td className="px-5 py-4">{item.totalQuantity}</td>
                      <td className="px-5 py-4 text-stage-green">
                        {availableQuantity}
                      </td>
                      <td className="px-5 py-4">{item.reservedQuantity}</td>
                      <td className="px-5 py-4">{item.maintenanceQuantity}</td>
                      <td className="px-5 py-4">{item.unavailableQuantity}</td>
                      <td className="px-5 py-4">
                        <span className="rounded-full border border-stage-line bg-white/5 px-3 py-1 text-xs">
                          {equipmentStatusLabels[status]}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            className="h-8 px-3 text-xs"
                            onClick={() => handleQuantityAction(item, "reserve")}
                            type="button"
                            variant="secondary"
                          >
                            Reservar/locar
                          </Button>
                          <Button
                            className="h-8 px-3 text-xs"
                            onClick={() => handleQuantityAction(item, "return")}
                            type="button"
                            variant="secondary"
                          >
                            Devolver
                          </Button>
                          <Button
                            className="h-8 px-3 text-xs"
                            onClick={() =>
                              handleQuantityAction(item, "send_maintenance")
                            }
                            type="button"
                            variant="secondary"
                          >
                            Manutenção
                          </Button>
                          <Button
                            className="h-8 px-3 text-xs"
                            onClick={() =>
                              handleQuantityAction(item, "return_maintenance")
                            }
                            type="button"
                            variant="secondary"
                          >
                            Retirar manutenção
                          </Button>
                          <Button
                            className="h-8 px-3 text-xs"
                            onClick={() => handleQuantityAction(item, "unavailable")}
                            type="button"
                            variant="secondary"
                          >
                            Indisponível
                          </Button>
                          <Button
                            className="h-8 px-3 text-xs"
                            onClick={() => handleEdit(item)}
                            type="button"
                            variant="ghost"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            Editar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
