"use client";

import { useEffect } from "react";

// ===========================================================================
// Registra o Service Worker apenas em produção.
// Em desenvolvimento (NODE_ENV !== "production"), o SW causa problemas de
// cache stale e interfere com HMR, deixando o preview "bugado" em outras
// abas. Por isso, só registramos em build de produção.
// ===========================================================================

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    // Não registra em desenvolvimento.
    if (process.env.NODE_ENV !== "production") return;

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
