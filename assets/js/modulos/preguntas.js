// Preguntas frecuentes: <details> nativo, con altura animada si hay GSAP.
import { $, $$, animar } from "./entorno.js";

export function iniciarPreguntas() {
  if (!animar) return; // sin animación, <details> funciona solo
  const { gsap } = window;
  $$(".faq-item").forEach((item) => {
    const respuesta = $(".faq-r", item);
    $("summary", item).addEventListener("click", (e) => {
      e.preventDefault();
      if (item.open) {
        gsap.to(respuesta, { height: 0, duration: 0.35, ease: "power2.inOut", onComplete: () => { item.open = false; respuesta.style.height = ""; } });
      } else {
        item.open = true;
        gsap.fromTo(respuesta, { height: 0 }, { height: respuesta.scrollHeight, duration: 0.45, ease: "power3.out", onComplete: () => (respuesta.style.height = "") });
      }
    });
  });
}
