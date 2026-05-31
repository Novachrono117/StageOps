import { useEffect, useState } from "react";

import { AppLayout } from "./components/layout/AppLayout";
import { ClientsPage } from "./pages/ClientsPage";
import { Dashboard } from "./pages/Dashboard";
import { EquipmentPage } from "./pages/EquipmentPage";
import { clientService } from "./services/clientService";
import { equipmentService } from "./services/equipmentService";
import type { Client } from "./types/client";
import type { Equipment } from "./types/equipment";

type Page = "dashboard" | "equipment" | "clients";

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([equipmentService.list(), clientService.list()])
      .then(([loadedEquipment, loadedClients]) => {
        setEquipment(loadedEquipment);
        setClients(loadedClients);
      })
      .catch(() =>
        setLoadError("Não foi possível carregar os dados locais do aplicativo.")
      );
  }, []);

  return (
    <AppLayout currentPage={currentPage} onNavigate={setCurrentPage}>
      {loadError ? (
        <div className="mb-4 rounded-xl border border-stage-line bg-white/5 px-4 py-3 text-sm text-stage-muted">
          {loadError}
        </div>
      ) : null}
      {currentPage === "dashboard" ? (
        <Dashboard equipment={equipment} />
      ) : currentPage === "equipment" ? (
        <EquipmentPage
          equipment={equipment}
          onEquipmentChanged={setEquipment}
        />
      ) : (
        <ClientsPage clients={clients} onClientsChanged={setClients} />
      )}
    </AppLayout>
  );
}
