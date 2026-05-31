import type {
  Event,
  EventCostBreakdown,
  EventCostFormData,
  EventDailySchedule,
  EventDailyScheduleFormData,
  EventFormData,
  EventPartnerCompany,
  EventPartnerCompanyFormData,
  EventStatus,
  EventStatusFilter,
  EventTeamMember,
  EventTeamMemberFormData,
  EventTechnicalVisit,
  EventTechnicalVisitFormData,
  EventVehicleAssignment,
  EventVehicleAssignmentFormData
} from "../types/event";
import type { Equipment } from "../types/equipment";
import {
  calculateDurationInDays,
  enumerateDateRange,
  getWeekdayPtBr,
  rangesOverlap,
  validateEventDateByStatus
} from "../utils/dateUtils";
import { calculateEstimatedFuelCost } from "../utils/fuelUtils";
import { calculateFuelCost } from "../utils/fuelUtils";
import { createId } from "../utils/id";

const STORAGE_KEY = "stageops.events.v1";
const DEMO_ORGANIZATION_ID = "org_demo";

type LegacyEvent = Partial<Event> & {
  date?: string;
  eventDate?: string;
  location?: string;
  operationalNotes?: string;
};

export type EquipmentConflict = {
  equipmentId: string;
  equipmentName: string;
  eventId: string;
  eventName: string;
};

export type TeamConflict = {
  teamMemberId: string;
  personName: string;
  eventId: string;
  eventName: string;
  periodLabel: string;
  isInformational: boolean;
};

export class EventServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EventServiceError";
  }
}

function optionalText(value: string | undefined) {
  return value?.trim() || undefined;
}

function parseOptionalPositiveNumber(value: string | undefined, label: string) {
  if (value === undefined || value.trim() === "") {
    return undefined;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new EventServiceError(`${label} deve ser maior que zero.`);
  }

  return parsed;
}

function parseCostBreakdown(data: EventCostFormData): EventCostBreakdown {
  return {
    fuelCost: parseOptionalPositiveNumber(data.fuelCost, "Combustível"),
    foodCost: parseOptionalPositiveNumber(data.foodCost, "Alimentação"),
    laborCost: parseOptionalPositiveNumber(data.laborCost, "Mão de obra/equipe"),
    otherCost: parseOptionalPositiveNumber(data.otherCost, "Outros custos"),
    notes: optionalText(data.notes)
  };
}

function parseTechnicalVisit(visit: EventTechnicalVisitFormData): EventTechnicalVisit {
  if (!visit.visitDate) {
    throw new EventServiceError("Informe a data da visita técnica.");
  }

  return {
    id: visit.id || createId("visit"),
    visitDate: visit.visitDate,
    responsibleName: optionalText(visit.responsibleName),
    location: optionalText(visit.location),
    distanceKm: parseOptionalPositiveNumber(visit.distanceKm, "Distância da visita"),
    fuelCost: parseOptionalPositiveNumber(visit.fuelCost, "Combustível da visita"),
    vehicleWearCost: parseOptionalPositiveNumber(
      visit.vehicleWearCost,
      "Reserva de manutenção/desgaste do veículo"
    ),
    tollCost: parseOptionalPositiveNumber(visit.tollCost, "Pedágio da visita"),
    foodCost: parseOptionalPositiveNumber(visit.foodCost, "Alimentação da visita"),
    otherCost: parseOptionalPositiveNumber(visit.otherCost, "Outros custos da visita"),
    notes: optionalText(visit.notes)
  };
}

function parseDailySchedule(day: EventDailyScheduleFormData): EventDailySchedule {
  return {
    id: day.id || createId("day"),
    date: day.date,
    startTime: optionalText(day.startTime),
    endTime: optionalText(day.endTime),
    title: optionalText(day.title),
    notes: optionalText(day.notes),
    expectedOvertimeHours: parseOptionalPositiveNumber(
      day.expectedOvertimeHours,
      "Hora extra prevista"
    ),
    overtimeReason: optionalText(day.overtimeReason),
    estimatedOvertimeCost: parseOptionalPositiveNumber(
      day.estimatedOvertimeCost,
      "Custo estimado de hora extra"
    )
  };
}

