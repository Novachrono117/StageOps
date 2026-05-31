import type {
  Client,
  ClientFormData,
  ClientStatusFilter,
  ClientTypeFilter,
  ClientUpdateData
} from "../types/client";
import { createId } from "../utils/id";

const STORAGE_KEY = "stageops.clients.v1";
const DEMO_ORGANIZATION_ID = "org_demo";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type LegacyClient = Partial<Client>;

export class ClientServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ClientServiceError";
  }
}

function normalizeClient(item: LegacyClient): Client {
  const now = new Date().toISOString();

  return {
    id: item.id ?? createId("cli"),
    organizationId: item.organizationId ?? DEMO_ORGANIZATION_ID,
    name: item.name?.trim() || "Cliente sem nome",
    type: item.type === "company" ? "company" : "individual",
    phone: item.phone?.trim() || "",
    email: item.email?.trim() || undefined,
    status: item.status === "inactive" ? "inactive" : "active",
    notes: item.notes?.trim() || undefined,
    createdAt: item.createdAt ?? now,
    updatedAt: item.updatedAt ?? now
  };
}

function readStorage(): Client[] {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    const normalized = parsed.map((item) => normalizeClient(item));
    if (JSON.stringify(parsed) !== JSON.stringify(normalized)) {
      writeStorage(normalized);
    }
    return normalized;
  } catch {
    return [];
  }
}

function writeStorage(clients: Client[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
}

function validateClientData(data: ClientFormData | ClientUpdateData) {
  if (data.name !== undefined && data.name.trim().length < 2) {
    throw new ClientServiceError("Informe um nome com pelo menos 2 caracteres.");
  }

  if (data.phone !== undefined && data.phone.trim().length < 6) {
    throw new ClientServiceError("Informe um telefone válido para contato operacional.");
  }

  if (data.email && !EMAIL_PATTERN.test(data.email.trim())) {
    throw new ClientServiceError("Informe um e-mail válido ou deixe o campo em branco.");
  }

  if (data.notes !== undefined && data.notes.length > 500) {
    throw new ClientServiceError("Use no máximo 500 caracteres nas observações.");
  }
}

function findClient(clientId: string) {
  const clients = readStorage();
  const client = clients.find((item) => item.id === clientId);

  if (!client) {
    throw new ClientServiceError("Cliente não encontrado.");
  }

  return { clients, client };
}

export const clientService = {
  async list(): Promise<Client[]> {
    return readStorage().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  async createClient(data: ClientFormData): Promise<Client> {
    validateClientData(data);
    const now = new Date().toISOString();
    const client: Client = {
      id: createId("cli"),
      organizationId: DEMO_ORGANIZATION_ID,
      name: data.name.trim(),
      type: data.type,
      phone: data.phone.trim(),
      email: data.email.trim() || undefined,
      status: "active",
      notes: data.notes.trim() || undefined,
      createdAt: now,
      updatedAt: now
    };

    writeStorage([client, ...readStorage()]);
    return client;
  },

  async updateClient(clientId: string, data: ClientUpdateData): Promise<Client> {
    validateClientData(data);
    const { clients, client } = findClient(clientId);
    const updated: Client = {
      ...client,
      ...data,
      name: data.name?.trim() ?? client.name,
      phone: data.phone?.trim() ?? client.phone,
      email: data.email !== undefined ? data.email.trim() || undefined : client.email,
      notes: data.notes !== undefined ? data.notes.trim() || undefined : client.notes,
      updatedAt: new Date().toISOString()
    };

    writeStorage(clients.map((item) => (item.id === clientId ? updated : item)));
    return updated;
  },

  async setClientStatus(clientId: string, status: "active" | "inactive") {
    return clientService.updateClient(clientId, { status });
  },

  async deleteClient(clientId: string): Promise<void> {
    const clients = readStorage();
    writeStorage(clients.filter((item) => item.id !== clientId));
  },

  filterClients(
    clients: Client[],
    searchTerm: string,
    typeFilter: ClientTypeFilter,
    statusFilter: ClientStatusFilter
  ) {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return clients.filter((client) => {
      const matchesSearch =
        !normalizedSearch ||
        client.name.toLowerCase().includes(normalizedSearch) ||
        client.phone.toLowerCase().includes(normalizedSearch) ||
        (client.email?.toLowerCase().includes(normalizedSearch) ?? false);
      const matchesType = typeFilter === "all" || client.type === typeFilter;
      const matchesStatus =
        statusFilter === "all" || client.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }
};
