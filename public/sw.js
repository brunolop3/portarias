// Service Worker — DIGES/PROE-UEMS Portarias CGE
// Cache simples para permitir uso offline básico (shell da aplicação).
// Estratégia: cache-first para assets estáticos, network-first para APIs.

const CACHE_NAME = "cge-portarias-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
];

// Instalação: pré-cacheia o shell.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

// Ativação: limpa caches antigos.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch: estratégia diferenciada por tipo de recurso.
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  // Ignora requisições não GET.
  if (event.request.method !== "GET") return;
  // Ignora requisições de outros domínios.
  if (url.origin !== self.location.origin) return;

  // APIs: network-first, fallback para cache.
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Copia resposta bem-sucedida para cache.
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Assets estáticos e navegação: cache-first, fallback para rede.
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        // Cacheia apenas respostas válidas.
        if (response.ok && response.type === "basic") {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
