// Barra superior: fondo al bajar, se oculta al bajar y aparece al subir, y menú de celular.
import { $, $$, animar } from "./entorno.js?v=16";
import { obtenerLenis } from "./scroll.js?v=16";

const nav = $("#nav");
const boton = $(".nav-boton");
const menu = $("#menu");
const estaAbierto = () => boton.getAttribute("aria-expanded") === "true";

export function abrirMenu() {
  boton.setAttribute("aria-expanded", "true");
  boton.setAttribute("aria-label", "Cerrar menú");
  nav.classList.add("menu-abierto");
  nav.classList.remove("oculta");
  menu.classList.add("abierto");
  document.documentElement.style.overflow = "hidden";
  obtenerLenis()?.stop();
  if (animar) {
    window.gsap.fromTo($$("a", menu), { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5, stagger: 0.05, delay: 0.15, ease: "power3.out" });
  }
  setTimeout(() => $("a", menu).focus(), 200);
}

export function cerrarMenu() {
  if (!estaAbierto()) return;
  boton.setAttribute("aria-expanded", "false");
  boton.setAttribute("aria-label", "Abrir menú");
  menu.classList.remove("abierto");
  document.documentElement.style.overflow = "";
  obtenerLenis()?.start();
  // Se quita la clase cuando termina la animación de cierre del círculo
  setTimeout(() => { if (!estaAbierto()) nav.classList.remove("menu-abierto"); }, 650);
}

export function iniciarNavegacion() {
  let ultimoY = 0;
  const alDesplazar = () => {
    const y = window.scrollY;
    nav.classList.toggle("con-fondo", y > 20);
    if (!estaAbierto()) {
      if (y > 400 && y > ultimoY + 4) nav.classList.add("oculta");
      else if (y < ultimoY - 4 || y < 400) nav.classList.remove("oculta");
    }
    ultimoY = y;
  };
  addEventListener("scroll", alDesplazar, { passive: true });
  alDesplazar();

  boton.addEventListener("click", () => (estaAbierto() ? cerrarMenu() : abrirMenu()));
  addEventListener("keydown", (e) => {
    if (e.key === "Escape" && estaAbierto()) { cerrarMenu(); boton.focus(); }
  });
  // Si se agranda la ventana a tamaño escritorio con el menú abierto, se cierra
  matchMedia("(min-width: 901px)").addEventListener("change", (e) => { if (e.matches) cerrarMenu(); });
}
