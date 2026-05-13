from fastapi import APIRouter

from app.api.v1.endpoints import auth
from app.api.v1.endpoints.crud_factory import build_crud_router
from app.models.checklist import EventChecklist, EventChecklistItem
from app.models.company import Company
from app.models.equipment import EquipmentCategory, EquipmentModel, EquipmentUnit
from app.models.event import Event
from app.models.location import InternalLocation, Warehouse
from app.models.maintenance import MaintenanceOrder
from app.models.people import Employee
from app.models.stage import StageDeck, StageDeckStairCompatibility, StageStair
from app.models.venue import Venue, VenueEpiRequirement, VenueOperationalNote
from app.schemas import domain as schemas
from app.services.crud import CRUDService
from app.services.users import user_service

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])

crud_routes = [
    (
        "/companies",
        "empresas",
        CRUDService(Company),
        schemas.CompanyCreate,
        schemas.CompanyUpdate,
        schemas.CompanyRead,
    ),
    (
        "/users",
        "usuarios",
        user_service,
        schemas.UserCreate,
        schemas.UserUpdate,
        schemas.UserRead,
    ),
    (
        "/employees",
        "funcionarios",
        CRUDService(Employee),
        schemas.EmployeeCreate,
        schemas.EmployeeUpdate,
        schemas.EmployeeRead,
    ),
    (
        "/warehouses",
        "galpoes",
        CRUDService(Warehouse),
        schemas.WarehouseCreate,
        schemas.WarehouseUpdate,
        schemas.WarehouseRead,
    ),
    (
        "/internal-locations",
        "localizacoes-internas",
        CRUDService(InternalLocation),
        schemas.InternalLocationCreate,
        schemas.InternalLocationUpdate,
        schemas.InternalLocationRead,
    ),
    (
        "/equipment-categories",
        "categorias-equipamentos",
        CRUDService(EquipmentCategory),
        schemas.EquipmentCategoryCreate,
        schemas.EquipmentCategoryUpdate,
        schemas.EquipmentCategoryRead,
    ),
    (
        "/equipment-models",
        "modelos-equipamentos",
        CRUDService(EquipmentModel),
        schemas.EquipmentModelCreate,
        schemas.EquipmentModelUpdate,
        schemas.EquipmentModelRead,
    ),
    (
        "/equipment-units",
        "equipamentos-fisicos",
        CRUDService(EquipmentUnit),
        schemas.EquipmentUnitCreate,
        schemas.EquipmentUnitUpdate,
        schemas.EquipmentUnitRead,
    ),
    (
        "/events",
        "eventos",
        CRUDService(Event),
        schemas.EventCreate,
        schemas.EventUpdate,
        schemas.EventRead,
    ),
    (
        "/checklists",
        "checklists",
        CRUDService(EventChecklist),
        schemas.ChecklistCreate,
        schemas.ChecklistUpdate,
        schemas.ChecklistRead,
    ),
    (
        "/checklist-items",
        "itens-checklist",
        CRUDService(EventChecklistItem),
        schemas.ChecklistItemCreate,
        schemas.ChecklistItemUpdate,
        schemas.ChecklistItemRead,
    ),
    (
        "/maintenance-orders",
        "manutencao",
        CRUDService(MaintenanceOrder),
        schemas.MaintenanceOrderCreate,
        schemas.MaintenanceOrderUpdate,
        schemas.MaintenanceOrderRead,
    ),
    (
        "/venues",
        "locais-eventos",
        CRUDService(Venue),
        schemas.VenueCreate,
        schemas.VenueUpdate,
        schemas.VenueRead,
    ),
    (
        "/venue-operational-notes",
        "observacoes-locais",
        CRUDService(VenueOperationalNote),
        schemas.VenueOperationalNoteCreate,
        schemas.VenueOperationalNoteUpdate,
        schemas.VenueOperationalNoteRead,
    ),
    (
        "/venue-epi-requirements",
        "epis-locais",
        CRUDService(VenueEpiRequirement),
        schemas.VenueEpiRequirementCreate,
        schemas.VenueEpiRequirementUpdate,
        schemas.VenueEpiRequirementRead,
    ),
    (
        "/stage-decks",
        "praticaveis",
        CRUDService(StageDeck),
        schemas.StageDeckCreate,
        schemas.StageDeckUpdate,
        schemas.StageDeckRead,
    ),
    (
        "/stage-stairs",
        "escadas-palco",
        CRUDService(StageStair),
        schemas.StageStairCreate,
        schemas.StageStairUpdate,
        schemas.StageStairRead,
    ),
    (
        "/stage-stair-compatibilities",
        "compatibilidade-escadas",
        CRUDService(StageDeckStairCompatibility),
        schemas.StageDeckStairCompatibilityCreate,
        schemas.StageDeckStairCompatibilityUpdate,
        schemas.StageDeckStairCompatibilityRead,
    ),
]

for prefix, tag, service, create_schema, update_schema, read_schema in crud_routes:
    api_router.include_router(
        build_crud_router(
            service=service,
            create_schema=create_schema,
            update_schema=update_schema,
            read_schema=read_schema,
        ),
        prefix=prefix,
        tags=[tag],
    )


@api_router.post("/stage-calculations", response_model=schemas.StageCalculationRead)
def calculate_stage(payload: schemas.StageCalculationRequest) -> dict[str, float | int]:
    area = payload.deck_width_m * payload.deck_length_m
    return {
        "area_m2": area,
        "total_area_m2": area * payload.quantity,
        "required_legs": payload.quantity * payload.legs_per_deck,
    }
