"""initial schema

Revision ID: 0001_initial_schema
Revises:
Create Date: 2026-05-13 10:20:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0001_initial_schema"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def timestamps() -> list[sa.Column]:
    return [
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    ]


def uuid_pk() -> sa.Column:
    return sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False)


def upgrade() -> None:
    op.create_table(
        "companies",
        uuid_pk(),
        sa.Column("name", sa.String(160), nullable=False),
        sa.Column("legal_name", sa.String(180)),
        sa.Column("tax_id", sa.String(32)),
        sa.Column("phone", sa.String(32)),
        sa.Column("email", sa.String(160)),
        *timestamps(),
        sa.UniqueConstraint("tax_id", name="uq_companies_tax_id"),
    )
    op.create_index("ix_companies_name", "companies", ["name"])

    user_role = sa.Enum("admin", "manager", "operator", name="userrole")
    equipment_status = sa.Enum("available", "in_event", "reserved", "maintenance", "rented", "lost", name="equipmentunitstatus")
    location_type = sa.Enum("warehouse", "event", "third_party", "maintenance", name="locationtype")
    event_status = sa.Enum("draft", "reserved", "in_progress", "completed", "canceled", name="eventstatus")
    checklist_direction = sa.Enum("outbound", "inbound", name="checklistdirection")
    checklist_item_status = sa.Enum("pending", "ok", "missing", "damaged", name="checklistitemstatus")
    maintenance_status = sa.Enum("open", "in_progress", "waiting_parts", "completed", "canceled", name="maintenancestatus")

    op.create_table(
        "users",
        uuid_pk(),
        sa.Column("company_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("companies.id"), nullable=False),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("email", sa.String(160), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("role", user_role, nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        *timestamps(),
        sa.UniqueConstraint("email", name="uq_users_email"),
    )
    op.create_index("ix_users_company_id", "users", ["company_id"])
    op.create_index("ix_users_email", "users", ["email"])

    op.create_table(
        "employees",
        uuid_pk(),
        sa.Column("company_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("companies.id"), nullable=False),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("document", sa.String(32)),
        sa.Column("phone", sa.String(32)),
        sa.Column("position", sa.String(80)),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        *timestamps(),
    )
    op.create_index("ix_employees_company_id", "employees", ["company_id"])

    op.create_table(
        "warehouses",
        uuid_pk(),
        sa.Column("company_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("companies.id"), nullable=False),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("address", sa.String(255)),
        sa.Column("notes", sa.Text()),
        *timestamps(),
    )
    op.create_index("ix_warehouses_company_id", "warehouses", ["company_id"])

    op.create_table(
        "venues",
        uuid_pk(),
        sa.Column("company_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("companies.id"), nullable=False),
        sa.Column("name", sa.String(160), nullable=False),
        sa.Column("address", sa.String(255)),
        sa.Column("access_difficulty", sa.Text()),
        sa.Column("internal_notes", sa.Text()),
        sa.Column("internal_rating", sa.Integer()),
        *timestamps(),
    )
    op.create_index("ix_venues_company_id", "venues", ["company_id"])
    op.create_index("ix_venues_name", "venues", ["name"])

    op.create_table(
        "internal_locations",
        uuid_pk(),
        sa.Column("warehouse_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("warehouses.id"), nullable=False),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("code", sa.String(32)),
        sa.Column("description", sa.Text()),
        *timestamps(),
    )
    op.create_index("ix_internal_locations_warehouse_id", "internal_locations", ["warehouse_id"])
    op.create_index("ix_internal_locations_code", "internal_locations", ["code"])

    op.create_table(
        "equipment_categories",
        uuid_pk(),
        sa.Column("company_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("companies.id"), nullable=False),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("description", sa.Text()),
        *timestamps(),
    )
    op.create_index("ix_equipment_categories_company_id", "equipment_categories", ["company_id"])
    op.create_index("ix_equipment_categories_name", "equipment_categories", ["name"])

    op.create_table(
        "equipment_models",
        uuid_pk(),
        sa.Column("company_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("companies.id"), nullable=False),
        sa.Column("category_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("equipment_categories.id"), nullable=False),
        sa.Column("name", sa.String(140), nullable=False),
        sa.Column("manufacturer", sa.String(120)),
        sa.Column("technical_specs", sa.Text()),
        sa.Column("weight_kg", sa.Numeric(10, 2)),
        *timestamps(),
    )
    op.create_index("ix_equipment_models_company_id", "equipment_models", ["company_id"])
    op.create_index("ix_equipment_models_category_id", "equipment_models", ["category_id"])

    op.create_table(
        "events",
        uuid_pk(),
        sa.Column("company_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("companies.id"), nullable=False),
        sa.Column("venue_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("venues.id")),
        sa.Column("name", sa.String(160), nullable=False),
        sa.Column("client_name", sa.String(160)),
        sa.Column("starts_on", sa.Date()),
        sa.Column("ends_on", sa.Date()),
        sa.Column("status", event_status, nullable=False),
        sa.Column("logistics_notes", sa.Text()),
        *timestamps(),
    )
    op.create_index("ix_events_company_id", "events", ["company_id"])
    op.create_index("ix_events_venue_id", "events", ["venue_id"])
    op.create_index("ix_events_status", "events", ["status"])

    op.create_table(
        "equipment_units",
        uuid_pk(),
        sa.Column("company_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("companies.id"), nullable=False),
        sa.Column("model_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("equipment_models.id"), nullable=False),
        sa.Column("asset_tag", sa.String(80), nullable=False),
        sa.Column("serial_number", sa.String(120)),
        sa.Column("status", equipment_status, nullable=False),
        sa.Column("location_type", location_type, nullable=False),
        sa.Column("warehouse_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("warehouses.id")),
        sa.Column("internal_location_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("internal_locations.id")),
        sa.Column("current_event_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("events.id")),
        sa.Column("third_party_company", sa.String(160)),
        sa.Column("notes", sa.Text()),
        *timestamps(),
        sa.UniqueConstraint("asset_tag", name="uq_equipment_units_asset_tag"),
    )
    for column in ["company_id", "model_id", "status", "location_type", "warehouse_id", "internal_location_id", "current_event_id"]:
        op.create_index(f"ix_equipment_units_{column}", "equipment_units", [column])

    op.create_table(
        "event_checklists",
        uuid_pk(),
        sa.Column("company_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("companies.id"), nullable=False),
        sa.Column("event_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("events.id"), nullable=False),
        sa.Column("direction", checklist_direction, nullable=False),
        sa.Column("responsible_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id")),
        sa.Column("notes", sa.Text()),
        *timestamps(),
    )
    for column in ["company_id", "event_id", "direction", "responsible_user_id"]:
        op.create_index(f"ix_event_checklists_{column}", "event_checklists", [column])

    op.create_table(
        "event_checklist_items",
        uuid_pk(),
        sa.Column("checklist_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("event_checklists.id"), nullable=False),
        sa.Column("equipment_unit_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("equipment_units.id")),
        sa.Column("equipment_model_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("equipment_models.id")),
        sa.Column("expected_quantity", sa.Integer(), nullable=False),
        sa.Column("checked_quantity", sa.Integer(), nullable=False),
        sa.Column("status", checklist_item_status, nullable=False),
        sa.Column("notes", sa.Text()),
        *timestamps(),
    )
    for column in ["checklist_id", "equipment_unit_id", "equipment_model_id"]:
        op.create_index(f"ix_event_checklist_items_{column}", "event_checklist_items", [column])

    op.create_table(
        "maintenance_orders",
        uuid_pk(),
        sa.Column("company_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("companies.id"), nullable=False),
        sa.Column("equipment_unit_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("equipment_units.id"), nullable=False),
        sa.Column("opened_by_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id")),
        sa.Column("status", maintenance_status, nullable=False),
        sa.Column("problem_description", sa.Text(), nullable=False),
        sa.Column("resolution_notes", sa.Text()),
        sa.Column("cost", sa.Numeric(12, 2)),
        sa.Column("due_date", sa.Date()),
        sa.Column("completed_on", sa.Date()),
        *timestamps(),
    )
    for column in ["company_id", "equipment_unit_id", "opened_by_user_id", "status"]:
        op.create_index(f"ix_maintenance_orders_{column}", "maintenance_orders", [column])

    op.create_table(
        "venue_operational_notes",
        uuid_pk(),
        sa.Column("venue_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("venues.id"), nullable=False),
        sa.Column("title", sa.String(120), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        *timestamps(),
    )
    op.create_index("ix_venue_operational_notes_venue_id", "venue_operational_notes", ["venue_id"])

    op.create_table(
        "venue_epi_requirements",
        uuid_pk(),
        sa.Column("venue_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("venues.id"), nullable=False),
        sa.Column("epi_name", sa.String(120), nullable=False),
        sa.Column("is_required", sa.Boolean(), nullable=False),
        sa.Column("notes", sa.Text()),
        *timestamps(),
    )
    op.create_index("ix_venue_epi_requirements_venue_id", "venue_epi_requirements", ["venue_id"])

    op.create_table(
        "stage_decks",
        uuid_pk(),
        sa.Column("company_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("companies.id"), nullable=False),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("width_m", sa.Numeric(6, 2), nullable=False),
        sa.Column("length_m", sa.Numeric(6, 2), nullable=False),
        sa.Column("available_quantity", sa.Integer(), nullable=False),
        sa.Column("legs_per_deck", sa.Integer(), nullable=False),
        sa.Column("legs_per_height", sa.Integer(), nullable=False),
        *timestamps(),
    )
    op.create_index("ix_stage_decks_company_id", "stage_decks", ["company_id"])

    op.create_table(
        "stage_stairs",
        uuid_pk(),
        sa.Column("company_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("companies.id"), nullable=False),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("compatible_height_cm", sa.Integer(), nullable=False),
        sa.Column("available_quantity", sa.Integer(), nullable=False),
        *timestamps(),
    )
    op.create_index("ix_stage_stairs_company_id", "stage_stairs", ["company_id"])

    op.create_table(
        "stage_deck_stair_compatibilities",
        uuid_pk(),
        sa.Column("deck_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("stage_decks.id"), nullable=False),
        sa.Column("stair_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("stage_stairs.id"), nullable=False),
        *timestamps(),
        sa.UniqueConstraint("deck_id", "stair_id", name="uq_stage_deck_stair"),
    )
    op.create_index("ix_stage_deck_stair_compatibilities_deck_id", "stage_deck_stair_compatibilities", ["deck_id"])
    op.create_index("ix_stage_deck_stair_compatibilities_stair_id", "stage_deck_stair_compatibilities", ["stair_id"])


def downgrade() -> None:
    for table in [
        "stage_deck_stair_compatibilities",
        "stage_stairs",
        "stage_decks",
        "venue_epi_requirements",
        "venue_operational_notes",
        "maintenance_orders",
        "event_checklist_items",
        "event_checklists",
        "equipment_units",
        "events",
        "equipment_models",
        "equipment_categories",
        "internal_locations",
        "venues",
        "warehouses",
        "employees",
        "users",
        "companies",
    ]:
        op.drop_table(table)
    for enum_name in [
        "maintenancestatus",
        "checklistitemstatus",
        "checklistdirection",
        "eventstatus",
        "locationtype",
        "equipmentunitstatus",
        "userrole",
    ]:
        sa.Enum(name=enum_name).drop(op.get_bind(), checkfirst=True)
