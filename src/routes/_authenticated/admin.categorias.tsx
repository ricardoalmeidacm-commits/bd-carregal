import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { criarSlug } from "@/lib/slug";
import type { Categoria } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/admin/categorias")({
  head: () => ({ meta: [{ title: "Categorias — Backoffice do Museu" }] }),
  component: Categorias,
});

function Categorias() {
  const qc = useQueryClient();
  const [nome, setNome] = useState("");
  const lista = useQuery({
    queryKey: ["categorias"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categorias").select("*").order("ordem");
      if (error) throw error;
      return data as Categoria[];
    },
  });

  async function adicionar(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;
    const ordem = (lista.data?.length ?? 0) + 1;
    const { error } = await supabase
      .from("categorias")
      .insert({ nome: nome.trim(), slug: criarSlug(nome), ordem });
    if (error) { toast.error(error.message); return; }
    setNome("");
    toast.success("Categoria criada");
    qc.invalidateQueries({ queryKey: ["categorias"] });
  }

  async function remover(c: Categoria) {
    if (!confirm(`Remover a categoria "${c.nome}"?`)) return;
    const { error } = await supabase.from("categorias").delete().eq("id", c.id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["categorias"] });
  }

  return (
    <AdminShell titulo="Categorias" subtitulo="Organize as publicações da biblioteca." exigirAdmin>
      <form onSubmit={adicionar} className="surface-card flex gap-2 p-3">
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Nova categoria"
          aria-label="Nome da nova categoria"
          className="min-w-0 flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <button className="rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground">
          Adicionar
        </button>
      </form>
      <ul className="mt-4 space-y-2">
        {(lista.data ?? []).map((c) => (
          <li key={c.id} className="surface-card flex items-center justify-between px-4 py-3">
            <span className="text-sm font-medium">{c.nome}</span>
            <button
              onClick={() => remover(c)}
              aria-label={`Remover ${c.nome}`}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-4" />
            </button>
          </li>
        ))}
      </ul>
    </AdminShell>
  );
}
