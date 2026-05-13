from datetime import date
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

from app.models.checklist import ChecklistDirection, ChecklistItemStatus
from app.models.equipment import EquipmentUnitStatus, LocationType
from app.models.event import EventStatus
from app.models.maintenance import MaintenanceStatus
from app.models.people import UserRole
from app.schemas.common import EntityRead


class CompanyBase(BaseModel):
    name: str
    legal_name: str | None = None
    tax_id: str | None = None
    phone: str | None = None
    email: EmailStr | None = None


class CompanyCreate(CompanyBase):
    pass


class CompanyUpdate(BaseModel):
    name: str | None = None
    legal_name: str | None = None
    tax_id: str | None = None
    phone: str | None = None
    email: EmailStr | None = None


class CompanyRead(EntityRead, CompanyBase):
    pass


class UserBase(BaseModel):
    company_id: UUID
    name: str
    email: EmailStr
    role: UserRole = UserRole.operator
    is_active: bool = True


class UserCreate(UserBase):
    password: str = Field(min_length=8)


class UserUpdate(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    role: UserRole | None = None
    is_active: bool | None = None
    password: str | None = Field(default=None, min_length=8)


class UserRead(EntityRead, UserBase):
    pass


class EmployeeBase(BaseModel):
    company_id: UUID
    name: str
    document: str | None = None
    phone: str | None = None
    position: str | None = None
    is_active: bool = True


class EmployeeCreate(EmployeeBase):
    pass


class EmployeeUpdate(BaseModel):
    name: str | None = None
    document: str | None = None
    phone: str | None = None
    position: str | None = None
    is_active: bool | None = None


class EmployeeRead(EntityRead, EmployeeBase):
    pass


class WarehouseBase(BaseModel):
    company_id: UUID
    name: str
    address: str | None = None
    notes: str | None = None


class WarehouseCreate(WarehouseBase):
    pass


class WarehouseUpdate(BaseModel):
    name: str | None = None
    address: str | None = None
    notes: str | None = None


class WarehouseRead(EntityRead, WarehouseBase):
    pass


class InternalLocationBase(BaseModel):
    warehouse_id: UUID
    name: str
    code: str | None = None
    description: str | None = None


class InternalLocationCreate(InternalLocationBase):
    pass


class InternalLocationUpdate(BaseModel):
    name: str | None = None
    code: str | None = None
    description: str | None = None


class InternalLocationRead(EntityRead, InternalLocationBase):
    pass


class EquipmentCategoryBase(BaseModel):
    company_id: UUID
    name: str
    description: str | None = None


class EquipmentCategoryCreate(EquipmentCategoryBase):
    pass


class EquipmentCategoryUpdate(BaseModel):
    name: str | None = None
    description: str | None = None


class EquipmentCategoryRead(EntityRead, EquipmentCategoryBase):
    pass


class EquipmentModelBase(BaseModel):
    company_id: UUID
    category_id: UUID
    name: str
    manufacturer: str | None = None
    technical_specs: str | None = None
    weight_kg: float | None = None


class EquipmentModelCreate(EquipmentModelBase):
    pass


class EquipmentModelUpdate(BaseModel):
    name: str | None = None
    manufacturer: str | None = None
    technical_specs: str | None = None
    weight_kg: float | None = None


class EquipmentModelRead(EntityRead, EquipmentModelBase):
    pass


class EquipmentUnitBase(BaseModel):
    company_id: UUID
    model_id: UUID
    asset_tag: str
    serial_number: str | None = None
    status: EquipmentUnitStatus = EquipmentUnitStatus.available
    location_type: LocationType = LocationType.warehouse
    warehouse_id: UUID | None = None
    internal_location_id: UUID | None = None
    current_event_id: UUID | None = None
    third_party_company: str | None = None
    notes: str | None = None


class EquipmentUnitCreate(EquipmentUnitBase):
    pass


class EquipmentUnitUpdate(BaseModel):
    asset_tag: str | None = None
    serial_number: str | None = None
    status: EquipmentUnitStatus | None = None
    location_type: LocationType | None = None
    warehouse_id: UUID | None = None
    internal_location_id: UUID | None = None
    current_event_id: UUID | None = None
    third_party_company: str | None = None
    notes: str | None = None


class EquipmentUnitRead(EntityRead, EquipmentUnitBase):
    pass


class VenueBase(BaseModel):
    company_id: UUID
    name: str
    address: str | None = None
    access_difficulty: str | None = None
    internal_notes: str | None = None
    internal_rating: int | None = Field(default=None, ge=1, le=5)


class VenueCreate(VenueBase):
    pass


class VenueUpdate(BaseModel):
    name: str | None = None
    address: str | None = None
    access_difficulty: str | None = None
    internal_notes: str | None = None
    internal_rating: int | None = Field(default=None, ge=1, le=5)


class VenueRead(EntityRead, VenueBase):
    pass


class VenueOperationalNoteBase(BaseModel):
    venue_id: UUID
    title: str
    content: str


class VenueOperationalNoteCreate(VenueOperationalNoteBase):
    pass


class VenueOperationalNoteUpdate(BaseModel):
    title: str | None = None
    content: str | None = None


class VenueOperationalNoteRead(EntityRead, VenueOperationalNoteBase):
    pass


class VenueEpiRequirementBase(BaseModel):
    venue_id: UUID
    epi_name: str
    is_required: bool = True
    notes: str | None = None


class VenueEpiRequirementCreate(VenueEpiRequirementBase):
    pass


class VenueEpiRequirementUpdate(BaseModel):
    epi_name: str | None = None
    is_required: bool | None = None
    notes: str | None = None


class VenueEpiRequirementRead(EntityRead, VenueEpiRequirementBase):
    pass


class EventBase(BaseModel):
    company_id: UUID
    venue_id: UUID | None = None
    name: str
    client_name: str | None = None
    starts_on: date | None = None
    ends_on: date | None = None
    status: EventStatus = EventStatus.draft
    logistics_notes: str | None = None


class EventCreate(EventBase):
    pass


class EventUpdate(BaseModel):
    venue_id: UUID | None = None
    name: str | None = None
    client_name: str | None = None
    starts_on: date | None = None
    ends_on: date | None = None
    status: EventStatus | None = None
    logistics_notes: str | None = None


class EventRead(EntityRead, EventBase):
    pass


class ChecklistBase(BaseModel):
    company_id: UUID
    event_id: UUID
    direction: ChecklistDirection
    responsible_user_id: UUID | None = None
    notes: str | None = None


class ChecklistCreate(ChecklistBase):
    pass


class ChecklistUpdate(BaseModel):
    direction: ChecklistDirection | None = None
    responsible_user_id: UUID | None = None
    notes: str | None = None


class ChecklistRead(EntityRead, ChecklistBase):
    pass


class ChecklistItemBase(BaseModel):
    checklist_id: UUID
    equipment_unit_id: UUID | None = None
    equipment_model_id: UUID | None = None
    expected_quantity: int = 1
    checked_quantity: int = 0
    status: ChecklistItemStatus = ChecklistItemStatus.pending
    notes: str | None = None


class ChecklistItemCreate(ChecklistItemBase):
    pass


class ChecklistItemUpdate(BaseModel):
    equipment_unit_id: UUID | None = None
    equipment_model_id: UUID | None = None
    expected_quantity: int | None = None
    checked_quantity: int | None = None
    status: ChecklistItemStatus | None = None
    notes: str | None = None


class ChecklistItemRead(EntityRead, ChecklistItemBase):
    pass


class MaintenanceOrderBase(BaseModel):
    company_id: UUID
    equipment_unit_id: UUID
    opened_by_user_id: UUID | None = None
    status: MaintenanceStatus = MaintenanceStatus.open
    problem_description: str
    resolution_notes: str | None = None
    cost: float | None = None
    due_date: date | None = None
    completed_on: date | None = None


class MaintenanceOrderCreate(MaintenanceOrderBase):
    pass


class MaintenanceOrderUpdate(BaseModel):
    status: MaintenanceStatus | None = None
    problem_description: str | None = None
    resolution_notes: str | None = None
    cost: float | None = None
    due_date: date | None = None
    completed_on: date | None = None


class MaintenanceOrderRead(EntityRead, MaintenanceOrderBase):
    pass


class StageDeckBase(BaseModel):
    company_id: UUID
    name: str
    width_m: float
    length_m: float
    available_quantity: int = 0
    legs_per_deck: int = 4
    legs_per_height: int = 4


class StageDeckCreate(StageDeckBase):
    pass


class StageDeckUpdate(BaseModel):
    name: str | None = None
    width_m: float | None = None
    length_m: float | None = None
    available_quantity: int | None = None
    legs_per_deck: int | None = None
    legs_per_height: int | None = None


class StageDeckRead(EntityRead, StageDeckBase):
    area_m2: float
    total_available_area_m2: float
    required_legs_for_available_quantity: int


class StageStairBase(BaseModel):
    company_id: UUID
    name: str
    compatible_height_cm: int
    available_quantity: int = 0


class StageStairCreate(StageStairBase):
    pass


class StageStairUpdate(BaseModel):
    name: str | None = None
    compatible_height_cm: int | None = None
    available_quantity: int | None = None


class StageStairRead(EntityRead, StageStairBase):
    pass


class StageDeckStairCompatibilityBase(BaseModel):
    deck_id: UUID
    stair_id: UUID


class StageDeckStairCompatibilityCreate(StageDeckStairCompatibilityBase):
    pass


class StageDeckStairCompatibilityUpdate(BaseModel):
    deck_id: UUID | None = None
    stair_id: UUID | None = None


class StageDeckStairCompatibilityRead(EntityRead, StageDeckStairCompatibilityBase):
    pass


class StageCalculationRequest(BaseModel):
    deck_width_m: float
    deck_length_m: float
    quantity: int = Field(ge=0)
    legs_per_deck: int = Field(default=4, ge=0)


class StageCalculationRead(BaseModel):
    area_m2: float
    total_area_m2: float
    required_legs: int
