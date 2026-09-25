import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Eye, FileStack, Plus } from "lucide-react";

import { AdminShell } from "@/components/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import type { Flyer } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Painel,
});

function Painel() {
  const todos = useQuery({
    queryKey: ["admin", "flyers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("flyers")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Flyer[];
    },
  });

  const lista = todos.data ?? [];
  const totalVistas = lista.reduce((acc, f) => acc + f.visualizacoes, 0);
  const maisVistos = [...lista].sort((a, b) => b.visualizacoes - a.visualizacoes).slice(0, 5);
  const recentes = lista.slice(0, 5);

  return (
    <AdminShell titulo="Painel" subtitulo="Resumo da Biblioteca Digital">
      <div className="grid grid-cols-2 gap-3">
        <div className="surface-card p-4">
          <FileStack className="size-4 text-primary" />
          <p className="mt-2 font-display text-2xl font-semibold">{lista.length}</p>
          <p className="text-xs text-muted-foreground">Folhetos</p>
        </div>
        <div className="surface-card p-4">
          <Eye className="size-4 text-primary" />
          <p className="mt-2 font-display text-2xl font-semibold">{totalVistas}</p>
          <p className="text-xs text-muted-foreground">Visualizações</p>
        </div>
      </div>

      <Link
        to="/admin/folhetos/novo"
        className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground"
      >
        <Plus className="size-4" /> Adicionar folheto
      </Link>

      <section className="mt-6">
        <h2 className="font-display text-lg font-semibold">Mais visualizados</h2>
        <div className="mt-2 space-y-2">
          {maisVistos.length === 0 && (
            <p className="surface-card p-4 text-sm text-muted-foreground">Sem dados ainda.</p>
          )}
          {maisVistos.map((f) => (
            <div key={f.id} className="surface-card flex items-center gap-3 p-3 text-sm">
              <span className="min-w-0 flex-1 truncate">{f.titulo}</span>
              <span className="text-xs text-muted-foreground">{f.visualizacoes}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="font-display text-lg font-semibold">Últimos adicionados</h2>
        <div className="mt-2 space-y-2">
          {recentes.map((f) => (
            <Link
              key={f.id}
              to="/admin/folhetos/$id"
              params={{ id: f.id }}
              className="surface-card flex items-center gap-3 p-3 text-sm"
            >
              <span className="min-w-0 flex-1 truncate">{f.titulo}</span>
              <span className="text-xs text-muted-foreground">
                {f.ativo ? "Publicado" : "Rascunho"}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </AdminShell>
  );
}
