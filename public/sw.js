// Service worker mínimo: permite instalação como aplicação no telemóvel.
// Não faz cache de navegação para nunca servir conteúdo desatualizado
// nem interferir com autenticação.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
