// Desplazamiento: volver al inicio al recargar, scroll suave con Lenis y enlaces internos (#seccion).
import { $, $$, movimientoReducido, punteroFino, hayGSAP } from "./entorno.js?v=16";

let lenis = null;

/** Lenis (scroll suave) si existe; null en celular o con movimiento reducido. */
export const obtenerLenis = () => lenis;

/**
 * @param {{ antesDeNavegar?: () => void }} opciones  se llama antes de ir a una sección (p. ej. cerrar el menú)
 */
export function iniciarScroll({ antesDeNavegar = () => {} } = {}) {
  // Al recargar, siempre al inicio (si se llega con un #enlace desde fuera, se respeta)
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  const navegacion = performance.getEntriesByType("navigation")[0];
  if (!location.hash || (navegacion && navegacion.type === "reload")) {
    if (location.hash) history.replaceState(null, "", location.pathname + location.search);
    window.scrollTo(0, 0);
  }

  // Scroll suave solo con mouse o trackpad: en celular el scroll nativo se siente mejor
  if (hayGSAP && !movimientoReducido && punteroFino && typeof window.Lenis !== "undefined") {
    lenis = new window.Lenis({ lerp: 0.11 });
    lenis.on("scroll", window.ScrollTrigger.update);
    window.gsap.ticker.add((t) => lenis.raf(t * 1000));
    window.gsap.ticker.lagSmoothing(0);
  }

  // Enlaces internos: desplazamiento suave y foco en la sección (accesibilidad)
  $$('a[href^="#"]').forEach((enlace) =>
    enlace.addEventListener("click", (e) => {
      const id = enlace.getAttribute("href");
      const destino = id.length > 1 && $(id);
      if (!destino) return;
      e.preventDefault();
      antesDeNavegar();
      if (lenis) lenis.scrollTo(destino, { offset: -8, duration: 1.2 });
      else destino.scrollIntoView({ behavior: movimientoReducido ? "auto" : "smooth" });
      if (id !== "#inicio") {
        destino.setAttribute("tabindex", "-1");
        destino.focus({ preventScroll: true });
      }
    })
  );
}
