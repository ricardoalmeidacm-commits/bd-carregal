import { Loader2, Maximize2, Minimize2, ZoomIn, ZoomOut } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import * as pdfjs from "pdfjs-dist";
import type { PDFDocumentProxy } from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

/** Leitor de PDF integrado: todas as páginas empilhadas em scroll vertical contínuo. */
export default function LeitorPdf({ url, titulo }: { url: string; titulo: string }) {
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [ratios, setRatios] = useState<number[]>([]);
  const [erro, setErro] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [ecraInteiro, setEcraInteiro] = useState(false);
  const caixa = useRef<HTMLDivElement>(null);
  const [largura, setLargura] = useState(0);

  useEffect(() => {
    let cancelado = false;
    setDoc(null);
    setErro(false);
    const tarefa = pdfjs.getDocument({ url });
    tarefa.promise
      .then(async (d) => {
        const p1 = await d.getPage(1);
        const vp = p1.getViewport({ scale: 1 });
        if (cancelado) return;
        setRatios(Array.from({ length: d.numPages }, () => vp.height / vp.width));
        setDoc(d);
      })
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

  if (erro) {
    return (
      <div className="surface-card p-5 text-center text-sm text-muted-foreground">
        Não foi possível carregar este PDF. Tente novamente dentro de instantes.
      </div>
    );
  }

  const larguraPagina = Math.max(0, (largura - 16) * zoom);

  return (
    <div
      className={
        ecraInteiro ? "fixed inset-0 z-50 flex flex-col bg-background" : "reader-frame flex flex-col overflow-hidden"
      }
    >
      <div
        ref={caixa}
        className={`relative overflow-auto overscroll-contain bg-muted/60 ${ecraInteiro ? "flex-1" : "h-[78vh]"}`}
      >
        {!doc ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 p-2" style={{ width: zoom > 1 ? larguraPagina + 16 : undefined }}>
            {ratios.map((r, i) => (
              <Pagina
                key={i}
                doc={doc}
                numero={i + 1}
                largura={larguraPagina}
                ratio={r}
                raiz={caixa}
                titulo={titulo}
              />
            ))}
          </div>
        )}
      </div>

      <div className="glass-bar flex items-center gap-1 px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <span className="px-2 text-xs font-semibold tabular-nums text-muted-foreground">
          {doc ? `${doc.numPages} páginas` : "…"}
        </span>
        <div className="ml-auto flex items-center gap-1">
          <BotaoIcone label="Reduzir" onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))}>
            <ZoomOut className="size-4" />
          </BotaoIcone>
          <button onClick={() => setZoom(1)} className="min-w-[3rem] text-xs font-semibold tabular-nums text-muted-foreground">
            {Math.round(zoom * 100)}%
          </button>
          <BotaoIcone label="Ampliar" onClick={() => setZoom((z) => Math.min(4, +(z + 0.25).toFixed(2)))}>
            <ZoomIn className="size-4" />
          </BotaoIcone>
          <BotaoIcone label={ecraInteiro ? "Sair de ecrã inteiro" : "Ecrã inteiro"} onClick={() => setEcraInteiro((v) => !v)}>
            {ecraInteiro ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          </BotaoIcone>
        </div>
      </div>
    </div>
  );
}

/** Página individual: só é desenhada quando se aproxima da zona visível (carregamento progressivo). */
function Pagina({
  doc,
  numero,
  largura,
  ratio,
  raiz,
  titulo,
}: {
  doc: PDFDocumentProxy;
  numero: number;
  largura: number;
  ratio: number;
  raiz: React.RefObject<HTMLDivElement | null>;
  titulo: string;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [visivel, setVisivel] = useState(numero <= 2);
  const [pronto, setPronto] = useState(false);
  const [altura, setAltura] = useState(largura * ratio);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e?.isIntersecting && setVisivel(true), {
      root: raiz.current,
      rootMargin: "800px 0px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, [raiz]);

  useEffect(() => {
    if (!visivel || !largura || !canvas.current) return;
    let tarefa: ReturnType<Awaited<ReturnType<PDFDocumentProxy["getPage"]>>["render"]> | null = null;
    let cancelado = false;
    doc.getPage(numero).then((p) => {
      if (cancelado || !canvas.current) return;
      const base = p.getViewport({ scale: 1 });
      const escala = largura / base.width;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const vp = p.getViewport({ scale: escala * dpr });
      const c = canvas.current;
      c.width = vp.width;
      c.height = vp.height;
      c.style.width = `${vp.width / dpr}px`;
      c.style.height = `${vp.height / dpr}px`;
      setAltura(vp.height / dpr);
      tarefa = p.render({ canvasContext: c.getContext("2d")!, viewport: vp });
      tarefa.promise.then(() => !cancelado && setPronto(true)).catch(() => {});
    });
    return () => {
      cancelado = true;
      tarefa?.cancel();
    };
  }, [visivel, largura, doc, numero]);

  return (
    <div
      ref={wrap}
      className="relative shrink-0 bg-card shadow-soft"
      style={{ width: largura, height: pronto ? altura : largura * ratio }}
    >
      <canvas ref={canvas} aria-label={`${titulo} — página ${numero}`} className="block" />
      {!pronto && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="size-5 animate-spin text-primary/60" />
        </div>
      )}
    </div>
  );
}

function BotaoIcone({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className="flex size-10 items-center justify-center rounded-full text-foreground transition-colors active:bg-secondary"
    >
      {children}
    </button>
  );
}
