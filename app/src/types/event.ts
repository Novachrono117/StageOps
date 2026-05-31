export type EventStatus =
  | "draft"
  | "negotiating"
  | "confirmed"
  | "in_preparation"
  | "in_progress"
  | "completed"
  | "canceled";

export type EventCategory =
  | "corporate"
  | "social"
  | "graduation"
  | "religious"
  | "public"
  | "cultural"
  | "sports"
  | "educational"
  | "political"
  | "fair_exhibition"
  | "private_party"
  | "other";

export type EventCostBreakdown = {
  fuelCost?: number;
  foodCost?: number;
  laborCost?: number;
  otherCost?: number;
  notes?: string;
};

export type EventSchedule = {
  setupStartDate?: string;
  setupEndDate?: string;
  eventStartDate: string;
  eventEndDate: string;
  teardownStartDate?: string;
  teardownEndDate?: string;
};

export type EventDailySchedule = {
  id: string;
  date: string;
  startTime?: string;
  endTime?: string;
  title?: string;
  notes?: string;
  expectedOvertimeHours?: number;
  overtimeReason?: string;
  estimatedOvertimeCost?: number;
};

export type EventTechnicalVisit = {
  id: string;
  visitDate: string;
  responsibleEmployeeId?: string;
  responsibleName?: string;
  location?: string;
  distanceKm?: number;
  fuelCost?: number;
  vehicleWearCost?: number;
  tollCost?: number;
  foodCost?: number;
  otherCost?: number;
  notes?: string;
};

export type EventWorkerType = "employee" | "freelancer";

export type EventAssignmentStage =
  | "setup"
  | "event"
  | "teardown"
  | "technical_visit"
  | "delivery"
  | "pickup"
  | "other";

export type EventAssignmentMode = "full_period" | "specific_time" | "on_call";

export type EventTeamMember = {
  id: string;
  workerType: EventWorkerType;
  employeeId?: string;
  freelancerName?: string;
  freelancerPhone?: string;
  freelancerDocument?: string;
  role: string;
  assignmentStage: EventAssignmentStage;
  assignmentMode: EventAssignmentMode;
  assignmentStartDate?: string;
  assignmentEndDate?: string;
  assignmentStartTime?: string;
  assignmentEndTime?: string;
  dailyRate?: number;
  estimatedDays?: number;
  estimatedTotal?: number;
  notes?: string;
  canViewEvent: boolean;
};

export type EventPartnerCompany = {
  id: string;
  companyName: string;
  contactName?: string;
  contactPhone?: string;
  responsibility: string;
  providedItems?: string;
  estimatedCost?: number;
  notes?: string;
  canViewEvent: boolean;
  canViewEquipmentList: boolean;
  canViewOperationalNotes: boolean;
};

export type EventVehiclePurpose =
  | "technical_visit"
  | "setup"
  | "event"
  | "teardown"
  | "delivery"
  | "pickup"
  | "other";

export type EventVehicleFuelType =
  | "diesel"
  | "gasoline"
  | "ethanol"
  | "flex"
  | "electric"
  | "other";

export type EventVehicleAssignment = {
  id: string;
  vehicleName: string;
  vehiclePlate?: string;
  fuelType: EventVehicleFuelType;
  driverEmployeeId?: string;
  driverName?: string;
  purpose: EventVehiclePurpose;
  startDate?: string;
  endDate?: string;
  estimatedDistanceKm?: number;
  averageConsumption?: number;
  fuelPricePerUnit?: number;
  fuelCost?: number;
  vehicleWearCost?: number;
  tollCost?: number;
  otherCost?: number;
  notes?: string;
};

export type EventVisibility = {
  employeesCanView: boolean;
  freelancersCanView: boolean;
  partnerCompaniesCanView: boolean;
};

export type EventLocationInfo = {
  locationName?: string;
  address?: string;
  city?: string;
  state?: string;
  locationNotes?: string;
  accessNotes?: string;
  safetyNotes?: string;
};

export type EventFuelEstimate = {
  distanceKm?: number;
  vehicleConsumptionKmPerLiter?: number;
  fuelPricePerLiter?: number;
  estimatedFuelCost?: number;
};

export type Event = EventLocationInfo &
  EventFuelEstimate & {
    id: string;
    organizationId: string;
    name: string;
    clientId: string;
    eventCategory: EventCategory;
    eventSubcategory?: string;
    schedule: EventSchedule;
    dailySchedules: EventDailySchedule[];
    weekday: string;
    startTime?: string;
    endTime?: string;
    status: EventStatus;
    setupCosts?: EventCostBreakdown;
    eventDailyCosts?: EventCostBreakdown;
    teardownCosts?: EventCostBreakdown;
    technicalVisits: EventTechnicalVisit[];
    teamMembers: EventTeamMember[];
    partnerCompanies: EventPartnerCompany[];
    vehicles: EventVehicleAssignment[];
    visibility: EventVisibility;
    equipmentIds: string[];
    generalNotes?: string;
    createdAt: string;
    updatedAt: string;
  };

