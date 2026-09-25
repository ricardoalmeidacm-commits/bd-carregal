import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { Marca } from "@/components/Marca";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nova palavra-passe — Biblioteca Digital do Museu" },
      { name: "description", content: "Defina uma nova palavra-passe para a área reservada." },
      { property: "og:title", content: "Nova palavra-passe — Biblioteca Digital do Museu" },
      { property: "og:description", content: "Recuperação de acesso à área reservada." },
    ],
  }),
  component: Redefinir,
});

function Redefinir() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [ocupado, setOcupado] = useState(false);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setOcupado(true);
    const { error } = await supabase.auth.updateUser({ password });
    setOcupado(false);
    if (error) { toast.error(error.message); return; }
    await supabase.rpc("ensure_profile");
    toast.success("Palavra-passe atualizada");
    navigate({ to: "/admin", replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <form onSubmit={guardar} className="surface-card w-full max-w-sm space-y-3 p-5">
        <Marca size={48} className="mx-auto" />
        <h1 className="text-center font-display text-xl font-semibold">Nova palavra-passe</h1>
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-label="Nova palavra-passe"
          className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
        />
        <button
          disabled={ocupado}
          className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {ocupado ? "Aguarde..." : "Guardar"}
        </button>
      </form>
    </div>
  );
}
