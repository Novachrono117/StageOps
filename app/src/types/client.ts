export type ClientType = "individual" | "company";

export type ClientStatus = "active" | "inactive";

export type Client = {
  id: string;
  organizationId: string;
  name: string;
  type: ClientType;
  phone: string;
  email?: string;
  status: ClientStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type ClientFormData = {
  name: string;
  type: ClientType;
  phone: string;
  email: string;
  notes: string;
};

export type ClientUpdateData = Partial<ClientFormData> & {
  status?: ClientStatus;
};

export type ClientTypeFilter = "all" | ClientType;

export type ClientStatusFilter = "all" | ClientStatus;

export const clientTypeLabels: Record<ClientType, string> = {
  individual: "Pessoa física",
  company: "Empresa"
};

export const clientStatusLabels: Record<ClientStatus, string> = {
  active: "Ativo",
  inactive: "Inativo"
};