export type EventCostFormData = {
  fuelCost: string;
  foodCost: string;
  laborCost: string;
  otherCost: string;
  notes: string;
};

export type EventTechnicalVisitFormData = {
  id: string;
  visitDate: string;
  responsibleName: string;
  location: string;
  distanceKm: string;
  fuelCost: string;
  vehicleWearCost: string;
  tollCost: string;
  foodCost: string;
  otherCost: string;
  notes: string;
};

export type EventDailyScheduleFormData = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  title: string;
  notes: string;
  expectedOvertimeHours: string;
  overtimeReason: string;
  estimatedOvertimeCost: string;
};

export type EventTeamMemberFormData = {
  id: string;
  workerType: EventWorkerType;
  employeeId: string;
  freelancerName: string;
  freelancerPhone: string;
  freelancerDocument: string;
  role: string;
  assignmentStage: EventAssignmentStage;
  assignmentMode: EventAssignmentMode;
  assignmentStartDate: string;
  assignmentEndDate: string;
  assignmentStartTime: string;
  assignmentEndTime: string;
  dailyRate: string;
  estimatedDays: string;
  notes: string;
  canViewEvent: boolean;
};

export type EventPartnerCompanyFormData = {
  id: string;
  companyName: string;
  contactName: string;
  contactPhone: string;
  responsibility: string;
  providedItems: string;
  estimatedCost: string;
  notes: string;
  canViewEvent: boolean;
  canViewEquipmentList: boolean;
  canViewOperationalNotes: boolean;
};

export type EventVehicleAssignmentFormData = {
  id: string;
  vehicleName: string;
  vehiclePlate: string;
  fuelType: EventVehicleFuelType;
  driverEmployeeId: string;
  driverName: string;
  purpose: EventVehiclePurpose;
  startDate: string;
  endDate: string;
  estimatedDistanceKm: string;
  averageConsumption: string;
  fuelPricePerUnit: string;
  fuelCost: string;
  vehicleWearCost: string;
  tollCost: string;
  otherCost: string;
  notes: string;
};

export type EventFormData = {
  name: string;
  clientId: string;
  eventCategory: EventCategory;
  eventSubcategory: string;
  eventStartDate: string;
  eventEndDate: string;
  setupStartDate: string;
  setupEndDate: string;
  teardownStartDate: string;
  teardownEndDate: string;
  startTime: string;
  endTime: string;
  status: EventStatus;
  dailySchedules: EventDailyScheduleFormData[];
  locationName: string;
  address: string;
  city: string;
  state: string;
  locationNotes: string;
  accessNotes: string;
  safetyNotes: string;
  distanceKm: string;
  vehicleConsumptionKmPerLiter: string;
  fuelPricePerLiter: string;
  setupCosts: EventCostFormData;
  eventDailyCosts: EventCostFormData;
  teardownCosts: EventCostFormData;
  technicalVisits: EventTechnicalVisitFormData[];
  teamMembers: EventTeamMemberFormData[];
  partnerCompanies: EventPartnerCompanyFormData[];
  vehicles: EventVehicleAssignmentFormData[];
  visibility: EventVisibility;
  equipmentIds: string[];
  generalNotes: string;
};

export type EventUpdateData = Partial<EventFormData>;

export type EventStatusFilter = "all" | EventStatus;
export type EventCategoryFilter = "all" | EventCategory;

export const eventStatusLabels: Record<EventStatus, string> = {
  draft: "Rascunho",
  negotiating: "Em negociação",
  confirmed: "Confirmado",
  in_preparation: "Em preparação",
  in_progress: "Em andamento",
  completed: "Concluído",
  canceled: "Cancelado"
};

export const eventCategoryLabels: Record<EventCategory, string> = {
  corporate: "Corporativo",
  social: "Social",
  graduation: "Formatura",
  religious: "Religioso",
  public: "Público",
  cultural: "Cultural",
  sports: "Esportivo",
  educational: "Educacional",
  political: "Político",
  fair_exhibition: "Feira e exposição",
  private_party: "Festa privada",
  other: "Outro"
};

export const eventAssignmentStageLabels: Record<EventAssignmentStage, string> = {
  setup: "Montagem",
  event: "Evento",
  teardown: "Desmontagem",
  technical_visit: "Visita técnica",
  delivery: "Entrega",
  pickup: "Retirada",
  other: "Outro"
};

export const eventAssignmentModeLabels: Record<EventAssignmentMode, string> = {
  full_period: "Período completo",
  specific_time: "Horário específico",
  on_call: "Sobreaviso"
};

export const eventVehiclePurposeLabels: Record<EventVehiclePurpose, string> = {
  technical_visit: "Visita técnica",
  setup: "Montagem",
  event: "Evento",
  teardown: "Desmontagem",
  delivery: "Entrega",
  pickup: "Retirada",
  other: "Outro"
};

export const eventVehicleFuelTypeLabels: Record<EventVehicleFuelType, string> = {
  diesel: "Diesel",
  gasoline: "Gasolina",
  ethanol: "Etanol",
  flex: "Flex",
  electric: "Elétrico",
  other: "Outro"
};
