import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { FlyerCard, FlyerCardSkeleton } from "@/components/FlyerCard";
import { useSignedUrls } from "@/hooks/useSignedUrls";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import type { Categoria, Flyer } from "@/lib/types";

type Pesquisa = { q?: string | undefined; cat?: string | undefined };

export const Route = createFileRoute("/biblioteca")({
  validateSearch: (search: Record<string, unknown>): Pesquisa => ({
    q: typeof search['q'] === "string" && search['q'] ? search['q'] : undefined,
    cat: typeof search['cat'] === "string" && search['cat'] ? search['cat'] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Biblioteca — Museu Municipal de Carregal do Sal" },
      {
        name: "description",
        content: "Todos os folhetos, roteiros e publicações digitais do Museu Municipal de Carregal do Sal.",
      },
      { property: "og:title", content: "Biblioteca do Museu Municipal de Carregal do Sal" },
      {
        property: "og:description",
        content: "Pesquise e consulte folhetos, roteiros e publicações do museu.",
      },
    ],
  }),
  component: Biblioteca,
});

function Biblioteca() {
  const { q, cat } = Route.useSearch();
  const navigate = useNavigate({ from: "/biblioteca" });
  const [termo, setTermo] = useState(q ?? "");

  const categorias = useQuery({
    queryKey: ["categorias"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categorias").select("*").order("ordem");
      if (error) throw error;
      return data as Categoria[];
    },
  });

  const flyers = useQuery({
    queryKey: ["flyers", "lista", q ?? "", cat ?? ""],
    queryFn: async () => {
      let pedido = supabase.from("flyers").select("*").eq("ativo", true);
      if (cat) pedido = pedido.eq("categoria", cat);
      if (q) pedido = pedido.or(`titulo.ilike.%${q}%,descricao.ilike.%${q}%,categoria.ilike.%${q}%`);
      const { data, error } = await pedido.order("data_publicacao", { ascending: false });
      if (error) throw error;
      return data as Flyer[];
    },
  });

  const capaDe = useSignedUrls((flyers.data ?? []).map((f) => f.thumbnail_url));

  return (
    <AppShell titulo="Biblioteca Digital" subtitulo="Todas as publicações do museu">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          navigate({ search: { q: termo || undefined, cat } });
        }}
      >
        <label className="surface-card flex items-center gap-2 px-4 py-3">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            placeholder="Pesquisar"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </label>
      </form>

      <div className="no-scrollbar -mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1">
        <button
          onClick={() => navigate({ search: { q, cat: undefined } })}
          className={cn(
            "shrink-0 rounded-full border border-border px-3.5 py-1.5 text-xs font-medium",
            !cat ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground",
          )}
        >
          Todas
        </button>
        {(categorias.data ?? []).map((c) => (
          <button
            key={c.id}
            onClick={() => navigate({ search: { q, cat: c.nome } })}
            className={cn(
              "shrink-0 rounded-full border border-border px-3.5 py-1.5 text-xs font-medium",
              cat === c.nome ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground",
            )}
          >
            {c.nome}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        {flyers.isLoading && [0, 1, 2, 3].map((i) => <FlyerCardSkeleton key={i} />)}
        {flyers.data?.length === 0 && (
          <p className="surface-card p-4 text-sm text-muted-foreground">
            Não foram encontrados folhetos para esta pesquisa.
          </p>
        )}
        {(flyers.data ?? []).map((f) => (
          <FlyerCard key={f.id} flyer={f} capa={capaDe(f.thumbnail_url)} />
        ))}
      </div>
    </AppShell>
  );
}
