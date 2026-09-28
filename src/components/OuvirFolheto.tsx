import { Headphones, Loader2, Pause, Play, SkipBack, SkipForward, Square, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import * as pdfjs from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

type Frase = { texto: string; pagina: number };
type Modo = "folheto" | "resumo";

const PREFIXO = "bdmcs:audio3:";

/** Extrai o texto do PDF (com cache local) e divide-o em frases com o número da página. */
async function obterFrases(
  chave: string,
  url: string,
  aoProgresso: (t: string) => void,
): Promise<Frase[]> {
  try {
    const guardado = localStorage.getItem(PREFIXO + chave);
    if (guardado) return JSON.parse(guardado) as Frase[];
  } catch {
    /* ignora */
  }
  const doc = await pdfjs.getDocument({ url }).promise;
  const frases: Frase[] = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const p = await doc.getPage(n);
    const c = await p.getTextContent();
    const texto = c.items
      .map((i) => ("str" in i ? i.str + (i.hasEOL ? " " : "") : ""))
      .join("")
      .replace(/\s+/g, " ")
      .trim();
    let final = texto;
    if (final.length < 40) final = await reconhecer(p, aoProgresso, n, doc.numPages);
    for (const f of final.match(/[^.!?…]+[.!?…]+|[^.!?…]+$/g) ?? []) {
      const t = f.trim();
      if (t.length > 2)
        frases.push(...partir(limpar(t)).filter(legivel).map((x) => ({ texto: x, pagina: n })));
    }
  }
  doc.destroy();
  await terminarOcr();
  try {
    localStorage.setItem(PREFIXO + chave, JSON.stringify(frases));
  } catch {
    /* sem espaço */
  }
  return frases;
}

// Reconhecimento de texto gratuito, no próprio dispositivo, para PDFs digitalizados/sem camada de texto.
let ocr: Promise<import("tesseract.js").Worker> | null = null;
async function reconhecer(
  p: Awaited<ReturnType<pdfjs.PDFDocumentProxy["getPage"]>>,
  aoProgresso: (t: string) => void,
  n: number,
  total: number,
): Promise<string> {
  aoProgresso(`A reconhecer texto da página ${n} de ${total}…`);
  if (!ocr) ocr = import("tesseract.js").then((t) => t.createWorker("por"));
  const w = await ocr;
  const base = p.getViewport({ scale: 1 });
  const vp = p.getViewport({ scale: Math.min(2.5, 1800 / base.width) });
  const c = document.createElement("canvas");
  c.width = vp.width;
  c.height = vp.height;
  await p.render({ canvasContext: c.getContext("2d")!, viewport: vp }).promise;
  const r = await w.recognize(c);
  return r.data.text.replace(/-\n/g, "").replace(/\s+/g, " ").trim();
}
async function terminarOcr() {
  if (!ocr) return;
  const w = await ocr;
  ocr = null;
  await w.terminate();
}

const EN = new Set("the and was were his her with this that from which of on in at by he she it is are born son".split(" "));
const PT = new Set("de do da dos das que em no na com uma um foi era para pelo pela os as ao e".split(" "));

const bom = (w: string) =>
  /^[(]?\d+[ºª°,.;:)]*$/.test(w) ||
  (/^[«"“(]?[A-Za-zÀ-ÿ]{2,}[a-zà-ÿ]*[.,;:!?»"”)]*$/.test(w) && /[aeiouáéíóúâêôãõà]/i.test(w) && !/^[A-Z]{2,4}[,.)]*$/.test(w)) ||
  /^(a|o|e|é|à)$/i.test(w);

/** Remove ruído no início da frase: começa na primeira sequência de 4 palavras válidas. */
function limpar(t: string): string {
  const tk = t.split(/\s+/);
  for (let i = 0; i + 4 <= tk.length; i++) if (tk.slice(i, i + 4).every(bom)) return tk.slice(i).join(" ");
  return t;
}

/** Descarta ruído do reconhecimento de imagem e frases em inglês (folhetos bilingues). */
function legivel(t: string): boolean {
  const tokens = t.split(/\s+/);
  if (tokens.length < 3) return false;
  const bons = tokens.filter((w) => /^[(]?\d+[ºª°,.;:)]*$/.test(w) || /^[«"“(]?[A-Za-zÀ-ÿ]{2,}[a-zà-ÿ]*[.,;:!?»"”)]*$/.test(w) && /[aeiouáéíóúâêôãõà]/i.test(w));
  if (bons.length / tokens.length < 0.75) return false;
  const low = tokens.map((w) => w.toLowerCase().replace(/[^a-zà-ÿ]/g, ""));
  const en = low.filter((w) => EN.has(w)).length;
  const pt = low.filter((w) => PT.has(w)).length;
  return !(en > pt);
}

