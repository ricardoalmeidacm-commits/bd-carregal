import { createServerFn } from "@tanstack/react-start";

type Bloco = { texto: string; pagina: number };

/**
 * Reescreve o texto extraído do folheto como guião de audioguia em português de Portugal.
 * Modo "folheto": narração completa e fluida; modo "resumo": 1–2 minutos estruturados.
 */
export const gerarAudioguia = createServerFn({ method: "POST" })
  .inputValidator((input: { modo: "folheto" | "resumo"; blocos: Bloco[] }) => ({
    modo: input.modo === "resumo" ? ("resumo" as const) : ("folheto" as const),
    blocos: (input.blocos ?? [])
      .filter((b) => typeof b?.texto === "string")
      .slice(0, 800)
      .map((b) => ({ texto: b.texto.slice(0, 600), pagina: Number(b.pagina) || 2 })),
  }))
  .handler(async ({ data }): Promise<Bloco[] | null> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key || !data.blocos.length) return null;
    const fonte = data.blocos
      .map((b) => `[p${b.pagina}] ${b.texto}`)
      .join("\n")
      .slice(0, 40000);
    const regras = `És o narrador da audioguia do Museu Municipal de Carregal do Sal. Escreves exclusivamente em português de Portugal (nunca brasileiro, nunca inglês).
Regras absolutas:
- Ignora TODO o conteúdo em inglês, traduções, citações em inglês e frases mistas.
- Ignora contactos, telefones, emails, URLs, horários, créditos, fichas técnicas, impressão, tiragens, apoios, cabeçalhos e rodapés.
- Usa apenas factos presentes no texto; não inventes datas, nomes ou factos. Corrige erros óbvios de reconhecimento de texto.
- Escreve para ser ouvido: frases claras de 10 a 25 palavras, transições naturais, sem listas, sem abreviaturas, sem símbolos; escreve números e séculos por extenso quando ajudar a fala.
${
  data.modo === "resumo"
    ? "- Produz um RESUMO de audioguia com 150 a 280 palavras (1 a 2 minutos), estruturado em: introdução acolhedora, contexto histórico, pontos mais importantes, uma curiosidade, e encerramento breve."
    : "- Produz uma NARRAÇÃO completa de audioguia que percorre todo o conteúdo histórico, patrimonial, biográfico e cultural, reorganizado para soar natural, mantendo a ordem das páginas."
}
Responde APENAS com JSON: {"paragrafos":[{"pagina":<número da página de origem>,"texto":"..."}]} com parágrafos de 300 a 900 caracteres.`;
    try {
      const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: regras },
            { role: "user", content: `Texto extraído do folheto (a partir da página 2):\n${fonte}` },
          ],
        }),
      });
      if (!r.ok) return null;
      const j = (await r.json()) as { choices?: { message?: { content?: string } }[] };
      const bruto = j.choices?.[0]?.message?.content ?? "";
      const m = bruto.match(/\{[\s\S]*\}/);
      if (!m) return null;
      const p = JSON.parse(m[0]) as { paragrafos?: { pagina?: number; texto?: string }[] };
      const out = (p.paragrafos ?? [])
        .filter((x) => typeof x.texto === "string" && x.texto.trim().length > 20)
        .map((x) => ({ texto: x.texto!.trim(), pagina: Math.max(2, Number(x.pagina) || 2) }));
      return out.length ? out : null;
    } catch {
      return null;
    }
  });