function parseTeamMember(member: EventTeamMemberFormData): EventTeamMember {
  if (member.workerType === "employee" && !member.employeeId) {
    throw new EventServiceError("Selecione o funcionário CLT da equipe.");
  }

  if (member.workerType === "freelancer" && !member.freelancerName.trim()) {
    throw new EventServiceError("Informe o nome do freelancer.");
  }

  if (member.workerType === "freelancer" && !member.freelancerPhone.trim()) {
    throw new EventServiceError("Informe o telefone do freelancer.");
  }

  if (!member.role.trim()) {
    throw new EventServiceError("Informe a função da pessoa no evento.");
  }

  const dailyRate = parseOptionalPositiveNumber(member.dailyRate, "Valor da diária");
  const estimatedDays = parseOptionalPositiveNumber(
    member.estimatedDays,
    "Quantidade estimada de dias"
  );

  validateDateRange(
    member.assignmentStartDate,
    member.assignmentEndDate,
    "Alocação da equipe"
  );

  return {
    id: member.id || createId("team"),
    workerType: member.workerType,
    employeeId: optionalText(member.employeeId),
    freelancerName: optionalText(member.freelancerName),
    freelancerPhone: optionalText(member.freelancerPhone),
    freelancerDocument: optionalText(member.freelancerDocument),
    role: member.role.trim(),
    assignmentStage: member.assignmentStage,
    assignmentMode: member.assignmentMode,
    assignmentStartDate: optionalText(member.assignmentStartDate),
    assignmentEndDate: optionalText(member.assignmentEndDate),
    assignmentStartTime: optionalText(member.assignmentStartTime),
    assignmentEndTime: optionalText(member.assignmentEndTime),
    dailyRate,
    estimatedDays,
    estimatedTotal:
      dailyRate !== undefined && estimatedDays !== undefined
        ? dailyRate * estimatedDays
        : undefined,
    notes: optionalText(member.notes),
    canViewEvent: member.canViewEvent
  };
}

function parsePartnerCompany(
  partner: EventPartnerCompanyFormData
): EventPartnerCompany {
  if (!partner.companyName.trim()) {
    throw new EventServiceError("Informe o nome da empresa parceira.");
  }

  if (!partner.responsibility.trim()) {
    throw new EventServiceError("Informe a responsabilidade da empresa parceira.");
  }

  return {
    id: partner.id || createId("partner"),
    companyName: partner.companyName.trim(),
    contactName: optionalText(partner.contactName),
    contactPhone: optionalText(partner.contactPhone),
    responsibility: partner.responsibility.trim(),
    providedItems: optionalText(partner.providedItems),
    estimatedCost: parseOptionalPositiveNumber(
      partner.estimatedCost,
      "Custo da empresa parceira"
    ),
    notes: optionalText(partner.notes),
    canViewEvent: partner.canViewEvent,
    canViewEquipmentList: partner.canViewEquipmentList,
    canViewOperationalNotes: partner.canViewOperationalNotes
  };
}

