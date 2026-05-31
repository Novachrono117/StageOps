import { FormEvent, ReactNode, useMemo, useState } from "react";
import { CalendarPlus, Edit3, Plus, Search, Trash2, X } from "lucide-react";

import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Textarea } from "../components/ui/Textarea";
import { eventService } from "../services/eventService";
import type { Client } from "../types/client";
import type { Equipment } from "../types/equipment";
import type {
  Event,
  EventCostFormData,
  EventDailyScheduleFormData,
  EventFormData,
  EventPartnerCompanyFormData,
  EventStatusFilter,
  EventTeamMemberFormData,
  EventTechnicalVisitFormData
} from "../types/event";
import {
  eventAssignmentModeLabels,
  eventAssignmentStageLabels,
  eventCategoryLabels,
  eventStatusLabels,
  eventVehicleFuelTypeLabels,
  eventVehiclePurposeLabels
} from "../types/event";
import {
  calculateDurationInDays,
  eventOverlapsMonth,
  enumerateDateRange,
  formatDatePtBr,
  formatEventPeriod,
  getEventTemporalStatus,
  getMonthLabelPtBr,
  validateEventDateByStatus
} from "../utils/dateUtils";
import {
  calculateFuelCost,
  calculateEventCostSummary,
  calculateTechnicalVisitTotal,
  calculateTechnicalVisitsTotal,
  calculateVehiclesTotal,
  formatCurrencyBr
} from "../utils/fuelUtils";
import { suggestEquipmentFromText } from "../utils/equipmentTextMatcher";
import { createId } from "../utils/id";

type EventsPageProps = {
  clients: Client[];
  equipment: Equipment[];
  events: Event[];
  onEventsChanged: (events: Event[]) => void;
};

type PeriodFilter =
  | "all"
  | "upcoming"
  | "ongoing"
  | "past"
  | "this_month"
  | "next_month"
  | "specific_month";

type EventFormErrors = Partial<Record<keyof EventFormData, string>>;

const emptyCost: EventCostFormData = {
  fuelCost: "",
  foodCost: "",
  laborCost: "",
  otherCost: "",
  notes: ""
};

const initialForm: EventFormData = {
  name: "",
  clientId: "",
  eventCategory: "other",
  eventSubcategory: "",
  eventStartDate: "",
  eventEndDate: "",
  setupStartDate: "",
  setupEndDate: "",
  teardownStartDate: "",
  teardownEndDate: "",
  startTime: "",
  endTime: "",
  status: "draft",
  dailySchedules: [],
  locationName: "",
  address: "",
  city: "",
  state: "",
  locationNotes: "",
  accessNotes: "",
  safetyNotes: "",
  distanceKm: "",
  vehicleConsumptionKmPerLiter: "",
  fuelPricePerLiter: "",
  setupCosts: emptyCost,
  eventDailyCosts: emptyCost,
  teardownCosts: emptyCost,
  technicalVisits: [],
  teamMembers: [],
  partnerCompanies: [],
  vehicles: [],
  visibility: {
    employeesCanView: false,
    freelancersCanView: false,
    partnerCompaniesCanView: false
  },
  equipmentIds: [],
  generalNotes: ""
};

function cloneInitialForm(): EventFormData {
  return {
    ...initialForm,
    setupCosts: { ...emptyCost },
    eventDailyCosts: { ...emptyCost },
    teardownCosts: { ...emptyCost },
    technicalVisits: [],
    teamMembers: [],
    partnerCompanies: [],
    vehicles: [],
    visibility: {
      employeesCanView: false,
      freelancersCanView: false,
      partnerCompaniesCanView: false
    },
    equipmentIds: []
  };
}

function syncDailySchedules(
  currentSchedules: EventDailyScheduleFormData[],
  startDate: string,
  endDate: string
) {
  const existingByDate = new Map(currentSchedules.map((day) => [day.date, day]));

  return enumerateDateRange(startDate, endDate).map((date) => {
    return (
      existingByDate.get(date) ?? {
        id: createId("day"),
        date,
        startTime: "",
        endTime: "",
        title: "",
        notes: "",
        expectedOvertimeHours: "",
        overtimeReason: "",
        estimatedOvertimeCost: ""
      }
    );
  });
}

function toFormNumber(value?: number) {
  return value === undefined ? "" : value.toString();
}

function toVisitForm(visit?: EventTechnicalVisitFormData): EventTechnicalVisitFormData {
  return (
    visit ?? {
      id: createId("visit"),
      visitDate: "",
      responsibleName: "",
      location: "",
      distanceKm: "",
      fuelCost: "",
      vehicleWearCost: "",
      tollCost: "",
      foodCost: "",
      otherCost: "",
      notes: ""
    }
  );
}

function toTeamMemberForm(): EventTeamMemberFormData {
  return {
    id: createId("team"),
    workerType: "freelancer",
    employeeId: "",
    freelancerName: "",
    freelancerPhone: "",
    freelancerDocument: "",
    role: "",
    assignmentStage: "event",
    assignmentMode: "specific_time",
    assignmentStartDate: "",
    assignmentEndDate: "",
    assignmentStartTime: "",
    assignmentEndTime: "",
    dailyRate: "",
    estimatedDays: "",
    notes: "",
    canViewEvent: false
  };
}

function toVehicleForm(): EventFormData["vehicles"][number] {
  return {
    id: createId("vehicle"),
    vehicleName: "",
    vehiclePlate: "",
    fuelType: "other",
    driverEmployeeId: "",
    driverName: "",
    purpose: "event",
    startDate: "",
    endDate: "",
    estimatedDistanceKm: "",
    averageConsumption: "",
    fuelPricePerUnit: "",
    fuelCost: "",
    vehicleWearCost: "",
    tollCost: "",
    otherCost: "",
    notes: ""
  };
}

function toPartnerCompanyForm(): EventPartnerCompanyFormData {
  return {
    id: createId("partner"),
    companyName: "",
    contactName: "",
    contactPhone: "",
    responsibility: "",
    providedItems: "",
    estimatedCost: "",
    notes: "",
    canViewEvent: false,
    canViewEquipmentList: false,
    canViewOperationalNotes: false
  };
}

function validateEventForm(data: EventFormData) {
  const errors: EventFormErrors = {};

  if (data.name.trim().length < 2) {
    errors.name = "Informe um nome de evento com pelo menos 2 caracteres.";
  }
  if (!data.clientId) {
    errors.clientId = "Selecione um cliente.";
  }
  if (!data.eventStartDate) {
    errors.eventStartDate = "Informe a data inicial do evento.";
  }
  if (!data.eventEndDate) {
    errors.eventEndDate = "Informe a data final do evento.";
  }
  if (data.eventStartDate && data.eventEndDate && data.eventEndDate < data.eventStartDate) {
    errors.eventEndDate = "A data final não pode ser anterior à inicial.";
  }
  const statusDateError = validateEventDateByStatus(
    data.status,
    data.eventStartDate,
    data.eventEndDate
  );
  if (statusDateError) {
    errors.status = statusDateError;
  }

  if (data.setupStartDate && data.setupEndDate && data.setupEndDate < data.setupStartDate) {
    errors.setupEndDate = "O fim da montagem não pode ser anterior ao início.";
  }
  if (
    data.teardownStartDate &&
    data.teardownEndDate &&
    data.teardownEndDate < data.teardownStartDate
  ) {
    errors.teardownEndDate = "O fim da desmontagem não pode ser anterior ao início.";
  }

  return errors;
}

