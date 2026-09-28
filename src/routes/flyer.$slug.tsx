import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Eye, Heart, QrCode, Share2 } from "lucide-react";
import QRCode from "qrcode";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Marca } from "@/components/Marca";
import { Rodape } from "@/components/Rodape";
import { useFavoritos } from "@/hooks/useFavoritos";
import { useSignedUrls } from "@/hooks/useSignedUrls";
import { supabase } from "@/integrations/supabase/client";
import type { Flyer } from "@/lib/types";

const LeitorPdf = lazy(() => import("@/components/LeitorPdf"));

export const Route = createFileRoute("/flyer/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `Publicação — Biblioteca Digital do Museu de Carregal do Sal` },
      {
        name: "description",
        content: `Consulte a publicação "${params.slug}" da Biblioteca Digital do Museu Municipal de Carregal do Sal.`,
      },
      { property: "og:title", content: "Publicação — Biblioteca Digital do Museu" },
      {
        property: "og:description",
        content: "Folheto digital do Museu Municipal de Carregal do Sal, otimizado para telemóvel.",
      },
    ],
  }),
  component: PaginaFlyer,
});

function PaginaFlyer() {
  const { slug } = Route.useParams();
  const { isFavorito, alternar } = useFavoritos();
  const [qr, setQr] = useState<string | null>(null);
  const [mostrarQr, setMostrarQr] = useState(false);
  const contado = useRef(false);

  const flyer = useQuery({
    queryKey: ["flyer", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("flyers")
        .select("*")
        .eq("slug", slug)
        .eq("ativo", true)
        .maybeSingle();
      if (error) throw error;
      return data as Flyer | null;
    },
  });

  const urlDe = useSignedUrls([flyer.data?.pdf_url, flyer.data?.thumbnail_url]);
  const pdf = urlDe(flyer.data?.pdf_url);

  const qc = useQueryClient();
  const [montado, setMontado] = useState(false);
  useEffect(() => setMontado(true), []);

  useEffect(() => {
    if (!flyer.data || contado.current) return;
    contado.current = true;
    supabase.rpc("registar_visualizacao", { _slug: slug }).then(({ data, error }) => {
      if (error || !data) return;
      qc.setQueryData(["flyer", slug], (old: Flyer | null | undefined) =>
        old ? { ...old, visualizacoes: data } : old,
      );
    });
  }, [flyer.data, slug, qc]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    QRCode.toDataURL(window.location.href, {
      margin: 1,
      width: 320,
      color: { dark: "#B23333", light: "#FFFFFF" },
    })
      .then(setQr)
      .catch(() => setQr(null));
  }, [slug]);

  async function partilhar() {
    const url = window.location.href;
    const titulo = flyer.data?.titulo ?? "Biblioteca Digital do Museu";
    if (navigator.share) {
      try {
        await navigator.share({ title: titulo, url });
        return;
      } catch {
        /* cancelado */
      }
    }
    await navigator.clipboard.writeText(url);
    toast.success("Ligação copiada");
  }

  if (flyer.isLoading) {
    return <div className="min-h-screen animate-pulse bg-muted/40" />;
  }

  if (!flyer.data) {
    return (
      <div className="app-shell flex min-h-screen flex-col items-center justify-center text-center">
        <Marca size={56} />
        <h1 className="mt-4 font-display text-xl font-semibold">Publicação não encontrada</h1>
        <Link to="/biblioteca" className="mt-4 text-sm font-medium text-primary">
          Voltar à biblioteca
        </Link>
      </div>
    );
  }

  const f = flyer.data;
  const favorito = isFavorito(f.slug);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur-md">
        <div className="app-shell flex items-center gap-2 py-3">
          <Link
            to="/biblioteca"
            className="flex size-9 items-center justify-center rounded-full border border-border bg-card"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <span className="min-w-0 flex-1 truncate font-display text-sm font-semibold">{f.titulo}</span>
          <button
            onClick={() => {
              const agora = alternar(f.slug);
              toast.success(agora ? "Adicionado aos favoritos" : "Removido dos favoritos");
            }}
            aria-label="Guardar nos favoritos"
            className="flex size-9 items-center justify-center rounded-full border border-border bg-card"
          >
            <Heart className={favorito ? "size-4 fill-primary text-primary" : "size-4"} />
          </button>
        </div>
      </header>

      <div className="app-shell pt-5">
        <span className="eyebrow text-primary">{f.categoria}</span>
        <h1 className="mt-1 font-display text-2xl font-semibold leading-tight">{f.titulo}</h1>
        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
          <span>{new Date(f.data_publicacao).toLocaleDateString("pt-PT")}</span>
          <span className="flex items-center gap-1">
            <Eye className="size-3.5" /> {f.visualizacoes}
          </span>
        </div>
        {f.descricao && <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.descricao}</p>}

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            onClick={partilhar}
            className="surface-card flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold"
          >
            <Share2 className="size-4 text-primary" /> Partilhar
          </button>
          <button
            onClick={() => setMostrarQr((v) => !v)}
            className="surface-card flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold"
          >
            <QrCode className="size-4 text-primary" /> QR Code
          </button>
        </div>

        {mostrarQr && qr && (
          <div className="surface-card mt-3 flex flex-col items-center gap-2 p-4">
            <img src={qr} alt="Código QR desta publicação" width={180} height={180} />
            <p className="text-center text-xs text-muted-foreground">
              Aponte a câmara para abrir esta publicação noutro telemóvel.
            </p>
          </div>
        )}
      </div>

      <div className="app-shell mt-5 flex-1 pb-8">
        {pdf && montado ? (
          <Suspense fallback={<div className="surface-card h-[72vh] animate-pulse bg-muted/50" />}>
            <LeitorPdf url={pdf} titulo={f.titulo} />
          </Suspense>
        ) : f.pdf_url ? (
          <div className="surface-card h-[72vh] animate-pulse bg-muted/50" />
        ) : (
          <p className="surface-card p-4 text-sm text-muted-foreground">
            Esta publicação ainda não tem ficheiro PDF associado.
          </p>
        )}
      </div>
      <Rodape />
    </div>
  );
}