function parseVehicle(vehicle: EventVehicleAssignmentFormData): EventVehicleAssignment {
  if (!vehicle.vehicleName.trim()) {
    throw new EventServiceError("Informe o nome do veículo.");
  }

  validateDateRange(vehicle.startDate, vehicle.endDate, "Veículo");

  const estimatedDistanceKm = parseOptionalPositiveNumber(
    vehicle.estimatedDistanceKm,
    "Distância do veículo"
  );
  const averageConsumption = parseOptionalPositiveNumber(
    vehicle.averageConsumption,
    "Consumo médio do veículo"
  );
  const fuelPricePerUnit = parseOptionalPositiveNumber(
    vehicle.fuelPricePerUnit,
    "Preço do combustível do veículo"
  );
  const manualFuelCost = parseOptionalPositiveNumber(
    vehicle.fuelCost,
    "Combustível do veículo"
  );
  const calculatedFuelCost =
    ["diesel", "gasoline", "ethanol", "flex"].includes(vehicle.fuelType)
      ? calculateFuelCost(estimatedDistanceKm, averageConsumption, fuelPricePerUnit)
      : undefined;

  return {
    id: vehicle.id || createId("vehicle"),
    vehicleName: vehicle.vehicleName.trim(),
    vehiclePlate: optionalText(vehicle.vehiclePlate),
    fuelType: vehicle.fuelType,
    driverEmployeeId: optionalText(vehicle.driverEmployeeId),
    driverName: optionalText(vehicle.driverName),
    purpose: vehicle.purpose,
    startDate: optionalText(vehicle.startDate),
    endDate: optionalText(vehicle.endDate),
    estimatedDistanceKm,
    averageConsumption,
    fuelPricePerUnit,
    fuelCost: manualFuelCost ?? calculatedFuelCost,
    vehicleWearCost: parseOptionalPositiveNumber(
      vehicle.vehicleWearCost,
      "Reserva de manutenção/desgaste do veículo"
    ),
    tollCost: parseOptionalPositiveNumber(vehicle.tollCost, "Pedágio do veículo"),
    otherCost: parseOptionalPositiveNumber(vehicle.otherCost, "Outros custos do veículo"),
    notes: optionalText(vehicle.notes)
  };
}

function validateDateRange(startDate: string | undefined, endDate: string | undefined, label: string) {
  if (startDate && endDate && endDate < startDate) {
    throw new EventServiceError(`${label}: a data final não pode ser anterior à inicial.`);
  }
}

function validateEventForm(data: EventFormData) {
  if (data.name.trim().length < 2) {
    throw new EventServiceError("Informe um nome de evento com pelo menos 2 caracteres.");
  }

  if (!data.clientId) {
    throw new EventServiceError("Selecione um cliente para o evento.");
  }

  if (!data.eventStartDate || !data.eventEndDate) {
    throw new EventServiceError("Informe a data inicial e final do evento.");
  }

  validateDateRange(data.eventStartDate, data.eventEndDate, "Período do evento");
  validateDateRange(data.setupStartDate, data.setupEndDate, "Montagem");
  validateDateRange(data.teardownStartDate, data.teardownEndDate, "Desmontagem");

  const statusDateError = validateEventDateByStatus(
    data.status,
    data.eventStartDate,
    data.eventEndDate
  );

  if (statusDateError) {
    throw new EventServiceError(statusDateError);
  }

  if (calculateDurationInDays(data.eventStartDate, data.eventEndDate) < 1) {
    throw new EventServiceError("O período do evento precisa ter pelo menos um dia.");
  }

  const limitedFields = [
    data.locationNotes,
    data.accessNotes,
    data.safetyNotes,
    data.generalNotes,
    data.setupCosts.notes,
    data.eventDailyCosts.notes,
    data.teardownCosts.notes,
    ...data.technicalVisits.map((visit) => visit.notes),
    ...data.teamMembers.map((member) => member.notes),
    ...data.partnerCompanies.map((partner) => partner.notes),
    ...data.vehicles.map((vehicle) => vehicle.notes),
    ...data.dailySchedules.map((day) => day.notes)
  ];

  if (limitedFields.some((field) => field !== undefined && field.length > 700)) {
    throw new EventServiceError("Use no máximo 700 caracteres nas observações.");
  }

  parseOptionalPositiveNumber(data.distanceKm, "Distância");
  parseOptionalPositiveNumber(data.vehicleConsumptionKmPerLiter, "Consumo médio");
  parseOptionalPositiveNumber(data.fuelPricePerLiter, "Preço do combustível");
  parseCostBreakdown(data.setupCosts);
  parseCostBreakdown(data.eventDailyCosts);
  parseCostBreakdown(data.teardownCosts);
  data.technicalVisits.forEach(parseTechnicalVisit);
  data.teamMembers.forEach(parseTeamMember);
  data.partnerCompanies.forEach(parsePartnerCompany);
  data.vehicles.forEach(parseVehicle);
  data.dailySchedules.forEach(parseDailySchedule);
}

