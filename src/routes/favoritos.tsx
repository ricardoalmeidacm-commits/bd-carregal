import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/AppShell";
import { FlyerCard, FlyerCardSkeleton } from "@/components/FlyerCard";
import { useFavoritos } from "@/hooks/useFavoritos";
import { useSignedUrls } from "@/hooks/useSignedUrls";
import { supabase } from "@/integrations/supabase/client";
import type { Flyer } from "@/lib/types";

export const Route = createFileRoute("/favoritos")({
  head: () => ({
    meta: [
      { title: "Favoritos — Biblioteca Digital do Museu" },
      { name: "description", content: "As publicações que guardou para consultar mais tarde." },
      { property: "og:title", content: "Favoritos — Biblioteca Digital do Museu" },
      { property: "og:description", content: "As publicações que guardou para consultar mais tarde." },
    ],
  }),
  component: Favoritos,
});

function Favoritos() {
  const { favoritos } = useFavoritos();

  const flyers = useQuery({
    queryKey: ["flyers", "favoritos", favoritos],
    enabled: favoritos.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("flyers")
        .select("*")
        .eq("ativo", true)
        .in("slug", favoritos);
      if (error) throw error;
      return data as Flyer[];
    },
  });

  const capaDe = useSignedUrls((flyers.data ?? []).map((f) => f.thumbnail_url));

  return (
    <AppShell titulo="Favoritos" subtitulo="Guardados neste telemóvel">
      <div className="space-y-3">
        {favoritos.length === 0 && (
          <p className="surface-card p-4 text-sm text-muted-foreground">
            Ainda não guardou nenhuma publicação. Toque no coração dentro de um folheto para o guardar
            aqui.
          </p>
        )}
        {flyers.isLoading && favoritos.length > 0 && <FlyerCardSkeleton />}
        {(flyers.data ?? []).map((f) => (
          <FlyerCard key={f.id} flyer={f} capa={capaDe(f.thumbnail_url)} />
        ))}
      </div>
    </AppShell>
  );
}
