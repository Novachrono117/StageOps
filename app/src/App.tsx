import { useEffect, useState } from "react";

import { AppLayout } from "./components/layout/AppLayout";
import { Dashboard } from "./pages/Dashboard";
import { EquipmentPage } from "./pages/EquipmentPage";
import { equipmentService } from "./services/equipmentService";
import type { Equipment } from "./types/equipment";

type Page = "dashboard" | "equipment";

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    equipmentService
      .list()
      .then(setEquipment)
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
      ) : (
        <EquipmentPage
          equipment={equipment}
          onEquipmentChanged={setEquipment}
        />
      )}
    </AppLayout>
  );
}