function buildEventPayload(data: EventFormData) {
  const distanceKm = parseOptionalPositiveNumber(data.distanceKm, "Distância");
  const vehicleConsumptionKmPerLiter = parseOptionalPositiveNumber(
    data.vehicleConsumptionKmPerLiter,
    "Consumo médio"
  );
  const fuelPricePerLiter = parseOptionalPositiveNumber(
    data.fuelPricePerLiter,
    "Preço do combustível"
  );

  return {
    name: data.name.trim(),
    clientId: data.clientId,
    eventCategory: data.eventCategory,
    eventSubcategory: optionalText(data.eventSubcategory),
    schedule: {
      setupStartDate: optionalText(data.setupStartDate),
      setupEndDate: optionalText(data.setupEndDate),
      eventStartDate: data.eventStartDate,
      eventEndDate: data.eventEndDate,
      teardownStartDate: optionalText(data.teardownStartDate),
      teardownEndDate: optionalText(data.teardownEndDate)
    },
    weekday: getWeekdayPtBr(data.eventStartDate),
    dailySchedules: data.dailySchedules.map(parseDailySchedule),
    startTime: optionalText(data.startTime),
    endTime: optionalText(data.endTime),
    status: data.status,
    locationName: optionalText(data.locationName),
    address: optionalText(data.address),
    city: optionalText(data.city),
    state: optionalText(data.state)?.toUpperCase(),
    locationNotes: optionalText(data.locationNotes),
    accessNotes: optionalText(data.accessNotes),
    safetyNotes: optionalText(data.safetyNotes),
    distanceKm,
    vehicleConsumptionKmPerLiter,
    fuelPricePerLiter,
    estimatedFuelCost: calculateEstimatedFuelCost(
      distanceKm,
      vehicleConsumptionKmPerLiter,
      fuelPricePerLiter
    ),
    setupCosts: parseCostBreakdown(data.setupCosts),
    eventDailyCosts: parseCostBreakdown(data.eventDailyCosts),
    teardownCosts: parseCostBreakdown(data.teardownCosts),
    technicalVisits: data.technicalVisits.map(parseTechnicalVisit),
    teamMembers: data.teamMembers.map(parseTeamMember),
    partnerCompanies: data.partnerCompanies.map(parsePartnerCompany),
    vehicles: data.vehicles.map(parseVehicle),
    visibility: data.visibility,
    equipmentIds: data.equipmentIds,
    generalNotes: optionalText(data.generalNotes)
  };
}

function normalizeEvent(item: LegacyEvent): Event {
  const now = new Date().toISOString();
  const legacyDate = item.schedule?.eventStartDate || item.eventDate || item.date || "";
  const eventStartDate = item.schedule?.eventStartDate || legacyDate;
  const eventEndDate = item.schedule?.eventEndDate || legacyDate;
  const locationName = item.locationName || item.location;
  const dailySchedules =
    item.dailySchedules && item.dailySchedules.length > 0
      ? item.dailySchedules
      : generateDailySchedules(eventStartDate, eventEndDate);

  return {
    id: item.id ?? createId("evt"),
    organizationId: item.organizationId ?? DEMO_ORGANIZATION_ID,
    name: item.name?.trim() || "Evento sem nome",
    clientId: item.clientId ?? "",
    eventCategory: item.eventCategory ?? "other",
    eventSubcategory: item.eventSubcategory ?? "",
    schedule: {
      setupStartDate: item.schedule?.setupStartDate,
      setupEndDate: item.schedule?.setupEndDate,
      eventStartDate,
      eventEndDate,
      teardownStartDate: item.schedule?.teardownStartDate,
      teardownEndDate: item.schedule?.teardownEndDate
    },
    weekday: item.weekday || getWeekdayPtBr(eventStartDate),
    dailySchedules,
    startTime: item.startTime,
    endTime: item.endTime,
    status: (item.status as EventStatus | undefined) ?? "draft",
    locationName,
    address: item.address,
    city: item.city,
    state: item.state,
    locationNotes: item.locationNotes || item.operationalNotes,
    accessNotes: item.accessNotes,
    safetyNotes: item.safetyNotes,
    distanceKm: item.distanceKm,
    vehicleConsumptionKmPerLiter: item.vehicleConsumptionKmPerLiter,
    fuelPricePerLiter: item.fuelPricePerLiter,
    estimatedFuelCost:
      item.estimatedFuelCost ??
      calculateEstimatedFuelCost(
        item.distanceKm,
        item.vehicleConsumptionKmPerLiter,
        item.fuelPricePerLiter
      ),
    setupCosts: item.setupCosts ?? {},
    eventDailyCosts:
      item.eventDailyCosts ??
      (item.estimatedFuelCost ? { fuelCost: item.estimatedFuelCost } : {}),
    teardownCosts: item.teardownCosts ?? {},
    technicalVisits: item.technicalVisits ?? [],
    teamMembers: item.teamMembers ?? [],
    partnerCompanies: item.partnerCompanies ?? [],
    vehicles: (item.vehicles ?? []).map((vehicle) => ({
      ...vehicle,
      fuelType: vehicle.fuelType ?? "other",
      averageConsumption: vehicle.averageConsumption,
      fuelPricePerUnit: vehicle.fuelPricePerUnit
    })),
    visibility: item.visibility ?? {
      employeesCanView: false,
      freelancersCanView: false,
      partnerCompaniesCanView: false
    },
    equipmentIds: item.equipmentIds ?? [],
    generalNotes: item.generalNotes,
    createdAt: item.createdAt ?? now,
    updatedAt: item.updatedAt ?? now
  };
}

