import { useCallback, useEffect, useState } from "react";

const KEY = "bdmcs:favoritos";

function ler(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function useFavoritos() {
  const [favoritos, setFavoritos] = useState<string[]>([]);

  useEffect(() => {
    setFavoritos(ler());
    const onStorage = () => setFavoritos(ler());
    window.addEventListener("storage", onStorage);
    window.addEventListener("bdmcs:favoritos", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("bdmcs:favoritos", onStorage);
    };
  }, []);

  const alternar = useCallback((slug: string) => {
    const atuais = ler();
    const novos = atuais.includes(slug) ? atuais.filter((s) => s !== slug) : [...atuais, slug];
    window.localStorage.setItem(KEY, JSON.stringify(novos));
    window.dispatchEvent(new Event("bdmcs:favoritos"));
    return novos.includes(slug);
  }, []);

  const isFavorito = useCallback((slug: string) => favoritos.includes(slug), [favoritos]);

  return { favoritos, alternar, isFavorito };
}
