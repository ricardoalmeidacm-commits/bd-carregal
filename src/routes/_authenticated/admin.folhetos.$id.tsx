import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { AdminShell } from "@/components/AdminShell";
import { FlyerForm } from "@/components/FlyerForm";
import { supabase } from "@/integrations/supabase/client";
import type { Flyer } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/admin/folhetos/$id")({
  component: EditarFolheto,
});

function EditarFolheto() {
  const { id } = Route.useParams();
  const folheto = useQuery({
    queryKey: ["admin", "flyer", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("flyers").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data as Flyer | null;
    },
  });

  return (
    <AdminShell titulo="Editar folheto" subtitulo={folheto.data?.titulo}>
      {folheto.isLoading ? (
        <div className="surface-card h-64 animate-pulse bg-muted/50" />
      ) : folheto.data ? (
        <FlyerForm flyer={folheto.data} />
      ) : (
        <p className="surface-card p-4 text-sm text-muted-foreground">Folheto não encontrado.</p>
      )}
    </AdminShell>
  );
}