export function EventsPage({
  clients,
  equipment,
  events,
  onEventsChanged
}: EventsPageProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [formData, setFormData] = useState<EventFormData>(cloneInitialForm);
  const [errors, setErrors] = useState<EventFormErrors>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [equipmentSearch, setEquipmentSearch] = useState("");
  const [equipmentText, setEquipmentText] = useState("");
  const [suggestedEquipmentIds, setSuggestedEquipmentIds] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<EventStatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | Event["eventCategory"]>("all");
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("all");
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(String(now.getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()));

  const activeClients = clients.filter((client) => client.status === "active");
  const clientNameById = useMemo(
    () => new Map(clients.map((client) => [client.id, client.name])),
    [clients]
  );
  const equipmentById = useMemo(
    () => new Map(equipment.map((item) => [item.id, item])),
    [equipment]
  );
  const getClientName = (clientId: string) =>
    clientNameById.get(clientId) ?? "Cliente não encontrado";

  const filteredEvents = useMemo(
    () =>
      eventService
        .filterEvents(events, getClientName, searchTerm, statusFilter)
        .filter(
          (event) =>
            categoryFilter === "all" || event.eventCategory === categoryFilter
        )
        .filter((event) =>
          matchesPeriodFilter(
            event,
            periodFilter,
            Number(selectedMonth),
            Number(selectedYear)
          )
        )
        .sort((first, second) => {
          if (periodFilter === "past") {
            return second.schedule.eventStartDate.localeCompare(
              first.schedule.eventStartDate
            );
          }

          return first.schedule.eventStartDate.localeCompare(
            second.schedule.eventStartDate
          );
        }),
    [
      categoryFilter,
      events,
      getClientName,
      periodFilter,
      searchTerm,
      selectedMonth,
      selectedYear,
      statusFilter
    ]
  );

  const eventDurationDays = calculateDurationInDays(
    formData.eventStartDate,
    formData.eventEndDate
  );

  const draftCosts = calculateEventCostSummary({
    eventStartDate: formData.eventStartDate,
    eventEndDate: formData.eventEndDate,
    setupCosts: parseCostForPreview(formData.setupCosts),
    eventDailyCosts: parseCostForPreview(formData.eventDailyCosts),
    teardownCosts: parseCostForPreview(formData.teardownCosts),
    technicalVisits: formData.technicalVisits.map((visit) => ({
      id: visit.id,
      visitDate: visit.visitDate,
      fuelCost: toPreviewNumber(visit.fuelCost),
      vehicleWearCost: toPreviewNumber(visit.vehicleWearCost),
      tollCost: toPreviewNumber(visit.tollCost),
      foodCost: toPreviewNumber(visit.foodCost),
      otherCost: toPreviewNumber(visit.otherCost)
    })),
    teamMembers: formData.teamMembers.map((member) => ({
      id: member.id,
      workerType: member.workerType,
      role: member.role,
      assignmentStage: member.assignmentStage,
      assignmentMode: member.assignmentMode,
      dailyRate: toPreviewNumber(member.dailyRate),
      estimatedDays: toPreviewNumber(member.estimatedDays),
      estimatedTotal:
        toPreviewNumber(member.dailyRate) !== undefined &&
        toPreviewNumber(member.estimatedDays) !== undefined
          ? Number(member.dailyRate) * Number(member.estimatedDays)
          : undefined,
      canViewEvent: member.canViewEvent
    })),
    partnerCompanies: formData.partnerCompanies.map((partner) => ({
      id: partner.id,
      companyName: partner.companyName,
      responsibility: partner.responsibility,
      estimatedCost: toPreviewNumber(partner.estimatedCost),
      canViewEvent: partner.canViewEvent,
      canViewEquipmentList: partner.canViewEquipmentList,
      canViewOperationalNotes: partner.canViewOperationalNotes
    })),
    vehicles: formData.vehicles.map((vehicle) => ({
      id: vehicle.id,
      vehicleName: vehicle.vehicleName,
      fuelType: vehicle.fuelType,
      purpose: vehicle.purpose,
      estimatedDistanceKm: toPreviewNumber(vehicle.estimatedDistanceKm),
      averageConsumption: toPreviewNumber(vehicle.averageConsumption),
      fuelPricePerUnit: toPreviewNumber(vehicle.fuelPricePerUnit),
      fuelCost: toPreviewNumber(vehicle.fuelCost),
      vehicleWearCost: toPreviewNumber(vehicle.vehicleWearCost),
      tollCost: toPreviewNumber(vehicle.tollCost),
      otherCost: toPreviewNumber(vehicle.otherCost)
    }))
  });

  const equipmentConflicts = useMemo(() => {
    if (!formData.eventStartDate || !formData.eventEndDate) {
      return [];
    }

    return eventService.findEquipmentConflicts(
      {
        id: editingEventId ?? "new_event",
        name: formData.name,
        schedule: {
          eventStartDate: formData.eventStartDate,
          eventEndDate: formData.eventEndDate
        },
        equipmentIds: formData.equipmentIds
      },
      events,
      equipment
    );
  }, [
    editingEventId,
    equipment,
    events,
    formData.equipmentIds,
    formData.eventEndDate,
    formData.eventStartDate,
    formData.name
  ]);

  const teamConflicts = useMemo(() => {
    if (formData.teamMembers.length === 0) {
      return [];
    }

    return eventService.findTeamConflicts(
      {
        id: editingEventId ?? "new_event",
        name: formData.name,
        schedule: {
          setupStartDate: formData.setupStartDate || undefined,
          setupEndDate: formData.setupEndDate || undefined,
          eventStartDate: formData.eventStartDate,
          eventEndDate: formData.eventEndDate,
          teardownStartDate: formData.teardownStartDate || undefined,
          teardownEndDate: formData.teardownEndDate || undefined
        },
        teamMembers: formData.teamMembers.map((member) => ({
          id: member.id,
          workerType: member.workerType,
          employeeId: member.employeeId || undefined,
          freelancerName: member.freelancerName || undefined,
          freelancerPhone: member.freelancerPhone || undefined,
          role: member.role,
          assignmentStage: member.assignmentStage,
          assignmentMode: member.assignmentMode,
          assignmentStartDate: member.assignmentStartDate || undefined,
          assignmentEndDate: member.assignmentEndDate || undefined,
          assignmentStartTime: member.assignmentStartTime || undefined,
          assignmentEndTime: member.assignmentEndTime || undefined,
          canViewEvent: member.canViewEvent
        }))
      },
      events
    );
  }, [
    editingEventId,
    events,
    formData.eventEndDate,
    formData.eventStartDate,
    formData.name,
    formData.setupEndDate,
    formData.setupStartDate,
    formData.teamMembers,
    formData.teardownEndDate,
    formData.teardownStartDate
  ]);

  const summary = {
    total: events.length,
    confirmed: events.filter((event) => event.status === "confirmed").length,
    preparation: events.filter((event) => event.status === "in_preparation").length,
    completed: events.filter((event) => event.status === "completed").length,
    upcoming: events.filter(
      (event) =>
        event.schedule.eventStartDate >= new Date().toISOString().slice(0, 10) &&
        !["completed", "canceled"].includes(event.status)
    ).length
  };

  const availableEquipment = equipment.filter((item) => {
    const query = equipmentSearch.trim().toLowerCase();
    return !query || item.name.toLowerCase().includes(query);
  });

  function resetForm() {
    setFormData(cloneInitialForm());
    setErrors({});
    setEditingEventId(null);
    setIsFormOpen(false);
    setEquipmentSearch("");
  }

  function upsertEvent(saved: Event) {
    const exists = events.some((event) => event.id === saved.id);
    const nextEvents = exists
      ? events.map((event) => (event.id === saved.id ? saved : event))
      : [saved, ...events];
    onEventsChanged(nextEvents);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateEventForm(formData);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const saved = editingEventId
        ? await eventService.updateEvent(editingEventId, formData)
        : await eventService.createEvent(formData);
      upsertEvent(saved);
      resetForm();
      setFeedback(
        editingEventId
          ? "Evento atualizado com sucesso."
          : "Evento cadastrado com sucesso."
      );
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar o evento. Tente novamente."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleEdit(event: Event) {
    setEditingEventId(event.id);
    setFormData({
      name: event.name,
      clientId: event.clientId,
      eventCategory: event.eventCategory,
      eventSubcategory: event.eventSubcategory ?? "",
      eventStartDate: event.schedule.eventStartDate,
      eventEndDate: event.schedule.eventEndDate,
      setupStartDate: event.schedule.setupStartDate ?? "",
      setupEndDate: event.schedule.setupEndDate ?? "",
      teardownStartDate: event.schedule.teardownStartDate ?? "",
      teardownEndDate: event.schedule.teardownEndDate ?? "",
      startTime: event.startTime ?? "",
      endTime: event.endTime ?? "",
      status: event.status,
      dailySchedules: event.dailySchedules.map((day) => ({
        id: day.id,
        date: day.date,
        startTime: day.startTime ?? "",
        endTime: day.endTime ?? "",
        title: day.title ?? "",
        notes: day.notes ?? "",
        expectedOvertimeHours: toFormNumber(day.expectedOvertimeHours),
        overtimeReason: day.overtimeReason ?? "",
        estimatedOvertimeCost: toFormNumber(day.estimatedOvertimeCost)
      })),
      locationName: event.locationName ?? "",
      address: event.address ?? "",
      city: event.city ?? "",
      state: event.state ?? "",
      locationNotes: event.locationNotes ?? "",
      accessNotes: event.accessNotes ?? "",
      safetyNotes: event.safetyNotes ?? "",
      distanceKm: toFormNumber(event.distanceKm),
      vehicleConsumptionKmPerLiter: toFormNumber(event.vehicleConsumptionKmPerLiter),
      fuelPricePerLiter: toFormNumber(event.fuelPricePerLiter),
      setupCosts: costToForm(event.setupCosts),
      eventDailyCosts: costToForm(event.eventDailyCosts),
      teardownCosts: costToForm(event.teardownCosts),
      technicalVisits: event.technicalVisits.map((visit) => ({
        id: visit.id,
        visitDate: visit.visitDate,
        responsibleName: visit.responsibleName ?? "",
        location: visit.location ?? "",
        distanceKm: toFormNumber(visit.distanceKm),
        fuelCost: toFormNumber(visit.fuelCost),
        vehicleWearCost: toFormNumber(visit.vehicleWearCost),
        tollCost: toFormNumber(visit.tollCost),
        foodCost: toFormNumber(visit.foodCost),
        otherCost: toFormNumber(visit.otherCost),
        notes: visit.notes ?? ""
      })),
      teamMembers: event.teamMembers.map((member) => ({
        id: member.id,
        workerType: member.workerType,
        employeeId: member.employeeId ?? "",
        freelancerName: member.freelancerName ?? "",
        freelancerPhone: member.freelancerPhone ?? "",
        freelancerDocument: member.freelancerDocument ?? "",
        role: member.role,
        assignmentStage: member.assignmentStage,
        assignmentMode: member.assignmentMode,
        assignmentStartDate: member.assignmentStartDate ?? "",
        assignmentEndDate: member.assignmentEndDate ?? "",
        assignmentStartTime: member.assignmentStartTime ?? "",
        assignmentEndTime: member.assignmentEndTime ?? "",
        dailyRate: toFormNumber(member.dailyRate),
        estimatedDays: toFormNumber(member.estimatedDays),
        notes: member.notes ?? "",
        canViewEvent: member.canViewEvent
      })),
      partnerCompanies: event.partnerCompanies.map((partner) => ({
        id: partner.id,
        companyName: partner.companyName,
        contactName: partner.contactName ?? "",
        contactPhone: partner.contactPhone ?? "",
        responsibility: partner.responsibility,
        providedItems: partner.providedItems ?? "",
        estimatedCost: toFormNumber(partner.estimatedCost),
        notes: partner.notes ?? "",
        canViewEvent: partner.canViewEvent,
        canViewEquipmentList: partner.canViewEquipmentList,
        canViewOperationalNotes: partner.canViewOperationalNotes
      })),
      vehicles: event.vehicles.map((vehicle) => ({
        id: vehicle.id,
        vehicleName: vehicle.vehicleName,
        vehiclePlate: vehicle.vehiclePlate ?? "",
        fuelType: vehicle.fuelType ?? "other",
        driverEmployeeId: vehicle.driverEmployeeId ?? "",
        driverName: vehicle.driverName ?? "",
        purpose: vehicle.purpose,
        startDate: vehicle.startDate ?? "",
        endDate: vehicle.endDate ?? "",
        estimatedDistanceKm: toFormNumber(vehicle.estimatedDistanceKm),
        averageConsumption: toFormNumber(vehicle.averageConsumption),
        fuelPricePerUnit: toFormNumber(vehicle.fuelPricePerUnit),
        fuelCost: toFormNumber(vehicle.fuelCost),
        vehicleWearCost: toFormNumber(vehicle.vehicleWearCost),
        tollCost: toFormNumber(vehicle.tollCost),
        otherCost: toFormNumber(vehicle.otherCost),
        notes: vehicle.notes ?? ""
      })),
      visibility: event.visibility,
      equipmentIds: event.equipmentIds,
      generalNotes: event.generalNotes ?? ""
    });
    setErrors({});
    setFeedback(null);
    setIsFormOpen(true);
  }

  async function handleDelete(event: Event) {
    const confirmed = window.confirm(
      "Deseja excluir este evento apenas deste ambiente local? Esta ação não pode ser desfeita."
    );

    if (!confirmed) {
      return;
    }

    try {
      await eventService.deleteEvent(event.id);
      onEventsChanged(events.filter((item) => item.id !== event.id));
      setFeedback("Evento excluído localmente com sucesso.");
    } catch {
      setFeedback("Não foi possível excluir o evento.");
    }
  }

  function updateCost(section: "setupCosts" | "eventDailyCosts" | "teardownCosts", field: keyof EventCostFormData, value: string) {
    setFormData((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [field]: value
      }
    }));
  }

  function updateVisit(id: string, field: keyof EventTechnicalVisitFormData, value: string) {
    setFormData((current) => ({
      ...current,
      technicalVisits: current.technicalVisits.map((visit) =>
        visit.id === id ? { ...visit, [field]: value } : visit
      )
    }));
  }

  function updateTeamMember(
    id: string,
    field: keyof EventTeamMemberFormData,
    value: string | boolean
  ) {
    setFormData((current) => ({
      ...current,
      teamMembers: current.teamMembers.map((member) =>
        member.id === id ? { ...member, [field]: value } : member
      )
    }));
  }

  function updatePartnerCompany(
    id: string,
    field: keyof EventPartnerCompanyFormData,
    value: string | boolean
  ) {
    setFormData((current) => ({
      ...current,
      partnerCompanies: current.partnerCompanies.map((partner) =>
        partner.id === id ? { ...partner, [field]: value } : partner
      )
    }));
  }

  function updateDailySchedule(
    id: string,
    field: keyof EventDailyScheduleFormData,
    value: string
  ) {
    setFormData((current) => ({
      ...current,
      dailySchedules: current.dailySchedules.map((day) =>
        day.id === id ? { ...day, [field]: value } : day
      )
    }));
  }

  function updateVehicle(
    id: string,
    field: keyof EventFormData["vehicles"][number],
    value: string
  ) {
    setFormData((current) => ({
      ...current,
      vehicles: current.vehicles.map((vehicle) => {
        if (vehicle.id !== id) {
          return vehicle;
        }

        const nextVehicle = { ...vehicle, [field]: value };

        if (
          ["estimatedDistanceKm", "averageConsumption", "fuelPricePerUnit", "fuelType"].includes(
            field
          ) &&
          canAutoCalculateVehicleFuel(nextVehicle.fuelType)
        ) {
          const calculatedFuelCost = calculateVehicleFuelPreview(nextVehicle);
          nextVehicle.fuelCost =
            calculatedFuelCost === undefined
              ? field === "fuelType"
                ? nextVehicle.fuelCost
                : ""
              : calculatedFuelCost.toFixed(2);
        }

        return nextVehicle;
      })
    }));
  }

  function identifyEquipmentFromText() {
    const suggestions = suggestEquipmentFromText(equipmentText, equipment).map(
      (item) => item.id
    );
    setSuggestedEquipmentIds(Array.from(new Set(suggestions)));
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-6">
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <span className="rounded-full border border-stage-line bg-white/5 px-3 py-1 text-xs font-semibold text-stage-muted">
            Operação de eventos
          </span>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
            Eventos
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-stage-muted">
            Eventos podem compartilhar a mesma data. Alertas aparecem apenas
            quando equipamentos selecionados têm período conflitante.
          </p>
        </div>
        <Button
          disabled={activeClients.length === 0}
          onClick={() => {
            setFormData(cloneInitialForm());
            setEditingEventId(null);
            setErrors({});
            setFeedback(null);
            setIsFormOpen(true);
          }}
          type="button"
        >
          <CalendarPlus className="h-4 w-4" />
          Adicionar evento
        </Button>
      </header>

      {activeClients.length === 0 ? (
        <div className="rounded-xl border border-stage-line bg-white/5 px-4 py-3 text-sm text-stage-muted">
          Cadastre ao menos um cliente ativo antes de criar eventos.
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ["Total de eventos", summary.total],
          ["Confirmados", summary.confirmed],
          ["Em preparação", summary.preparation],
          ["Concluídos", summary.completed],
          ["Próximos eventos", summary.upcoming]
        ].map(([label, value]) => (
          <Card className="p-5" key={label}>
            <p className="text-sm text-stage-muted">{label}</p>
            <p className="mt-4 text-3xl font-black">{value}</p>
          </Card>
        ))}
      </section>

      {feedback ? (
        <div className="rounded-xl border border-stage-line bg-white/5 px-4 py-3 text-sm text-stage-muted">
          {feedback}
        </div>
      ) : null}

      {isFormOpen ? (
        <Card className="p-5">
          <form className="grid gap-6" onSubmit={handleSubmit}>
            <h2 className="text-lg font-bold">
              {editingEventId ? "Editar evento" : "Novo evento"}
            </h2>

            <div className="grid gap-4 lg:grid-cols-3">
              <Input
                error={errors.name}
                label="Nome do evento"
                onChange={(event) =>
                  setFormData((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="Ex: Convenção anual"
                value={formData.name}
              />
              <Select
                error={errors.clientId}
                label="Cliente"
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    clientId: event.target.value
                  }))
                }
                value={formData.clientId}
              >
                <option value="">Selecione</option>
                {activeClients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </Select>
              <Select
                label="Categoria do evento"
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    eventCategory: event.target.value as Event["eventCategory"]
                  }))
                }
                value={formData.eventCategory}
              >
                {Object.entries(eventCategoryLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
              <Input
                label="Subcategoria do evento"
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    eventSubcategory: event.target.value
                  }))
                }
                placeholder="Ex: congresso, casamento, show"
                value={formData.eventSubcategory}
              />
              <Select
                error={errors.status}
                label="Status"
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    status: event.target.value as EventFormData["status"]
                  }))
                }
                value={formData.status}
              >
                {Object.entries(eventStatusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>

            <SectionTitle title="Agenda do evento" />
            <div className="grid gap-4 md:grid-cols-4">
              <Input
                error={errors.eventStartDate}
                label="Data inicial do evento"
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    eventStartDate: event.target.value,
                    eventEndDate: current.eventEndDate || event.target.value,
                    dailySchedules: syncDailySchedules(
                      current.dailySchedules,
                      event.target.value,
                      current.eventEndDate || event.target.value
                    )
                  }))
                }
                type="date"
                value={formData.eventStartDate}
              />
              <Input
                error={errors.eventEndDate}
                label="Data final do evento"
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    eventEndDate: event.target.value,
                    dailySchedules: syncDailySchedules(
                      current.dailySchedules,
                      current.eventStartDate,
                      event.target.value
                    )
                  }))
                }
                type="date"
                value={formData.eventEndDate}
              />
              <Input
                label="Início opcional"
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    startTime: event.target.value
                  }))
                }
                type="time"
                value={formData.startTime}
              />
              <Input
                label="Término opcional"
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    endTime: event.target.value
                  }))
                }
                type="time"
                value={formData.endTime}
              />
            </div>
            <p className="text-sm text-stage-muted">
              {formData.eventStartDate && formData.eventEndDate
                ? `${formatEventPeriod(
                    formData.eventStartDate,
                    formData.eventEndDate
                  )} (${eventDurationDays} dia${eventDurationDays === 1 ? "" : "s"})`
                : "Informe o período para calcular a duração."}
            </p>
            <p className="text-xs text-stage-muted">
              Para registrar um evento antigo, use o status Finalizado ou Cancelado.
            </p>

            <SectionTitle title="Agenda diária" />
            <div className="grid gap-3">
              {formData.dailySchedules.length === 0 ? (
                <p className="rounded-xl border border-stage-line bg-white/5 p-4 text-sm text-stage-muted">
                  Informe o período do evento para gerar os dias da agenda.
                </p>
              ) : (
                formData.dailySchedules.map((day) => (
                  <div className="rounded-xl border border-stage-line bg-white/5 p-4" key={day.id}>
                    <div className="grid gap-4 md:grid-cols-4">
                      <Input label="Data" readOnly value={formatDatePtBr(day.date)} />
                      <Input label="Início" type="time" value={day.startTime} onChange={(event) => updateDailySchedule(day.id, "startTime", event.target.value)} />
                      <Input label="Término" type="time" value={day.endTime} onChange={(event) => updateDailySchedule(day.id, "endTime", event.target.value)} />
                      <Input label="Título opcional" value={day.title} onChange={(event) => updateDailySchedule(day.id, "title", event.target.value)} />
                    </div>
                    <div className="mt-4 grid gap-4 md:grid-cols-3">
                      <DecimalInput label="Hora extra prevista" value={day.expectedOvertimeHours} onChange={(value) => updateDailySchedule(day.id, "expectedOvertimeHours", value)} />
                      <DecimalInput label="Custo estimado da hora extra" step="0.01" value={day.estimatedOvertimeCost} onChange={(value) => updateDailySchedule(day.id, "estimatedOvertimeCost", value)} />
                      <Input label="Motivo da hora extra" value={day.overtimeReason} onChange={(event) => updateDailySchedule(day.id, "overtimeReason", event.target.value)} />
                    </div>
                    <Textarea className="mt-4" label="Observação do dia" maxLength={700} value={day.notes} onChange={(event) => updateDailySchedule(day.id, "notes", event.target.value)} />
                  </div>
                ))
              )}
            </div>

            <SectionTitle title="Operação" />
            <div className="grid gap-4 md:grid-cols-4">
              <Input
                label="Início da montagem"
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    setupStartDate: event.target.value
                  }))
                }
                type="date"
                value={formData.setupStartDate}
              />
              <Input
                error={errors.setupEndDate}
                label="Fim da montagem"
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    setupEndDate: event.target.value
                  }))
                }
                type="date"
                value={formData.setupEndDate}
              />
              <Input
                label="Início da desmontagem"
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    teardownStartDate: event.target.value
                  }))
                }
                type="date"
                value={formData.teardownStartDate}
              />
              <Input
                error={errors.teardownEndDate}
                label="Fim da desmontagem"
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    teardownEndDate: event.target.value
                  }))
                }
                type="date"
                value={formData.teardownEndDate}
              />
            </div>

            <SectionTitle title="Local" />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Input label="Local" value={formData.locationName} onChange={(event) => setFormData((current) => ({ ...current, locationName: event.target.value }))} />
              <Input label="Endereço" value={formData.address} onChange={(event) => setFormData((current) => ({ ...current, address: event.target.value }))} />
              <Input label="Cidade" value={formData.city} onChange={(event) => setFormData((current) => ({ ...current, city: event.target.value }))} />
              <Input label="UF" maxLength={2} value={formData.state} onChange={(event) => setFormData((current) => ({ ...current, state: event.target.value }))} />
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              <Textarea label="Observações do local" maxLength={700} placeholder="Montagem permitida após 14h. Elevador de carga disponível." value={formData.locationNotes} onChange={(event) => setFormData((current) => ({ ...current, locationNotes: event.target.value }))} />
              <Textarea label="Acesso, carga e descarga" maxLength={700} placeholder="Acesso pela doca lateral. Estacionamento para caminhão." value={formData.accessNotes} onChange={(event) => setFormData((current) => ({ ...current, accessNotes: event.target.value }))} />
              <Textarea label="Segurança, EPI e credenciamento" maxLength={700} placeholder="Necessário colete e capacete. Credenciamento na portaria." value={formData.safetyNotes} onChange={(event) => setFormData((current) => ({ ...current, safetyNotes: event.target.value }))} />
            </div>

            <SectionTitle title="Custos estimados por etapa" />
            <div className="grid gap-4 xl:grid-cols-3">
              <CostFields title="Montagem (total da etapa)" values={formData.setupCosts} onChange={(field, value) => updateCost("setupCosts", field, value)} />
              <CostFields title="Evento (custo diário)" values={formData.eventDailyCosts} onChange={(field, value) => updateCost("eventDailyCosts", field, value)} />
              <CostFields title="Desmontagem (total da etapa)" values={formData.teardownCosts} onChange={(field, value) => updateCost("teardownCosts", field, value)} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <CostCard label="Montagem" value={draftCosts.setupTotal} />
              <CostCard label="Diário do evento" value={draftCosts.eventDailyTotal} />
              <CostCard label="Total do período" value={draftCosts.eventPeriodTotal} />
              <CostCard label="Desmontagem" value={draftCosts.teardownTotal} />
              <CostCard label="Total operacional" value={draftCosts.operationalTotal} />
            </div>

            <SectionTitle title="Visita técnica" />
            <div className="grid gap-3">
              {formData.technicalVisits.length === 0 ? (
                <p className="rounded-xl border border-stage-line bg-white/5 p-4 text-sm text-stage-muted">
                  Nenhuma visita técnica registrada.
                </p>
              ) : (
                formData.technicalVisits.map((visit, index) => (
                  <div className="rounded-xl border border-stage-line bg-white/5 p-4" key={visit.id}>
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h3 className="font-bold">Visita técnica {index + 1}</h3>
                      <Button
                        className="h-8 px-3 text-xs"
                        onClick={() =>
                          setFormData((current) => ({
                            ...current,
                            technicalVisits: current.technicalVisits.filter(
                              (item) => item.id !== visit.id
                            )
                          }))
                        }
                        type="button"
                        variant="secondary"
                      >
                        <X className="h-3.5 w-3.5" />
                        Remover
                      </Button>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                      <Input label="Data da visita" type="date" value={visit.visitDate} onChange={(event) => updateVisit(visit.id, "visitDate", event.target.value)} />
                      <Input label="Responsável" value={visit.responsibleName} onChange={(event) => updateVisit(visit.id, "responsibleName", event.target.value)} />
                      <Input label="Local visitado" value={visit.location} onChange={(event) => updateVisit(visit.id, "location", event.target.value)} />
                    </div>
                    <div className="mt-4 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
                      <DecimalInput label="Distância km" value={visit.distanceKm} onChange={(value) => updateVisit(visit.id, "distanceKm", value)} />
                      <DecimalInput label="Combustível" step="0.01" value={visit.fuelCost} onChange={(value) => updateVisit(visit.id, "fuelCost", value)} />
                      <DecimalInput label="Reserva de manutenção/desgaste do veículo" step="0.01" value={visit.vehicleWearCost} onChange={(value) => updateVisit(visit.id, "vehicleWearCost", value)} />
                      <DecimalInput label="Pedágio" step="0.01" value={visit.tollCost} onChange={(value) => updateVisit(visit.id, "tollCost", value)} />
                      <DecimalInput label="Alimentação" step="0.01" value={visit.foodCost} onChange={(value) => updateVisit(visit.id, "foodCost", value)} />
                      <DecimalInput label="Outros" step="0.01" value={visit.otherCost} onChange={(value) => updateVisit(visit.id, "otherCost", value)} />
                    </div>
                    <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_180px]">
                      <Textarea label="Observações técnicas" maxLength={700} value={visit.notes} onChange={(event) => updateVisit(visit.id, "notes", event.target.value)} />
                      <CostCard label="Total da visita" value={calculateTechnicalVisitTotal({
                        id: visit.id,
                        visitDate: visit.visitDate,
                        fuelCost: toPreviewNumber(visit.fuelCost),
                        vehicleWearCost: toPreviewNumber(visit.vehicleWearCost),
                        tollCost: toPreviewNumber(visit.tollCost),
                        foodCost: toPreviewNumber(visit.foodCost),
                        otherCost: toPreviewNumber(visit.otherCost)
                      })} />
                    </div>
                  </div>
                ))
              )}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  onClick={() =>
                    setFormData((current) => ({
                      ...current,
                      technicalVisits: [
                        ...current.technicalVisits,
                        toVisitForm()
                      ]
                    }))
                  }
                  type="button"
                  variant="secondary"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar visita técnica
                </Button>
                <p className="text-sm text-stage-muted">
                  Total das visitas: {formatCurrencyBr(draftCosts.technicalVisitsTotal)}
                </p>
              </div>
            </div>

            <SectionTitle title="Equipe" />
            <div className="grid gap-3">
              {formData.teamMembers.length === 0 ? (
                <p className="rounded-xl border border-stage-line bg-white/5 p-4 text-sm text-stage-muted">
                  Nenhuma pessoa alocada.
                </p>
              ) : (
                formData.teamMembers.map((member, index) => (
                  <div className="rounded-xl border border-stage-line bg-white/5 p-4" key={member.id}>
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h3 className="font-bold">Pessoa alocada {index + 1}</h3>
                      <Button
                        className="h-8 px-3 text-xs"
                        onClick={() =>
                          setFormData((current) => ({
                            ...current,
                            teamMembers: current.teamMembers.filter(
                              (item) => item.id !== member.id
                            )
                          }))
                        }
                        type="button"
                        variant="secondary"
                      >
                        <X className="h-3.5 w-3.5" />
                        Remover
                      </Button>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                      <Select label="Tipo" value={member.workerType} onChange={(event) => updateTeamMember(member.id, "workerType", event.target.value)}>
                        <option value="employee">Funcionário CLT</option>
                        <option value="freelancer">Freelancer</option>
                      </Select>
                      {member.workerType === "employee" ? (
                        <Input label="Funcionário cadastrado (ID)" value={member.employeeId} onChange={(event) => updateTeamMember(member.id, "employeeId", event.target.value)} placeholder="employeeId futuro" />
                      ) : (
                        <>
                          <Input label="Nome do freelancer" value={member.freelancerName} onChange={(event) => updateTeamMember(member.id, "freelancerName", event.target.value)} />
                          <Input label="Telefone do freelancer" value={member.freelancerPhone} onChange={(event) => updateTeamMember(member.id, "freelancerPhone", event.target.value)} />
                        </>
                      )}
                      <Input label="Função no evento" value={member.role} onChange={(event) => updateTeamMember(member.id, "role", event.target.value)} placeholder="Técnico de áudio" />
                    </div>
                    <div className="mt-4 grid gap-4 md:grid-cols-3">
                      <Select label="Etapa" value={member.assignmentStage} onChange={(event) => updateTeamMember(member.id, "assignmentStage", event.target.value)}>
                        {Object.entries(eventAssignmentStageLabels).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </Select>
                      <Select label="Modo" value={member.assignmentMode} onChange={(event) => updateTeamMember(member.id, "assignmentMode", event.target.value)}>
                        {Object.entries(eventAssignmentModeLabels).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </Select>
                      {member.workerType === "freelancer" ? (
                        <Input label="Documento opcional" value={member.freelancerDocument} onChange={(event) => updateTeamMember(member.id, "freelancerDocument", event.target.value)} />
                      ) : null}
                    </div>
                    <div className="mt-4 grid gap-4 md:grid-cols-4">
                      <Input label="Início da alocação" type="date" value={member.assignmentStartDate} onChange={(event) => updateTeamMember(member.id, "assignmentStartDate", event.target.value)} />
                      <Input label="Fim da alocação" type="date" value={member.assignmentEndDate} onChange={(event) => updateTeamMember(member.id, "assignmentEndDate", event.target.value)} />
                      <Input label="Hora inicial" type="time" value={member.assignmentStartTime} onChange={(event) => updateTeamMember(member.id, "assignmentStartTime", event.target.value)} />
                      <Input label="Hora final" type="time" value={member.assignmentEndTime} onChange={(event) => updateTeamMember(member.id, "assignmentEndTime", event.target.value)} />
                    </div>
                    {member.workerType === "freelancer" ? (
                      <div className="mt-4 grid gap-4 md:grid-cols-3">
                        <DecimalInput label="Valor da diária" step="0.01" value={member.dailyRate} onChange={(value) => updateTeamMember(member.id, "dailyRate", value)} />
                        <DecimalInput label="Dias estimados" value={member.estimatedDays} onChange={(value) => updateTeamMember(member.id, "estimatedDays", value)} />
                        <CostCard label="Total freelancer" value={(toPreviewNumber(member.dailyRate) ?? 0) * (toPreviewNumber(member.estimatedDays) ?? 0)} />
                      </div>
                    ) : null}
                    <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_220px]">
                      <Textarea label="Observações" maxLength={700} value={member.notes} onChange={(event) => updateTeamMember(member.id, "notes", event.target.value)} />
                      <label className="flex items-center gap-2 rounded-xl border border-stage-line p-4 text-sm">
                        <input checked={member.canViewEvent} onChange={(event) => updateTeamMember(member.id, "canViewEvent", event.target.checked)} type="checkbox" />
                        Pode visualizar o evento
                      </label>
                    </div>
                  </div>
                ))
              )}
              <Button
                onClick={() =>
                  setFormData((current) => ({
                    ...current,
                    teamMembers: [...current.teamMembers, toTeamMemberForm()]
                  }))
                }
                type="button"
                variant="secondary"
              >
                <Plus className="h-4 w-4" />
                Adicionar pessoa à equipe
              </Button>
              {teamConflicts.length > 0 ? (
                <div className="rounded-xl border border-stage-amber/40 bg-stage-amber/10 p-3 text-sm text-stage-amber">
                  {teamConflicts.map((conflict) => (
                    <p key={`${conflict.eventId}-${conflict.teamMemberId}`}>
                      {conflict.isInformational ? "Aviso" : "Conflito"}: {conflict.personName} também está em {conflict.eventName} ({conflict.periodLabel}).
                    </p>
                  ))}
                </div>
              ) : null}
            </div>

            <SectionTitle title="Empresas parceiras" />
            <div className="grid gap-3">
              {formData.partnerCompanies.length === 0 ? (
                <p className="rounded-xl border border-stage-line bg-white/5 p-4 text-sm text-stage-muted">
                  Nenhuma empresa parceira vinculada.
                </p>
              ) : (
                formData.partnerCompanies.map((partner, index) => (
                  <div className="rounded-xl border border-stage-line bg-white/5 p-4" key={partner.id}>
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h3 className="font-bold">Empresa parceira {index + 1}</h3>
                      <Button className="h-8 px-3 text-xs" onClick={() => setFormData((current) => ({ ...current, partnerCompanies: current.partnerCompanies.filter((item) => item.id !== partner.id) }))} type="button" variant="secondary">
                        <X className="h-3.5 w-3.5" />
                        Remover
                      </Button>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                      <Input label="Nome da empresa" value={partner.companyName} onChange={(event) => updatePartnerCompany(partner.id, "companyName", event.target.value)} />
                      <Input label="Contato" value={partner.contactName} onChange={(event) => updatePartnerCompany(partner.id, "contactName", event.target.value)} />
                      <Input label="Telefone do contato" value={partner.contactPhone} onChange={(event) => updatePartnerCompany(partner.id, "contactPhone", event.target.value)} />
                    </div>
                    <div className="mt-4 grid gap-4 md:grid-cols-3">
                      <Input label="Responsabilidade" value={partner.responsibility} onChange={(event) => updatePartnerCompany(partner.id, "responsibility", event.target.value)} />
                      <Input label="Itens/equipamentos/serviços" value={partner.providedItems} onChange={(event) => updatePartnerCompany(partner.id, "providedItems", event.target.value)} />
                      <DecimalInput label="Custo estimado" step="0.01" value={partner.estimatedCost} onChange={(value) => updatePartnerCompany(partner.id, "estimatedCost", value)} />
                    </div>
                    <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr]">
                      <Textarea label="Observações" maxLength={700} value={partner.notes} onChange={(event) => updatePartnerCompany(partner.id, "notes", event.target.value)} />
                      <div className="grid gap-2 rounded-xl border border-stage-line p-4 text-sm">
                        <label className="flex items-center gap-2"><input checked={partner.canViewEvent} onChange={(event) => updatePartnerCompany(partner.id, "canViewEvent", event.target.checked)} type="checkbox" />Pode visualizar evento</label>
                        <label className="flex items-center gap-2"><input checked={partner.canViewEquipmentList} onChange={(event) => updatePartnerCompany(partner.id, "canViewEquipmentList", event.target.checked)} type="checkbox" />Pode visualizar lista de equipamentos</label>
                        <label className="flex items-center gap-2"><input checked={partner.canViewOperationalNotes} onChange={(event) => updatePartnerCompany(partner.id, "canViewOperationalNotes", event.target.checked)} type="checkbox" />Pode visualizar observações operacionais</label>
                      </div>
                    </div>
                  </div>
                ))
              )}
              <Button onClick={() => setFormData((current) => ({ ...current, partnerCompanies: [...current.partnerCompanies, toPartnerCompanyForm()] }))} type="button" variant="secondary">
                <Plus className="h-4 w-4" />
                Adicionar empresa parceira
              </Button>
            </div>

            <SectionTitle title="Veículos do evento" />
            <div className="grid gap-3">
              {formData.vehicles.length === 0 ? (
                <p className="rounded-xl border border-stage-line bg-white/5 p-4 text-sm text-stage-muted">
                  Nenhum veículo vinculado.
                </p>
              ) : (
                formData.vehicles.map((vehicle, index) => (
                  <div className="rounded-xl border border-stage-line bg-white/5 p-4" key={vehicle.id}>
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h3 className="font-bold">Veículo {index + 1}</h3>
                      <Button className="h-8 px-3 text-xs" onClick={() => setFormData((current) => ({ ...current, vehicles: current.vehicles.filter((item) => item.id !== vehicle.id) }))} type="button" variant="secondary">
                        <X className="h-3.5 w-3.5" />
                        Remover
                      </Button>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                      <Input label="Nome do veículo" value={vehicle.vehicleName} onChange={(event) => updateVehicle(vehicle.id, "vehicleName", event.target.value)} />
                      <Input label="Placa opcional" value={vehicle.vehiclePlate} onChange={(event) => updateVehicle(vehicle.id, "vehiclePlate", event.target.value)} />
                      <Select label="Finalidade" value={vehicle.purpose} onChange={(event) => updateVehicle(vehicle.id, "purpose", event.target.value)}>
                        {Object.entries(eventVehiclePurposeLabels).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </Select>
                    </div>
                    <div className="mt-4 grid gap-4 md:grid-cols-4">
                      <Input label="Motorista livre" value={vehicle.driverName} onChange={(event) => updateVehicle(vehicle.id, "driverName", event.target.value)} />
                      <Input label="employeeId motorista" value={vehicle.driverEmployeeId} onChange={(event) => updateVehicle(vehicle.id, "driverEmployeeId", event.target.value)} />
                      <Input label="Data inicial" type="date" value={vehicle.startDate} onChange={(event) => updateVehicle(vehicle.id, "startDate", event.target.value)} />
                      <Input label="Data final" type="date" value={vehicle.endDate} onChange={(event) => updateVehicle(vehicle.id, "endDate", event.target.value)} />
                    </div>
                    <div className="mt-4 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
                      <DecimalInput label="Distância estimada total (km)" value={vehicle.estimatedDistanceKm} onChange={(value) => updateVehicle(vehicle.id, "estimatedDistanceKm", value)} />
                      <Select label="Tipo de combustível" value={vehicle.fuelType} onChange={(event) => updateVehicle(vehicle.id, "fuelType", event.target.value)}>
                        {Object.entries(eventVehicleFuelTypeLabels).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </Select>
                      <DecimalInput label="Consumo médio (km/L)" value={vehicle.averageConsumption} onChange={(value) => updateVehicle(vehicle.id, "averageConsumption", value)} />
                      <DecimalInput label="Preço do combustível (R$/L)" step="0.01" value={vehicle.fuelPricePerUnit} onChange={(value) => updateVehicle(vehicle.id, "fuelPricePerUnit", value)} />
                      <DecimalInput label="Custo estimado de combustível" step="0.01" value={vehicle.fuelCost} onChange={(value) => updateVehicle(vehicle.id, "fuelCost", value)} />
                      <DecimalInput label="Reserva de manutenção/desgaste do veículo" step="0.01" value={vehicle.vehicleWearCost} onChange={(value) => updateVehicle(vehicle.id, "vehicleWearCost", value)} />
                      <DecimalInput label="Pedágio" step="0.01" value={vehicle.tollCost} onChange={(value) => updateVehicle(vehicle.id, "tollCost", value)} />
                      <DecimalInput label="Outros" step="0.01" value={vehicle.otherCost} onChange={(value) => updateVehicle(vehicle.id, "otherCost", value)} />
                    </div>
                    <p className="mt-3 text-sm text-stage-muted">
                      Cálculo automático: {formatCurrencyBr(calculateVehicleFuelPreview(vehicle))}. Para diesel, gasolina, etanol e flex, o custo é atualizado ao alterar distância, consumo ou preço.
                    </p>
                    <Textarea className="mt-4" label="Observações do veículo" maxLength={700} value={vehicle.notes} onChange={(event) => updateVehicle(vehicle.id, "notes", event.target.value)} />
                  </div>
                ))
              )}
              <Button onClick={() => setFormData((current) => ({ ...current, vehicles: [...current.vehicles, toVehicleForm()] }))} type="button" variant="secondary">
                <Plus className="h-4 w-4" />
                Adicionar veículo
              </Button>
              <p className="text-sm text-stage-muted">
                Total estimado de veículos: {formatCurrencyBr(draftCosts.vehiclesTotal)}
              </p>
            </div>

            <SectionTitle title="Equipamentos vinculados" />
            <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
              <div className="rounded-xl border border-stage-line bg-white/5 p-4">
                <Input
                  label="Buscar equipamentos"
                  placeholder="Nome do equipamento"
                  value={equipmentSearch}
                  onChange={(event) => setEquipmentSearch(event.target.value)}
                />
                <div className="mt-4 grid max-h-64 gap-2 overflow-y-auto">
                  {availableEquipment.map((item) => {
                    const checked = formData.equipmentIds.includes(item.id);
                    return (
                      <label className="flex items-center gap-3 rounded-lg border border-stage-line px-3 py-2 text-sm" key={item.id}>
                        <input
                          checked={checked}
                          onChange={(event) =>
                            setFormData((current) => ({
                              ...current,
                              equipmentIds: event.target.checked
                                ? [...current.equipmentIds, item.id]
                                : current.equipmentIds.filter((id) => id !== item.id)
                            }))
                          }
                          type="checkbox"
                        />
                        {item.name}
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="rounded-xl border border-stage-line bg-white/5 p-4">
                <h3 className="font-bold">Selecionados</h3>
                {formData.equipmentIds.length === 0 ? (
                  <p className="mt-3 text-sm text-stage-muted">Nenhum equipamento vinculado.</p>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {formData.equipmentIds.map((equipmentId) => (
                      <span className="inline-flex items-center gap-2 rounded-full border border-stage-line px-3 py-1 text-xs" key={equipmentId}>
                        {equipmentById.get(equipmentId)?.name ?? "Equipamento"}
                        <button
                          onClick={() =>
                            setFormData((current) => ({
                              ...current,
                              equipmentIds: current.equipmentIds.filter(
                                (id) => id !== equipmentId
                              )
                            }))
                          }
                          type="button"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {equipmentConflicts.length > 0 ? (
                  <div className="mt-4 rounded-xl border border-stage-amber/40 bg-stage-amber/10 p-3 text-sm text-stage-amber">
                    {equipmentConflicts.map((conflict) => (
                      <p key={`${conflict.eventId}-${conflict.equipmentId}`}>
                        {conflict.equipmentName} conflita com o evento {conflict.eventName}.
                      </p>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            <SectionTitle title="Identificar equipamentos pelo texto" />
            <div className="grid gap-4 rounded-xl border border-stage-line bg-white/5 p-4">
              <Textarea
                label="Texto de proposta, briefing ou conversa"
                onChange={(event) => setEquipmentText(event.target.value)}
                placeholder="Cole aqui o texto do orçamento ou conversa. Ex: painel de LED P3, mesa X32, microfones sem fio..."
                value={equipmentText}
              />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button onClick={identifyEquipmentFromText} type="button" variant="secondary">
                  Identificar equipamentos
                </Button>
                <p className="text-sm text-stage-muted">
                  A identificação é local e não usa API externa. Confirme antes de adicionar.
                </p>
              </div>
              {suggestedEquipmentIds.length === 0 ? (
                <p className="text-sm text-stage-muted">
                  Nenhum equipamento cadastrado foi identificado no texto.
                </p>
              ) : (
                <div className="grid gap-2">
                  <h3 className="font-bold">Equipamentos sugeridos</h3>
                  <div className="flex flex-wrap gap-2">
                    {suggestedEquipmentIds.map((id) => (
                      <span className="rounded-full border border-stage-line px-3 py-1 text-xs" key={id}>
                        {equipmentById.get(id)?.name ?? "Equipamento"}
                      </span>
                    ))}
                  </div>
                  <Button
                    onClick={() =>
                      setFormData((current) => ({
                        ...current,
                        equipmentIds: Array.from(
                          new Set([...current.equipmentIds, ...suggestedEquipmentIds])
                        )
                      }))
                    }
                    type="button"
                  >
                    Adicionar sugestões selecionadas
                  </Button>
                </div>
              )}
            </div>

            <Textarea
              label="Observações gerais"
              maxLength={700}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  generalNotes: event.target.value
                }))
              }
              value={formData.generalNotes}
            />

            <SectionTitle title="Visibilidade" />
            <div className="grid gap-3 rounded-xl border border-stage-line bg-white/5 p-4 text-sm md:grid-cols-3">
              <label className="flex items-center gap-2">
                <input
                  checked={formData.visibility.employeesCanView}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      visibility: {
                        ...current.visibility,
                        employeesCanView: event.target.checked
                      }
                    }))
                  }
                  type="checkbox"
                />
                Visível para funcionários
              </label>
              <label className="flex items-center gap-2">
                <input
                  checked={formData.visibility.freelancersCanView}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      visibility: {
                        ...current.visibility,
                        freelancersCanView: event.target.checked
                      }
                    }))
                  }
                  type="checkbox"
                />
                Visível para freelancers
              </label>
              <label className="flex items-center gap-2">
                <input
                  checked={formData.visibility.partnerCompaniesCanView}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      visibility: {
                        ...current.visibility,
                        partnerCompaniesCanView: event.target.checked
                      }
                    }))
                  }
                  type="checkbox"
                />
                Visível para empresas parceiras
              </label>
              <p className="text-stage-muted md:col-span-3">
                Custos, orçamento, margem, lucro, pagamentos e informações financeiras
                internas são privados e devem ser visíveis apenas para administradores.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button onClick={resetForm} type="button" variant="secondary">
                Cancelar
              </Button>
              <Button disabled={isSubmitting} type="submit">
                {isSubmitting ? "Salvando..." : "Salvar evento"}
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      <Card className="p-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_180px_180px_180px_140px_120px]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-stage-muted" />
            <input
              className="h-11 w-full rounded-lg border border-stage-line bg-white/5 pl-10 pr-3 text-sm text-stage-text outline-none transition placeholder:text-stage-muted focus:border-stage-cyan"
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar por evento, cliente ou cidade"
              value={searchTerm}
            />
          </label>
          <Select
            label="Status"
            onChange={(event) =>
              setStatusFilter(event.target.value as EventStatusFilter)
            }
            value={statusFilter}
          >
            <option value="all">Todos</option>
            {Object.entries(eventStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Select
            label="Categoria"
            onChange={(event) =>
              setCategoryFilter(event.target.value as typeof categoryFilter)
            }
            value={categoryFilter}
          >
            <option value="all">Todas</option>
            {Object.entries(eventCategoryLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Select
            label="Período"
            onChange={(event) => setPeriodFilter(event.target.value as PeriodFilter)}
            value={periodFilter}
          >
            <option value="all">Todos</option>
            <option value="upcoming">Próximos</option>
            <option value="ongoing">Em andamento</option>
            <option value="past">Passados</option>
            <option value="this_month">Este mês</option>
            <option value="next_month">Próximo mês</option>
            <option value="specific_month">Mês específico</option>
          </Select>
          <Select
            label="Mês"
            onChange={(event) => setSelectedMonth(event.target.value)}
            value={selectedMonth}
          >
            {monthOptions.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </Select>
          <Input
            label="Ano"
            onChange={(event) => setSelectedYear(event.target.value)}
            type="number"
            value={selectedYear}
          />
        </div>

        <div className="mt-5 grid gap-4">
          {filteredEvents.length === 0 ? (
            <div className="rounded-xl border border-stage-line bg-white/5 p-8 text-center text-sm text-stage-muted">
              Nenhum evento encontrado.
            </div>
          ) : (
            groupEventsByMonth(filteredEvents).map((group) => (
              <section className="grid gap-3" key={group.label}>
                <h3 className="text-sm font-bold uppercase tracking-widest text-stage-muted">
                  {group.label}
                </h3>
                {group.events.map((event) => {
                  const costSummary = calculateEventCostSummary({
                    eventStartDate: event.schedule.eventStartDate,
                    eventEndDate: event.schedule.eventEndDate,
                    setupCosts: event.setupCosts,
                    eventDailyCosts: event.eventDailyCosts,
                    teardownCosts: event.teardownCosts,
                    technicalVisits: event.technicalVisits,
                    teamMembers: event.teamMembers,
                    partnerCompanies: event.partnerCompanies,
                    vehicles: event.vehicles
                  });
                  const conflicts = eventService.findEquipmentConflicts(
                    event,
                    events,
                    equipment
                  );
                  const rowTeamConflicts = eventService.findTeamConflicts(
                    event,
                    events
                  );
                  const hasOvertime = event.dailySchedules.some(
                    (day) => (day.expectedOvertimeHours ?? 0) > 0
                  );

                  return (
                    <article
                      className="rounded-2xl border border-stage-line bg-stage-panel/80 p-5 shadow-panel"
                      key={event.id}
                    >
                      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-xl font-black">{event.name}</h2>
                            <Badge>{eventCategoryLabels[event.eventCategory]}</Badge>
                            <Badge>{eventStatusLabels[event.status]}</Badge>
                            {hasOvertime ? <Badge tone="amber">Hora extra prevista</Badge> : null}
                          </div>
                          <p className="mt-2 text-sm text-stage-muted">
                            Cliente: {getClientName(event.clientId)}
                          </p>
                          <p className="mt-1 text-sm text-stage-muted">
                            Local: {event.city || event.state
                              ? `${event.city || "Cidade não informada"}${event.state ? `/${event.state}` : ""}`
                              : event.locationName ?? "Não informado"}
                          </p>
                          <p className="mt-1 text-sm text-stage-muted">
                            {formatEventPeriod(event.schedule.eventStartDate, event.schedule.eventEndDate)} - {costSummary.durationDays} dia{costSummary.durationDays === 1 ? "" : "s"}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {event.visibility.employeesCanView ? <Badge>Funcionários</Badge> : null}
                          {event.visibility.freelancersCanView ? <Badge>Freelancers</Badge> : null}
                          {event.visibility.partnerCompaniesCanView ? <Badge>Parceiros</Badge> : null}
                        </div>
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <SummaryItem label="Agenda" value={getDailyScheduleSummary(event.dailySchedules)} />
                        <SummaryItem label="Operação" value={getOperationSummary(event)} />
                        <SummaryItem label="Equipe" value={`${event.teamMembers.length} pessoa(s)`} />
                        <SummaryItem label="Parceiros" value={event.partnerCompanies.length === 0 ? "Nenhum" : `${event.partnerCompanies.length} empresa(s)`} />
                        <SummaryItem label="Equipamentos" value={`${event.equipmentIds.length} vinculado(s)`} />
                        <SummaryItem label="Veículos" value={event.vehicles.length === 0 ? "Nenhum veículo vinculado" : `${event.vehicles.length} - ${formatCurrencyBr(calculateVehiclesTotal(event.vehicles))}`} />
                        <SummaryItem label="Visitas técnicas" value={event.technicalVisits.length === 0 ? "Nenhuma visita técnica registrada" : `${event.technicalVisits.length} - ${formatCurrencyBr(calculateTechnicalVisitsTotal(event.technicalVisits))}`} />
                        <SummaryItem label="Custo operacional" value={formatCurrencyBr(costSummary.operationalTotal)} strong />
                      </div>

                      {conflicts.length > 0 || rowTeamConflicts.length > 0 ? (
                        <div className="mt-4 rounded-xl border border-stage-amber/40 bg-stage-amber/10 p-3 text-sm text-stage-amber">
                          {conflicts.map((conflict) => (
                            <p key={`${conflict.eventId}-${conflict.equipmentId}`}>
                              {conflict.equipmentName} conflita com {conflict.eventName}
                            </p>
                          ))}
                          {rowTeamConflicts.map((conflict) => (
                            <p key={`${conflict.eventId}-${conflict.teamMemberId}`}>
                              {conflict.isInformational ? "Aviso" : "Conflito"}: {conflict.personName} em {conflict.eventName}
                            </p>
                          ))}
                        </div>
                      ) : null}

                      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
                        <Button onClick={() => handleEdit(event)} type="button" variant="ghost">
                          <Edit3 className="h-4 w-4" />
                          Ver/Editar
                        </Button>
                        <Button onClick={() => handleDelete(event)} type="button" variant="secondary">
                          <Trash2 className="h-4 w-4" />
                          Excluir
                        </Button>
                      </div>
                    </article>
                  );
                })}
              </section>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <h3 className="border-t border-stage-line pt-5 text-base font-bold">{title}</h3>;
}

function DecimalInput({
  label,
  value,
  onChange,
  step = "0.1"
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  step?: string;
}) {
  return (
    <Input
      inputMode="decimal"
      label={label}
      min="0"
      onChange={(event) => onChange(event.target.value)}
      step={step}
      type="number"
      value={value}
    />
  );
}

function CostFields({
  title,
  values,
  onChange
}: {
  title: string;
  values: EventCostFormData;
  onChange: (field: keyof EventCostFormData, value: string) => void;
}) {
  return (
    <div className="rounded-xl border border-stage-line bg-white/5 p-4">
      <h4 className="mb-4 font-bold">{title}</h4>
      <div className="grid gap-3">
        <DecimalInput label="Combustível" step="0.01" value={values.fuelCost} onChange={(value) => onChange("fuelCost", value)} />
        <DecimalInput label="Alimentação" step="0.01" value={values.foodCost} onChange={(value) => onChange("foodCost", value)} />
        <DecimalInput label="Mão de obra/equipe" step="0.01" value={values.laborCost} onChange={(value) => onChange("laborCost", value)} />
        <DecimalInput label="Outros custos" step="0.01" value={values.otherCost} onChange={(value) => onChange("otherCost", value)} />
        <Textarea label="Observações" maxLength={700} value={values.notes} onChange={(event) => onChange("notes", event.target.value)} />
      </div>
    </div>
  );
}

function CostCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-stage-line bg-white/5 p-4">
      <p className="text-xs font-semibold text-stage-muted">{label}</p>
      <p className="mt-2 text-lg font-black">{formatCurrencyBr(value)}</p>
    </div>
  );
}

function toPreviewNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function parseCostForPreview(cost: EventCostFormData) {
  return {
    fuelCost: toPreviewNumber(cost.fuelCost),
    foodCost: toPreviewNumber(cost.foodCost),
    laborCost: toPreviewNumber(cost.laborCost),
    otherCost: toPreviewNumber(cost.otherCost),
    notes: cost.notes || undefined
  };
}

function costToForm(cost?: {
  fuelCost?: number;
  foodCost?: number;
  laborCost?: number;
  otherCost?: number;
  notes?: string;
}): EventCostFormData {
  return {
    fuelCost: toFormNumber(cost?.fuelCost),
    foodCost: toFormNumber(cost?.foodCost),
    laborCost: toFormNumber(cost?.laborCost),
    otherCost: toFormNumber(cost?.otherCost),
    notes: cost?.notes ?? ""
  };
}

function getDailyScheduleSummary(days: Event["dailySchedules"]) {
  if (days.length === 0) {
    return "Horário não definido";
  }

  const signatures = Array.from(
    new Set(
      days.map((day) =>
        day.startTime && day.endTime
          ? `Horário: ${day.startTime} às ${day.endTime}`
          : "Horário não definido"
      )
    )
  );

  return signatures.length === 1 ? signatures[0] : "Horários variáveis por dia";
}

function getOperationSummary(event: Event) {
  const setup = event.schedule.setupStartDate
    ? `Montagem: ${formatDatePtBr(event.schedule.setupStartDate)}`
    : "";
  const teardown = event.schedule.teardownStartDate
    ? `Desmontagem: ${formatDatePtBr(event.schedule.teardownStartDate)}`
    : "";

  return [setup, teardown].filter(Boolean).join(" | ") || "Sem datas operacionais";
}

function matchesPeriodFilter(
  event: Event,
  periodFilter: PeriodFilter,
  selectedMonth: number,
  selectedYear: number
) {
  const temporalStatus = getEventTemporalStatus(
    event.schedule.eventStartDate,
    event.schedule.eventEndDate
  );
  const today = new Date();

  if (periodFilter === "upcoming") {
    return temporalStatus === "upcoming";
  }
  if (periodFilter === "ongoing") {
    return temporalStatus === "ongoing";
  }
  if (periodFilter === "past") {
    return temporalStatus === "past";
  }
  if (periodFilter === "this_month") {
    return eventOverlapsMonth(
      event.schedule.eventStartDate,
      event.schedule.eventEndDate,
      today.getFullYear(),
      today.getMonth() + 1
    );
  }
  if (periodFilter === "next_month") {
    const nextMonth = today.getMonth() === 11 ? 1 : today.getMonth() + 2;
    const nextYear =
      today.getMonth() === 11 ? today.getFullYear() + 1 : today.getFullYear();
    return eventOverlapsMonth(
      event.schedule.eventStartDate,
      event.schedule.eventEndDate,
      nextYear,
      nextMonth
    );
  }
  if (periodFilter === "specific_month") {
    return eventOverlapsMonth(
      event.schedule.eventStartDate,
      event.schedule.eventEndDate,
      selectedYear,
      selectedMonth
    );
  }

  return true;
}

function groupEventsByMonth(events: Event[]) {
  const groups = new Map<string, Event[]>();

  events.forEach((event) => {
    const [year, month] = event.schedule.eventStartDate.split("-").map(Number);
    const label = getMonthLabelPtBr(year, month);
    groups.set(label, [...(groups.get(label) ?? []), event]);
  });

  return Array.from(groups.entries()).map(([label, groupedEvents]) => ({
    label,
    events: groupedEvents
  }));
}

function Badge({
  children,
  tone = "default"
}: {
  children: ReactNode;
  tone?: "default" | "amber";
}) {
  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs ${
        tone === "amber"
          ? "border-stage-amber/40 bg-stage-amber/10 text-stage-amber"
          : "border-stage-line bg-white/5 text-stage-muted"
      }`}
    >
      {children}
    </span>
  );
}

function SummaryItem({
  label,
  value,
  strong = false
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="rounded-xl border border-stage-line bg-white/5 p-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-stage-muted">
        {label}
      </p>
      <p className={`mt-2 text-sm ${strong ? "font-bold text-stage-text" : "text-stage-muted"}`}>
        {value}
      </p>
    </div>
  );
}

function calculateVehicleFuelPreview(vehicle: EventFormData["vehicles"][number]) {
  if (!canAutoCalculateVehicleFuel(vehicle.fuelType)) {
    return undefined;
  }

  return calculateFuelCost(
    toPreviewNumber(vehicle.estimatedDistanceKm),
    toPreviewNumber(vehicle.averageConsumption),
    toPreviewNumber(vehicle.fuelPricePerUnit)
  );
}

function canAutoCalculateVehicleFuel(fuelType: string) {
  return ["diesel", "gasoline", "ethanol", "flex"].includes(fuelType);
}

const monthOptions = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro"
].map((label, index) => ({ label, value: String(index + 1) }));
