// Utilidades compartidas y detección del entorno del visitante.

/** Primer elemento que coincide con el selector. */
export const $ = (selector, contexto = document) => contexto.querySelector(selector);

/** Todos los elementos que coinciden con el selector, como arreglo. */
export const $$ = (selector, contexto = document) => [...contexto.querySelectorAll(selector)];

/** El visitante pidió "reducir movimiento" en su sistema. */
export const movimientoReducido = matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Hay mouse o trackpad (en celular es false). */
export const punteroFino = matchMedia("(hover: hover) and (pointer: fine)").matches;

/** GSAP y ScrollTrigger se cargaron (vienen de assets/vendor como scripts clásicos). */
export const hayGSAP = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";

/** Se deben ejecutar las animaciones. */
export const animar = hayGSAP && !movimientoReducido;
