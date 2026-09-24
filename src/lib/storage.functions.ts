import { createServerFn } from "@tanstack/react-start";

/**
 * O bucket "flyers" é privado: as ligações públicas são assinadas no servidor
 * para que qualquer visitante possa ver capas e PDFs sem sessão iniciada.
 */
export const getSignedUrls = createServerFn({ method: "POST" })
  .inputValidator((input: { paths: string[] }) => ({
    paths: (input.paths ?? []).filter((p) => typeof p === "string" && p.length > 0).slice(0, 100),
  }))
  .handler(async ({ data }) => {
    const result: Record<string, string> = {};
    if (data.paths.length === 0) return result;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error } = await supabaseAdmin.storage
      .from("flyers")
      .createSignedUrls(data.paths, 60 * 60 * 6);

    if (error) throw new Error(error.message);

    for (const item of signed ?? []) {
      if (item.path && item.signedUrl) result[item.path] = item.signedUrl;
    }
    return result;
  });