/** Frases muito longas são cortadas (o Safari/Chrome interrompem falas longas). */
function partir(t: string): string[] {
  if (t.length <= 220) return [t];
  const out: string[] = [];
  let atual = "";
  for (const parte of t.split(/(?<=[,;:])\s+|\s+/)) {
    if ((atual + " " + parte).length > 200) {
      if (atual) out.push(atual);
      atual = parte;
    } else atual = atual ? `${atual} ${parte}` : parte;
  }
  if (atual) out.push(atual);
  return out;
}

const PARAGEM = new Set(
  "a o as os um uma de do da dos das em no na nos nas por para com sem e ou que se ao aos à às é foi são era como mais mas pelo pela seu sua seus suas este esta isso não the and of".split(
    " ",
  ),
);

/** Resumo extrativo local: escolhe as frases mais representativas (≈30 s a 2 min de fala). */
function resumir(frases: Frase[]): Frase[] {
  const validas = frases.filter((f) => f.texto.split(" ").length >= 6);
  if (validas.length <= 6) return validas.length ? validas : frases.slice(0, 8);
  const freq = new Map<string, number>();
  const palavras = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .match(/[a-z0-9]{3,}/g)
      ?.filter((w) => !PARAGEM.has(w)) ?? [];
  validas.forEach((f) => palavras(f.texto).forEach((w) => freq.set(w, (freq.get(w) ?? 0) + 1)));
  const pont = validas.map((f, i) => {
    const ws = palavras(f.texto);
    const base = ws.reduce((s, w) => s + (freq.get(w) ?? 0), 0) / Math.max(4, ws.length);
    const posicao = i < 3 ? 1.5 : 1; // início costuma apresentar o tema
    const numeros = /\b(1[0-9]{3}|20[0-9]{2}|século)\b/i.test(f.texto) ? 1.2 : 1; // informação histórica
    return { i, s: base * posicao * numeros };
  });
  const totalPalavras = validas.reduce((s, f) => s + f.texto.split(" ").length, 0);
  const alvo = Math.min(280, Math.max(80, Math.round(totalPalavras * 0.2))); // ~150 palavras/min
  const escolhidas: number[] = [];
  let conta = 0;
  for (const { i } of [...pont].sort((a, b) => b.s - a.s)) {
    escolhidas.push(i);
    conta += validas[i]!.texto.split(" ").length;
    if (conta >= alvo) break;
  }
  return escolhidas.sort((a, b) => a - b).map((i) => validas[i]!);
}

