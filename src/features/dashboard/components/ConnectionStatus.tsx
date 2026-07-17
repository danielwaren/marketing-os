import { useEffect, useState } from "react";
import { checkSupabaseConnection } from "@/services/health.service";

export function ConnectionStatus() {
  const [status, setStatus] = useState("Comprobando conexión...");

  useEffect(() => {
    checkSupabaseConnection()
      .then(() => setStatus("✅ Supabase conectado"))
      .catch(() => setStatus("❌ Error de conexión"));
  }, []);

  return (
    <div className="rounded-lg border p-4">
      <p className="font-medium">{status}</p>
    </div>
  );
}