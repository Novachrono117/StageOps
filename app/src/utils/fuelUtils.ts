import type {
  EventCostBreakdown,
  EventPartnerCompany,
  EventTeamMember,
  EventTechnicalVisit,
  EventVehicleAssignment
} from "../types/event";
import { calculateDurationInDays } from "./dateUtils";

export function calculateEstimatedFuelCost(
  distanceKm?: number,
  vehicleConsumptionKmPerLiter?: number,
  fuelPricePerLiter?: number
) {
  if (
    distanceKm === undefined ||
    vehicleConsumptionKmPerLiter === undefined ||
    fuelPricePerLiter === undefined
  ) {
    return undefined;
  }

  return (distanceKm / vehicleConsumptionKmPerLiter) * fuelPricePerLiter;
}

export function calculateFuelCost(
  distanceKm?: number,
  averageConsumption?: number,
  fuelPricePerUnit?: number
) {
  const distance = toPositiveNumber(distanceKm);
  const consumption = toPositiveNumber(averageConsumption);
  const price = toPositiveNumber(fuelPricePerUnit);

  if (distance === 0 || consumption === 0 || price === 0) {
    return undefined;
  }

  return roundCurrency((distance / consumption) * price);
}

export function calculateCostBreakdownTotal(cost?: EventCostBreakdown) {
  if (!cost) {
    return 0;
  }

  return (
    (cost.fuelCost ?? 0) +
    (cost.foodCost ?? 0) +
    (cost.laborCost ?? 0) +
    (cost.otherCost ?? 0)
  );
}

export function calculateTechnicalVisitTotal(visit: EventTechnicalVisit) {
  return (
    (visit.fuelCost ?? 0) +
    (visit.vehicleWearCost ?? 0) +
    (visit.tollCost ?? 0) +
    (visit.foodCost ?? 0) +
    (visit.otherCost ?? 0)
  );
}

export function calculateTechnicalVisitsTotal(visits: EventTechnicalVisit[]) {
  return visits.reduce((sum, visit) => sum + calculateTechnicalVisitTotal(visit), 0);
}

export function calculateFreelancersTotal(teamMembers: EventTeamMember[]) {
  return teamMembers.reduce((sum, member) => sum + (member.estimatedTotal ?? 0), 0);
}

export function calculatePartnerCompaniesTotal(partners: EventPartnerCompany[]) {
  return partners.reduce((sum, partner) => sum + (partner.estimatedCost ?? 0), 0);
}

export function calculateVehicleTotal(vehicle: EventVehicleAssignment) {
  const fuelCost =
    vehicle.fuelCost ??
    (canAutoCalculateFuel(vehicle.fuelType)
      ? calculateFuelCost(
          vehicle.estimatedDistanceKm,
          vehicle.averageConsumption,
          vehicle.fuelPricePerUnit
        )
      : undefined) ??
    0;

  return (
    fuelCost +
    (vehicle.vehicleWearCost ?? 0) +
    (vehicle.tollCost ?? 0) +
    (vehicle.otherCost ?? 0)
  );
}

export function calculateVehiclesTotal(vehicles: EventVehicleAssignment[]) {
  return vehicles.reduce((sum, vehicle) => sum + calculateVehicleTotal(vehicle), 0);
}

export function calculateVehicleTotalCost(vehicle: EventVehicleAssignment) {
  return calculateVehicleTotal(vehicle);
}

export function calculateVehiclesTotalCost(vehicles: EventVehicleAssignment[]) {
  return calculateVehiclesTotal(vehicles);
}

export function calculateEventCostSummary(args: {
  eventStartDate: string;
  eventEndDate: string;
  setupCosts?: EventCostBreakdown;
  eventDailyCosts?: EventCostBreakdown;
  teardownCosts?: EventCostBreakdown;
  technicalVisits: EventTechnicalVisit[];
  teamMembers?: EventTeamMember[];
  partnerCompanies?: EventPartnerCompany[];
  vehicles?: EventVehicleAssignment[];
}) {
  const durationDays = calculateDurationInDays(args.eventStartDate, args.eventEndDate);
  const setupTotal = calculateCostBreakdownTotal(args.setupCosts);
  const eventDailyTotal = calculateCostBreakdownTotal(args.eventDailyCosts);
  const eventPeriodTotal = eventDailyTotal * durationDays;
  const teardownTotal = calculateCostBreakdownTotal(args.teardownCosts);
  const technicalVisitsTotal = calculateTechnicalVisitsTotal(args.technicalVisits);
  const freelancersTotal = calculateFreelancersTotal(args.teamMembers ?? []);
  const partnerCompaniesTotal = calculatePartnerCompaniesTotal(
    args.partnerCompanies ?? []
  );
  const vehiclesTotal = calculateVehiclesTotal(args.vehicles ?? []);

  return {
    durationDays,
    setupTotal,
    eventDailyTotal,
    eventPeriodTotal,
    teardownTotal,
    technicalVisitsTotal,
    freelancersTotal,
    partnerCompaniesTotal,
    vehiclesTotal,
    operationalTotal:
      setupTotal +
      eventPeriodTotal +
      teardownTotal +
      technicalVisitsTotal +
      freelancersTotal +
      partnerCompaniesTotal +
      vehiclesTotal
  };
}

export function formatCurrencyBr(value?: number) {
  if (value === undefined) {
    return "Não calculado";
  }

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value);
}

function toPositiveNumber(value?: number) {
  if (value === undefined || !Number.isFinite(value) || value <= 0) {
    return 0;
  }

  return value;
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function canAutoCalculateFuel(fuelType: EventVehicleAssignment["fuelType"]) {
  return ["diesel", "gasoline", "ethanol", "flex"].includes(fuelType);
}
