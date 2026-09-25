import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import type { Flyer } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/admin/folhetos/")({
  component: GestaoFolhetos,
});

function GestaoFolhetos() {
  const queryClient = useQueryClient();
  const folhetos = useQuery({
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

  async function alternarEstado(f: Flyer) {
    const { error } = await supabase.from("flyers").update({ ativo: !f.ativo }).eq("id", f.id);
    if (error) toast.error(error.message);
    else {
      toast.success(f.ativo ? "Folheto arquivado" : "Folheto publicado");
      queryClient.invalidateQueries({ queryKey: ["admin", "flyers"] });
    }
  }

  async function apagar(f: Flyer) {
    if (!window.confirm(`Apagar definitivamente "${f.titulo}"?`)) return;
    const { error } = await supabase.from("flyers").delete().eq("id", f.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Folheto apagado");
      queryClient.invalidateQueries({ queryKey: ["admin", "flyers"] });
    }
  }

  return (
    <AdminShell titulo="Folhetos" subtitulo="Criar, editar, publicar e arquivar">
      <Link
        to="/admin/folhetos/novo"
        className="flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground"
      >
        <Plus className="size-4" /> Adicionar folheto
      </Link>

      <div className="mt-4 space-y-3">
        {folhetos.isLoading && <div className="surface-card h-20 animate-pulse bg-muted/50" />}
        {folhetos.data?.length === 0 && (
          <p className="surface-card p-4 text-sm text-muted-foreground">Ainda não existem folhetos.</p>
        )}
        {(folhetos.data ?? []).map((f) => (
          <div key={f.id} className="surface-card p-3">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="eyebrow text-primary">{f.categoria}</p>
                <p className="truncate font-display text-[1rem] font-semibold">{f.titulo}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {f.ativo ? "Publicado" : "Rascunho"} · {f.visualizacoes} visualizações
                </p>
              </div>
              <button
                onClick={() => apagar(f)}
                aria-label="Apagar"
                className="flex size-8 items-center justify-center rounded-full border border-border"
              >
                <Trash2 className="size-4 text-destructive" />
              </button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link
                to="/admin/folhetos/$id"
                params={{ id: f.id }}
                className="rounded-lg border border-border py-2 text-center text-xs font-semibold"
              >
                Editar
              </Link>
              <button
                onClick={() => alternarEstado(f)}
                className="rounded-lg bg-secondary py-2 text-xs font-semibold text-secondary-foreground"
              >
                {f.ativo ? "Arquivar" : "Publicar"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
