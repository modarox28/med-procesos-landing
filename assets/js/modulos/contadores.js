// Contadores (+120): cuentan desde 0 hasta data-hasta, con data-prefijo opcional.
import { animar } from "./entorno.js?v=16";

export function contar(elemento) {
  const hasta = Number(elemento.dataset.hasta);
  const prefijo = elemento.dataset.prefijo || "";
  if (!animar) { elemento.textContent = prefijo + hasta; return; }
  const valor = { v: 0 };
  window.gsap.to(valor, { v: hasta, duration: 1.8, ease: "power3.out", onUpdate: () => (elemento.textContent = prefijo + Math.round(valor.v)) });
}