/** Remove caracteres que bloqueiam alguns motores de voz (controlo, emojis, símbolos soltos). */
function higienizar(t: string): string {
  return t
    .normalize("NFC")
    .replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u2028-\u202F\uFEFF]/g, " ")
    .replace(/[\p{Extended_Pictographic}\uFFFD]/gu, "")
    .replace(/[<>{}\[\]|\\^~_*#@`=]/g, " ")
    .replace(/([.,;:!?])\1+/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

/** Agrupa as frases em blocos de 500–1000 caracteres (nunca o texto inteiro de uma vez). */
function agrupar(frases: Frase[]): Frase[] {
  const out: Frase[] = [];
  let atual = "";
  let pag = 1;
  const fechar = () => {
    const t = higienizar(atual);
    if (t.length > 1) out.push({ texto: t, pagina: pag });
    atual = "";
  };
  for (const f of frases) {
    const t = higienizar(f.texto);
    if (!t) continue;
    if (!atual) pag = f.pagina;
    if (atual && (atual.length + t.length + 1 > 1000 || (atual.length >= 500 && f.pagina !== pag))) fechar();
    if (!atual) pag = f.pagina;
    atual = atual ? `${atual} ${t}` : t;
    if (atual.length >= 800) fechar();
  }
  if (atual) fechar();
  return out;
}

function ordenarVozes(vozes: SpeechSynthesisVoice[]): SpeechSynthesisVoice[] {
  const pontuar = (v: SpeechSynthesisVoice) => {
    const lang = v.lang.toLowerCase().replace("_", "-");
    const nome = v.name.toLowerCase();
    if (lang === "pt-pt" && /portugal|europe|português/i.test(nome)) return 5;
    if (lang === "pt-pt") return 4;
    if (lang.startsWith("pt")) return 3;
    if (v.default) return 2;
    return 1;
  };
  return [...vozes].sort((a, b) => pontuar(b) - pontuar(a));
}

async function carregarVozes(): Promise<SpeechSynthesisVoice[]> {
  const synth = window.speechSynthesis;
  const existentes = synth.getVoices();
  if (existentes.length) return ordenarVozes(existentes);
  return new Promise((resolve) => {
    let terminou = false;
    const terminar = () => {
      if (terminou) return;
      terminou = true;
      synth.removeEventListener("voiceschanged", terminar);
      resolve(ordenarVozes(synth.getVoices()));
    };
    synth.addEventListener("voiceschanged", terminar, { once: true });
    window.setTimeout(terminar, 1500);
  });
}

type Estado = "parado" | "a-preparar" | "pronto" | "a-reproduzir" | "pausado" | "concluido" | "erro";

export default function OuvirFolheto({ chave, url }: { chave: string; url: string }) {
  const [suportado, setSuportado] = useState(true);
  const [modo, setModo] = useState<Modo | null>(null);
  const [frases, setFrases] = useState<Frase[]>([]);
  const [indice, setIndice] = useState(0);
  const [estado, setEstado] = useState<Estado>("parado");
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [vozNome, setVozNome] = useState<string | null>(null);
  const [preparo, setPreparo] = useState("A preparar…");
  const indiceRef = useRef(0);
  const listaRef = useRef<Frase[]>([]);
  const ativo = useRef(false);
  const falaRef = useRef<SpeechSynthesisUtterance | null>(null);
  const pausadoRef = useRef(false);
  const vozesRef = useRef<SpeechSynthesisVoice[]>([]);
  const vozRef = useRef(0);
  const iniciouRef = useRef(false);
  const vigiaRef = useRef<number | null>(null);

  useEffect(() => {
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) setSuportado(false);
    else void carregarVozes().then((v) => { vozesRef.current = v; });
    return () => {
      if (vigiaRef.current !== null) window.clearTimeout(vigiaRef.current);
      ativo.current = false;
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  function falha(mensagem: string) {
    ativo.current = false;
    pausadoRef.current = false;
    window.speechSynthesis.cancel();
    setErro(`${mensagem} Confirme o volume multimédia do telemóvel e toque em “Tentar novamente”.`);
    setEstado("erro");
  }

  function falar(i: number, tentativa = 0) {
    const lista = listaRef.current;
    if (!ativo.current) return;
    if (i >= lista.length) {
      ativo.current = false;
      setEstado("concluido");
      setIndice(lista.length - 1);
      return;
    }
    indiceRef.current = i;
    setIndice(i);
    iniciouRef.current = false;
    const u = new SpeechSynthesisUtterance(lista[i]!.texto);
    falaRef.current = u;
    const voz = vozesRef.current[vozRef.current];
    if (voz) u.voice = voz;
    u.lang = voz?.lang ?? "pt-PT";
    u.rate = 1;
    u.volume = 1;
    u.pitch = 1;
    u.onstart = () => {
      iniciouRef.current = true;
      if (vigiaRef.current !== null) window.clearTimeout(vigiaRef.current);
      setEstado("a-reproduzir");
    };
    u.onend = () => {
      if (vigiaRef.current !== null) window.clearTimeout(vigiaRef.current);
      if (!ativo.current || indiceRef.current !== i) return;
      if (!iniciouRef.current) {
        tentarOutraVoz(i, tentativa);
        return;
      }
      falar(i + 1);
    };
    u.onerror = (e) => {
      if (e.error === "interrupted" || e.error === "canceled") return;
      if (ativo.current && indiceRef.current === i) tentarOutraVoz(i, tentativa);
    };
    const s = window.speechSynthesis;
    if (s.paused) s.resume();
    s.speak(u);
    vigiaRef.current = window.setTimeout(() => {
      if (ativo.current && indiceRef.current === i && !iniciouRef.current) tentarOutraVoz(i, tentativa);
    }, 3500);
  }

  function tentarOutraVoz(i: number, tentativa: number) {
    if (!ativo.current || indiceRef.current !== i) return;
    window.speechSynthesis.cancel();
    if (tentativa < Math.min(2, vozesRef.current.length - 1)) {
      vozRef.current += 1;
      const voz = vozesRef.current[vozRef.current];
      setVozNome(voz?.name ?? null);
      window.setTimeout(() => falar(i, tentativa + 1), 120);
      return;
    }
    falha("O navegador não conseguiu iniciar a voz disponível.");
  }

  async function iniciar(m: Modo) {
    ativo.current = false;
    window.speechSynthesis.cancel();
    setErro(null);
    setAviso(null);
    setVozNome(null);
    setModo(m);
    setEstado("a-preparar");
    try {
      setPreparo("A preparar…");
      const todas = await obterFrases(chave, url, setPreparo);
      if (!todas.length) {
        setErro("Este folheto não tem texto legível para leitura áudio.");
        setEstado("parado");
        return;
      }
      let lista = todas;
      if (m === "resumo") {
        const k = `${chave}:resumo`;
        const g = localStorage.getItem(PREFIXO + k);
        lista = g ? (JSON.parse(g) as Frase[]) : resumir(todas);
        if (!g) {
          try {
            localStorage.setItem(PREFIXO + k, JSON.stringify(lista));
          } catch {
            /* ignora */
          }
        }
      }
      const blocos = agrupar(lista);
      if (!blocos.length) {
        setErro("Este folheto não tem texto legível para leitura áudio.");
        setEstado("parado");
        return;
      }
      listaRef.current = blocos;
      setFrases(blocos);
      indiceRef.current = 0;
      setIndice(0);
      pausadoRef.current = false;
      const vozes = await carregarVozes();
      vozesRef.current = vozes;
      vozRef.current = 0;
      if (!vozes.length) {
        setAviso("O telemóvel não apresentou nenhuma voz. Verifique se existe uma voz instalada nas definições de idioma.");
      } else {
        const voz = vozes[0];
        setVozNome(voz.name);
        if (!voz.lang.toLowerCase().replace("_", "-").startsWith("pt")) {
          setAviso("Não foi encontrada uma voz portuguesa; será usada a melhor voz disponível no dispositivo.");
        }
      }
      // A extração assíncrona perde a autorização do toque no iPhone. O som começa num novo toque explícito.
      setEstado("pronto");
    } catch {
      setErro("Não foi possível preparar a leitura áudio.");
      setEstado("parado");
    }
  }

  function pausar() {
    pausadoRef.current = true;
    window.speechSynthesis.pause();
    setEstado("pausado");
  }
  function retomar() {
    setErro(null);
    pausadoRef.current = false;
    if (estado === "pronto" || estado === "concluido" || estado === "erro") {
      ativo.current = true;
      if (estado === "concluido") indiceRef.current = 0;
      setEstado("a-reproduzir");
      // Chamada síncrona durante o toque: necessária para desbloquear som no iPhone/Android.
      falar(indiceRef.current);
      return;
    }
    if (window.speechSynthesis.paused && window.speechSynthesis.speaking) {
      ativo.current = true;
      window.speechSynthesis.resume();
    } else {
      ativo.current = true;
      const i = indiceRef.current;
      indiceRef.current = -1;
      window.speechSynthesis.cancel();
      indiceRef.current = i;
      falar(i);
    }
    setEstado("a-reproduzir");
  }
  function parar() {
    if (vigiaRef.current !== null) window.clearTimeout(vigiaRef.current);
    ativo.current = false;
    pausadoRef.current = false;
    window.speechSynthesis.cancel();
    setEstado("parado");
    setErro(null);
    setIndice(0);
    indiceRef.current = 0;
  }
  function saltar(d: number) {
    const i = Math.min(Math.max(0, indiceRef.current + d), listaRef.current.length - 1);
    ativo.current = true;
    pausadoRef.current = false;
    indiceRef.current = -1;
    window.speechSynthesis.cancel();
    setEstado("a-reproduzir");
    indiceRef.current = i;
    falar(i);
  }

  if (!suportado) {
    return (
      <p className="surface-card mt-3 p-3 text-xs text-muted-foreground">
        A leitura áudio não é suportada neste navegador.
      </p>
    );
  }

  const emCurso = estado !== "parado";
  const progresso =
    estado === "concluido" ? 100 : frases.length ? Math.round((indice / frases.length) * 100) : 0;
  const rotulo =
    estado === "a-preparar"
      ? preparo
      : estado === "pausado"
        ? "Pausado"
        : estado === "pronto"
          ? "Pronto a reproduzir"
        : estado === "concluido"
          ? "Concluído"
          : estado === "erro"
            ? "Não foi possível reproduzir"
          : "A reproduzir";

  return (
    <section aria-label="Leitura áudio" className="mt-3">
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => iniciar("folheto")}
          disabled={estado === "a-preparar"}
          className="flex items-center justify-center gap-2 rounded-full bg-primary py-2.5 text-xs font-semibold text-primary-foreground shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60"
        >
          <Volume2 className="size-4" aria-hidden /> Ouvir Folheto
        </button>
        <button
          onClick={() => iniciar("resumo")}
          disabled={estado === "a-preparar"}
          className="flex items-center justify-center gap-2 rounded-full border border-primary/40 bg-card py-2.5 text-xs font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60"
        >
          <Headphones className="size-4" aria-hidden /> Ouvir Resumo
        </button>
      </div>

      {erro && (
        <div role="alert" className="surface-card mt-2 p-3 text-xs text-destructive">
          <p>{erro}</p>
          <button onClick={retomar} className="mt-2 font-semibold text-primary underline underline-offset-2">
            Tentar novamente
          </button>
        </div>
      )}

      {emCurso && (
        <div className="surface-card mt-3 p-3" role="region" aria-label="Controlos de reprodução">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2 font-semibold" aria-live="polite">
              {estado === "a-preparar" ? (
                <Loader2 className="size-3.5 animate-spin text-primary" aria-hidden />
              ) : (
                <span
                  className={`size-2 rounded-full bg-primary ${estado === "a-reproduzir" ? "animate-pulse" : "opacity-40"}`}
                  aria-hidden
                />
              )}
              {rotulo} · {modo === "resumo" ? "Resumo" : "Folheto"}
            </span>
            {frases[indice] && estado !== "a-preparar" && (
              <span className="text-muted-foreground">Página {frases[indice]!.pagina}</span>
            )}
          </div>
          {vozNome && <p className="mt-1 text-xs text-muted-foreground">Voz: {vozNome}</p>}
          {aviso && <p className="mt-2 text-xs text-muted-foreground">{aviso}</p>}
          <div
            className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={progresso}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Progresso da leitura"
          >
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progresso}%` }} />
          </div>
          <p className="mt-1 text-right text-xs text-muted-foreground">{progresso}%</p>
          {frases[indice] && estado !== "a-preparar" && (
            <p className="mt-2 line-clamp-4 text-xs leading-relaxed text-muted-foreground">{frases[indice]!.texto}</p>
          )}
          {modo === "resumo" && frases.length > 0 && estado !== "a-preparar" && (
            <details className="mt-2 text-xs text-muted-foreground">
              <summary className="cursor-pointer font-semibold text-foreground">Resumo gerado</summary>
              <p className="mt-2 leading-relaxed">{frases.map((f) => f.texto).join(" ")}</p>
            </details>
          )}
          <div className="mt-2 flex items-center justify-center gap-1">
            <Controlo label="Recuar" onClick={() => saltar(-1)} disabled={estado === "a-preparar"}>
              <SkipBack className="size-4" />
            </Controlo>
            {estado === "a-reproduzir" ? (
              <Controlo label="Pausar" onClick={pausar} destaque>
                <Pause className="size-5" />
              </Controlo>
            ) : (
              <Controlo label={estado === "pausado" ? "Continuar" : "Reproduzir"} onClick={retomar} destaque disabled={estado === "a-preparar"}>
                <Play className="size-5" />
              </Controlo>
            )}
            <Controlo label="Parar" onClick={parar}>
              <Square className="size-4" />
            </Controlo>
            <Controlo label="Avançar" onClick={() => saltar(1)} disabled={estado === "a-preparar"}>
              <SkipForward className="size-4" />
            </Controlo>
          </div>
        </div>
      )}
    </section>
  );
}

function Controlo({
  children,
  label,
  onClick,
  disabled,
  destaque,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  destaque?: boolean;
}) {
  return (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40 ${
        destaque ? "size-12 bg-primary text-primary-foreground" : "size-10 text-foreground active:bg-secondary"
      }`}
    >
      {children}
    </button>
  );
}
