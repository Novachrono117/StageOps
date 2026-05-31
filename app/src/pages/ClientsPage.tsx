import { FormEvent, useMemo, useState } from "react";
import { Edit3, Power, Search, Trash2, UserPlus } from "lucide-react";

import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Textarea } from "../components/ui/Textarea";
import { clientService } from "../services/clientService";
import type {
  Client,
  ClientFormData,
  ClientStatusFilter,
  ClientTypeFilter
} from "../types/client";
import {
  clientStatusLabels,
  clientTypeLabels
} from "../types/client";

type ClientsPageProps = {
  clients: Client[];
  onClientsChanged: (clients: Client[]) => void;
};

type ClientFormErrors = Partial<Record<keyof ClientFormData, string>>;

const initialForm: ClientFormData = {
  name: "",
  type: "individual",
  phone: "",
  email: "",
  notes: ""
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateClientForm(data: ClientFormData) {
  const errors: ClientFormErrors = {};

  if (data.name.trim().length < 2) {
    errors.name = "Informe um nome com pelo menos 2 caracteres.";
  }

  if (data.phone.trim().length < 6) {
    errors.phone = "Informe um telefone válido para contato operacional.";
  }

  if (data.email.trim() && !emailPattern.test(data.email.trim())) {
    errors.email = "Informe um e-mail válido ou deixe em branco.";
  }

  if (data.notes.length > 500) {
    errors.notes = "Use no máximo 500 caracteres.";
  }

  return errors;
}

export function ClientsPage({ clients, onClientsChanged }: ClientsPageProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ClientFormData>(initialForm);
  const [errors, setErrors] = useState<ClientFormErrors>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<ClientTypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<ClientStatusFilter>("all");

  const filteredClients = useMemo(
    () =>
      clientService.filterClients(
        clients,
        searchTerm,
        typeFilter,
        statusFilter
      ),
    [clients, searchTerm, typeFilter, statusFilter]
  );

  const summary = {
    total: clients.length,
    active: clients.filter((client) => client.status === "active").length,
    companies: clients.filter((client) => client.type === "company").length,
    individuals: clients.filter((client) => client.type === "individual").length,
    inactive: clients.filter((client) => client.status === "inactive").length
  };

  function resetForm() {
    setFormData(initialForm);
    setErrors({});
    setEditingClientId(null);
    setIsFormOpen(false);
  }

  function upsertClient(saved: Client) {
    const exists = clients.some((client) => client.id === saved.id);
    const nextClients = exists
      ? clients.map((client) => (client.id === saved.id ? saved : client))
      : [saved, ...clients];
    onClientsChanged(nextClients);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateClientForm(formData);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const saved = editingClientId
        ? await clientService.updateClient(editingClientId, formData)
        : await clientService.createClient(formData);
      upsertClient(saved);
      resetForm();
      setFeedback(
        editingClientId
          ? "Cliente atualizado com sucesso."
          : "Cliente cadastrado com sucesso."
      );
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar o cliente. Tente novamente."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleEdit(client: Client) {
    setEditingClientId(client.id);
    setFormData({
      name: client.name,
      type: client.type,
      phone: client.phone,
      email: client.email ?? "",
      notes: client.notes ?? ""
    });
    setErrors({});
    setFeedback(null);
    setIsFormOpen(true);
  }

  async function handleToggleStatus(client: Client) {
    setFeedback(null);
    try {
      const updated = await clientService.setClientStatus(
        client.id,
        client.status === "active" ? "inactive" : "active"
      );
      upsertClient(updated);
      setFeedback(
        updated.status === "active"
          ? "Cliente reativado com sucesso."
          : "Cliente inativado com sucesso."
      );
    } catch {
      setFeedback("Não foi possível alterar o status do cliente.");
    }
  }

  async function handleDelete(client: Client) {
    const confirmed = window.confirm(
      "Deseja excluir este cliente apenas deste ambiente local? Esta ação não pode ser desfeita."
    );

    if (!confirmed) {
      return;
    }

    setFeedback(null);
    try {
      await clientService.deleteClient(client.id);
      onClientsChanged(clients.filter((item) => item.id !== client.id));
      setFeedback("Cliente excluído localmente com sucesso.");
    } catch {
      setFeedback("Não foi possível excluir o cliente.");
    }
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-6">
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <span className="rounded-full border border-stage-line bg-white/5 px-3 py-1 text-xs font-semibold text-stage-muted">
            Relacionamento operacional
          </span>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
            Clientes
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-stage-muted">
            Cadastre apenas informações necessárias para contato e operação de
            eventos. Dados sensíveis não fazem parte deste módulo.
          </p>
        </div>
        <Button
          onClick={() => {
            setFormData(initialForm);
            setEditingClientId(null);
            setErrors({});
            setFeedback(null);
            setIsFormOpen(true);
          }}
          type="button"
        >
          <UserPlus className="h-4 w-4" />
          Adicionar cliente
        </Button>
      </header>

      <div className="rounded-xl border border-stage-line bg-white/5 px-4 py-3 text-sm text-stage-muted">
        Privacidade: o StageOps coleta apenas dados necessários para operação.
        Futuras rotinas de inativação, exclusão e anonimização serão isoladas por
        organização quando Supabase e RLS forem ativados.
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ["Total de clientes", summary.total],
          ["Clientes ativos", summary.active],
          ["Empresas", summary.companies],
          ["Pessoas físicas", summary.individuals],
          ["Clientes inativos", summary.inactive]
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
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <h2 className="text-lg font-bold">
              {editingClientId ? "Editar cliente" : "Novo cliente"}
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                error={errors.name}
                label="Nome"
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    name: event.target.value
                  }))
                }
                placeholder="Nome do cliente ou empresa"
                value={formData.name}
              />
              <Select
                label="Tipo"
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    type: event.target.value as ClientFormData["type"]
                  }))
                }
                value={formData.type}
              >
                {Object.entries(clientTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
              <Input
                error={errors.phone}
                label="Telefone"
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    phone: event.target.value
                  }))
                }
                placeholder="Contato operacional"
                value={formData.phone}
              />
              <Input
                error={errors.email}
                label="E-mail opcional"
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    email: event.target.value
                  }))
                }
                placeholder="cliente@empresa.com"
                type="email"
                value={formData.email}
              />
            </div>
            <Textarea
              error={errors.notes}
              label="Observações operacionais"
              maxLength={500}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  notes: event.target.value
                }))
              }
              placeholder="Preferências de contato, restrições operacionais ou notas relevantes."
              value={formData.notes}
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button onClick={resetForm} type="button" variant="secondary">
                Cancelar
              </Button>
              <Button disabled={isSubmitting} type="submit">
                {isSubmitting ? "Salvando..." : "Salvar cliente"}
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      <Card className="overflow-hidden">
        <div className="grid gap-4 border-b border-stage-line p-5 lg:grid-cols-[1fr_180px_180px]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-stage-muted" />
            <input
              className="h-11 w-full rounded-lg border border-stage-line bg-white/5 pl-10 pr-3 text-sm text-stage-text outline-none transition placeholder:text-stage-muted focus:border-stage-cyan"
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar por nome, telefone ou e-mail"
              value={searchTerm}
            />
          </label>
          <Select
            label="Tipo"
            onChange={(event) =>
              setTypeFilter(event.target.value as ClientTypeFilter)
            }
            value={typeFilter}
          >
            <option value="all">Todos</option>
            <option value="individual">Pessoa física</option>
            <option value="company">Empresa</option>
          </Select>
          <Select
            label="Status"
            onChange={(event) =>
              setStatusFilter(event.target.value as ClientStatusFilter)
            }
            value={statusFilter}
          >
            <option value="all">Todos</option>
            <option value="active">Ativo</option>
            <option value="inactive">Inativo</option>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse text-left text-sm">
            <thead className="bg-white/5 text-xs uppercase tracking-wider text-stage-muted">
              <tr>
                <th className="px-5 py-3">Cliente</th>
                <th className="px-5 py-3">Tipo</th>
                <th className="px-5 py-3">Telefone</th>
                <th className="px-5 py-3">E-mail</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Observações</th>
                <th className="px-5 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.length === 0 ? (
                <tr>
                  <td className="px-5 py-10 text-center text-stage-muted" colSpan={7}>
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => (
                  <tr
                    className={`border-t border-stage-line ${
                      client.status === "inactive" ? "bg-white/[0.025] opacity-70" : ""
                    }`}
                    key={client.id}
                  >
                    <td className="px-5 py-4 font-semibold">{client.name}</td>
                    <td className="px-5 py-4 text-stage-muted">
                      {clientTypeLabels[client.type]}
                    </td>
                    <td className="px-5 py-4">{client.phone}</td>
                    <td className="px-5 py-4 text-stage-muted">
                      {client.email ?? "Não informado"}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs ${
                          client.status === "active"
                            ? "border-stage-green/40 bg-stage-green/10 text-stage-green"
                            : "border-stage-line bg-white/5 text-stage-muted"
                        }`}
                      >
                        {clientStatusLabels[client.status]}
                      </span>
                    </td>
                    <td className="max-w-xs truncate px-5 py-4 text-stage-muted">
                      {client.notes ?? "Sem observações"}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          className="h-8 px-3 text-xs"
                          onClick={() => handleEdit(client)}
                          type="button"
                          variant="ghost"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          Editar
                        </Button>
                        <Button
                          className="h-8 px-3 text-xs"
                          onClick={() => handleToggleStatus(client)}
                          type="button"
                          variant="secondary"
                        >
                          <Power className="h-3.5 w-3.5" />
                          {client.status === "active" ? "Inativar" : "Reativar"}
                        </Button>
                        <Button
                          className="h-8 px-3 text-xs"
                          onClick={() => handleDelete(client)}
                          type="button"
                          variant="secondary"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Excluir
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
