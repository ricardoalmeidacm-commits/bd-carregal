import { ChevronLeft, ChevronRight, Loader2, Maximize2, Minimize2, ZoomIn, ZoomOut } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import * as pdfjs from "pdfjs-dist";
import type { PDFDocumentProxy } from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

/** Leitor de PDF integrado: renderiza páginas em canvas, sem descarregar nem sair da app. */
export default function LeitorPdf({ url, titulo }: { url: string; titulo: string }) {
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [erro, setErro] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [ecraInteiro, setEcraInteiro] = useState(false);
  const caixa = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [largura, setLargura] = useState(0);
  const [aDesenhar, setADesenhar] = useState(true);

  useEffect(() => {
    let cancelado = false;
    setDoc(null);
    setErro(false);
    const tarefa = pdfjs.getDocument({ url, disableAutoFetch: false });
    tarefa.promise
      .then((d) => !cancelado && (setDoc(d), setPagina(1)))
      .catch(() => !cancelado && setErro(true));
    return () => {
      cancelado = true;
      tarefa.destroy();
    };
  }, [url]);

  useEffect(() => {
    const el = caixa.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setLargura(el.clientWidth));
    ro.observe(el);
    setLargura(el.clientWidth);
    return () => ro.disconnect();
  }, [ecraInteiro]);

  useEffect(() => {
    if (!doc || !canvas.current || !largura) return;
    let tarefa: ReturnType<Awaited<ReturnType<PDFDocumentProxy["getPage"]>>["render"]> | null = null;
    let cancelado = false;
    setADesenhar(true);
    doc.getPage(pagina).then((p) => {
      if (cancelado || !canvas.current) return;
      const base = p.getViewport({ scale: 1 });
      const escala = (largura / base.width) * zoom;
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      const vp = p.getViewport({ scale: escala * dpr });
      const c = canvas.current;
      c.width = vp.width;
      c.height = vp.height;
      c.style.width = `${vp.width / dpr}px`;
      c.style.height = `${vp.height / dpr}px`;
      tarefa = p.render({ canvas: c, viewport: vp });
      tarefa.promise.then(() => !cancelado && setADesenhar(false)).catch(() => {});
    });
    return () => {
      cancelado = true;
      tarefa?.cancel();
    };
  }, [doc, pagina, zoom, largura]);

  // Pré-carrega a página seguinte
  useEffect(() => {
    if (doc && pagina < doc.numPages) doc.getPage(pagina + 1).catch(() => {});
  }, [doc, pagina]);

  const total = doc?.numPages ?? 0;
  const ir = (n: number) => {
    setPagina(Math.min(Math.max(1, n), total || 1));
    caixa.current?.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  };

  // Gestos: deslizar para mudar de página (apenas sem zoom)
  const toque = useRef<number | null>(null);

  if (erro) {
    return (
      <div className="surface-card p-5 text-center text-sm text-muted-foreground">
        Não foi possível carregar este PDF. Tente novamente dentro de instantes.
      </div>
    );
  }

  return (
    <div
      className={
        ecraInteiro
          ? "fixed inset-0 z-50 flex flex-col bg-background"
          : "reader-frame flex flex-col overflow-hidden"
      }
    >
      <div
        ref={caixa}
        className={`relative overflow-auto overscroll-contain bg-muted/60 ${ecraInteiro ? "flex-1" : "h-[72vh]"}`}
        onTouchStart={(e) => (toque.current = e.touches[0]?.clientX ?? null)}
        onTouchEnd={(e) => {
          if (zoom !== 1 || toque.current == null) return;
          const dx = (e.changedTouches[0]?.clientX ?? 0) - toque.current;
          if (dx < -60) ir(pagina + 1);
          if (dx > 60) ir(pagina - 1);
          toque.current = null;
        }}
      >
        <canvas ref={canvas} aria-label={`${titulo} — página ${pagina}`} className="mx-auto block bg-card" />
        {(!doc || aDesenhar) && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        )}
      </div>

      <div className="glass-bar flex items-center gap-1 px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <BotaoIcone label="Página anterior" onClick={() => ir(pagina - 1)} disabled={pagina <= 1}>
          <ChevronLeft className="size-5" />
        </BotaoIcone>
        <span className="min-w-[4.5rem] text-center text-xs font-semibold tabular-nums">
          {total ? `${pagina} / ${total}` : "…"}
        </span>
        <BotaoIcone label="Página seguinte" onClick={() => ir(pagina + 1)} disabled={pagina >= total}>
          <ChevronRight className="size-5" />
        </BotaoIcone>
        <div className="ml-auto flex items-center gap-1">
          <BotaoIcone label="Reduzir" onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))}>
            <ZoomOut className="size-4" />
          </BotaoIcone>
          <button
            onClick={() => setZoom(1)}
            className="min-w-[3rem] text-xs font-semibold tabular-nums text-muted-foreground"
          >
            {Math.round(zoom * 100)}%
          </button>
          <BotaoIcone label="Ampliar" onClick={() => setZoom((z) => Math.min(4, +(z + 0.25).toFixed(2)))}>
            <ZoomIn className="size-4" />
          </BotaoIcone>
          <BotaoIcone
            label={ecraInteiro ? "Sair de ecrã inteiro" : "Ecrã inteiro"}
            onClick={() => setEcraInteiro((v) => !v)}
          >
            {ecraInteiro ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          </BotaoIcone>
        </div>
      </div>
    </div>
  );
}

function BotaoIcone({
  children,
  label,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="flex size-10 items-center justify-center rounded-full text-foreground transition-colors active:bg-secondary disabled:opacity-30"
    >
      {children}
    </button>
  );
}