function generateDailySchedules(startDate: string, endDate: string): EventDailySchedule[] {
  return enumerateDateRange(startDate, endDate).map((date) => ({
    id: createId("day"),
    date
  }));
}

function readStorage(): Event[] {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    const normalized = parsed.map((item) => normalizeEvent(item));
    if (JSON.stringify(parsed) !== JSON.stringify(normalized)) {
      writeStorage(normalized);
    }
    return normalized;
  } catch {
    return [];
  }
}

function writeStorage(events: Event[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

export const eventService = {
  async list(): Promise<Event[]> {
    return readStorage().sort((a, b) =>
      a.schedule.eventStartDate.localeCompare(b.schedule.eventStartDate)
    );
  },

  async createEvent(data: EventFormData): Promise<Event> {
    validateEventForm(data);
    const now = new Date().toISOString();
    const event: Event = {
      id: createId("evt"),
      organizationId: DEMO_ORGANIZATION_ID,
      ...buildEventPayload(data),
      createdAt: now,
      updatedAt: now
    };

    writeStorage([event, ...readStorage()]);
    return event;
  },

  async updateEvent(eventId: string, data: EventFormData): Promise<Event> {
    validateEventForm(data);
    const events = readStorage();
    const existing = events.find((event) => event.id === eventId);

    if (!existing) {
      throw new EventServiceError("Evento não encontrado.");
    }

    const updated: Event = {
      ...existing,
      ...buildEventPayload(data),
      updatedAt: new Date().toISOString()
    };

    writeStorage(events.map((event) => (event.id === eventId ? updated : event)));
    return updated;
  },

  async deleteEvent(eventId: string): Promise<void> {
    writeStorage(readStorage().filter((event) => event.id !== eventId));
  },

  filterEvents(
    events: Event[],
    getClientName: (clientId: string) => string,
    searchTerm: string,
    statusFilter: EventStatusFilter
  ) {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return events.filter((event) => {
      const clientName = getClientName(event.clientId).toLowerCase();
      const matchesSearch =
        !normalizedSearch ||
        event.name.toLowerCase().includes(normalizedSearch) ||
        clientName.includes(normalizedSearch) ||
        (event.city?.toLowerCase().includes(normalizedSearch) ?? false);
      const matchesStatus =
        statusFilter === "all" || event.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  },

  findEquipmentConflicts(
    draftEvent: Pick<Event, "id" | "name" | "schedule" | "equipmentIds">,
    events: Event[],
    equipment: Equipment[]
  ): EquipmentConflict[] {
    const equipmentNameById = new Map(equipment.map((item) => [item.id, item.name]));

    return events.flatMap((event) => {
      if (event.id === draftEvent.id) {
        return [];
      }

      const overlaps = rangesOverlap(
        draftEvent.schedule.eventStartDate,
        draftEvent.schedule.eventEndDate,
        event.schedule.eventStartDate,
        event.schedule.eventEndDate
      );

      if (!overlaps) {
        return [];
      }

      return draftEvent.equipmentIds
        .filter((equipmentId) => event.equipmentIds.includes(equipmentId))
        .map((equipmentId) => ({
          equipmentId,
          equipmentName: equipmentNameById.get(equipmentId) ?? "Equipamento",
          eventId: event.id,
          eventName: event.name
        }));
    });
  },

  findTeamConflicts(
    draftEvent: Pick<Event, "id" | "name" | "schedule" | "teamMembers">,
    events: Event[]
  ): TeamConflict[] {
    return draftEvent.teamMembers.flatMap((member) =>
      events.flatMap((event) => {
        if (event.id === draftEvent.id) {
          return [];
        }

        return event.teamMembers
          .filter((other) => samePerson(member, other))
          .flatMap((other) => {
            const currentSlot = resolveAssignmentSlot(draftEvent, member);
            const otherSlot = resolveAssignmentSlot(event, other);

            if (!currentSlot || !otherSlot) {
              return [];
            }

            if (!assignmentSlotsOverlap(currentSlot, otherSlot)) {
              return [];
            }

            return [
              {
                teamMemberId: member.id,
                personName: getTeamMemberName(member),
                eventId: event.id,
                eventName: event.name,
                periodLabel: `${currentSlot.label} x ${otherSlot.label}`,
                isInformational:
                  member.assignmentMode === "on_call" ||
                  other.assignmentMode === "on_call"
              }
            ];
          });
      })
    );
  }
};

function samePerson(first: EventTeamMember, second: EventTeamMember) {
  if (first.workerType !== second.workerType) {
    return false;
  }

  if (first.workerType === "employee") {
    return Boolean(first.employeeId && first.employeeId === second.employeeId);
  }

  return (
    normalizePersonKey(first.freelancerName) ===
      normalizePersonKey(second.freelancerName) &&
    normalizePersonKey(first.freelancerPhone) ===
      normalizePersonKey(second.freelancerPhone)
  );
}

function normalizePersonKey(value?: string) {
  return (value ?? "").trim().toLowerCase();
}

function getTeamMemberName(member: EventTeamMember) {
  return member.workerType === "employee"
    ? `Funcionário ${member.employeeId}`
    : member.freelancerName ?? "Freelancer";
}

function resolveAssignmentSlot(
  event: Pick<Event, "schedule">,
  member: EventTeamMember
) {
  if (member.assignmentMode === "specific_time") {
    if (!member.assignmentStartDate || !member.assignmentEndDate) {
      return null;
    }

    return {
      start: `${member.assignmentStartDate}T${member.assignmentStartTime || "00:00"}`,
      end: `${member.assignmentEndDate}T${member.assignmentEndTime || "23:59"}`,
      label: `${member.assignmentStartDate} ${member.assignmentStartTime || "00:00"} até ${member.assignmentEndDate} ${member.assignmentEndTime || "23:59"}`
    };
  }

  const stageRange = getStageRange(event.schedule, member.assignmentStage);

  if (!stageRange) {
    return null;
  }

  return {
    start: `${stageRange.start}T00:00`,
    end: `${stageRange.end}T23:59`,
    label: `${stageRange.start} até ${stageRange.end}`
  };
}

function getStageRange(
  schedule: Event["schedule"],
  stage: EventTeamMember["assignmentStage"]
) {
  if (stage === "setup" && schedule.setupStartDate) {
    return {
      start: schedule.setupStartDate,
      end: schedule.setupEndDate || schedule.setupStartDate
    };
  }

  if (stage === "teardown" && schedule.teardownStartDate) {
    return {
      start: schedule.teardownStartDate,
      end: schedule.teardownEndDate || schedule.teardownStartDate
    };
  }

  return {
    start: schedule.eventStartDate,
    end: schedule.eventEndDate
  };
}

function assignmentSlotsOverlap(
  first: { start: string; end: string },
  second: { start: string; end: string }
) {
  return first.start <= second.end && second.start <= first.end;
}
