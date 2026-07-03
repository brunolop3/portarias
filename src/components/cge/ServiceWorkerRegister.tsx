"use client";

import { useEffect } from "react";

// ===========================================================================
// Registra o Service Worker em produção (ou quando disponível).
// Em desenvolvimento, o SW pode interferir com HMR, então registramos
// apenas se o navegador suportar e o arquivo existir.
// ===========================================================================

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    // Registra após o load para não competir com recursos críticos.
    function registrar() {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((e) => console.warn("[SW] Falha ao registrar:", e));
    }
    if (document.readyState === "complete") {
      registrar();
    } else {
      window.addEventListener("load", registrar, { once: true });
      return () => window.removeEventListener("load", registrar);
    }
  }, []);

  return null;
}
