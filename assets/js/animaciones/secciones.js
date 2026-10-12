// Animaciones de scroll de cada sección (GSAP + ScrollTrigger).
// Cada función corresponde a una sección del HTML; se llaman desde main.js.
import { $, $$, punteroFino } from "../modulos/entorno.js?v=16";
import { contar } from "../modulos/contadores.js?v=16";

const g = () => window.gsap;
const ST = () => window.ScrollTrigger;

/** Frases resaltadas que se pintan, títulos que suben tras una máscara y etiquetas que se despliegan. */
export function animarTextos() {
  $$(".resalta").filter((m) => !m.closest(".hero")).forEach((m) => {
    ST().create({ trigger: m, start: "top 82%", once: true, onEnter: () => m.classList.add("pintado") });
  });
  $$(".seccion .titulo, .camino .titulo, .agenda .titulo, .seccion .entrada, .camino .entrada, .agenda .entrada").forEach((el) => {
    g().fromTo(el, { clipPath: "inset(0 0 100% 0)", y: 24 }, { clipPath: "inset(0 0 0% 0)", y: 0, duration: 0.9, ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 88%", once: true }, clearProps: "clipPath" });
  });
  $$(".etiqueta").filter((e) => !e.closest(".hero")).forEach((el) => {
    g().from(el, { scaleX: 0, transformOrigin: "left center", duration: 0.6, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 90%", once: true } });
  });
}

/** Por qué no hacerlo solo: los riesgos se descubren como una página que se pasa. */
export function animarRiesgos() {
  g().from(".riesgos li", { clipPath: "inset(0 100% 0 0)", duration: 1, ease: "power3.inOut", stagger: 0.18,
    scrollTrigger: { trigger: ".riesgos", start: "top 80%", once: true }, clearProps: "clipPath" });
}

/** El camino: horizontal y fijo en escritorio; línea vertical que se llena en celular. */
export function animarCamino(mm) {
  mm.add("(min-width: 901px)", () => {
    const etapas = $(".etapas"), lista = $$(".etapa");
    const distancia = () => Math.max(0, etapas.scrollWidth - innerWidth + 40);
    const progreso = $(".camino-progreso");
    g().timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: ".camino", start: "top top", end: () => "+=" + (distancia() + innerHeight * 0.6),
        pin: ".camino-fijo", scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1,
        onUpdate: (st) => lista.forEach((e, i) => e.classList.toggle("activa", st.progress >= i / lista.length - 0.02)),
      },
    })
      .to(etapas, { x: () => -distancia() }, 0)
      .to(".camino-barra", { scaleX: 1 }, 0)
      .to(".camino-avion", { x: () => progreso.offsetWidth - 20 }, 0);
    g().from(lista, { y: 60, rotate: 2, opacity: 0, duration: 0.8, stagger: 0.1, ease: "power3.out", scrollTrigger: { trigger: ".camino", start: "top 70%", once: true } });
  });
  mm.add("(max-width: 900px)", () => {
    const etapas = $(".etapas");
    ST().create({ trigger: etapas, start: "top 70%", end: "bottom 60%", scrub: true, onUpdate: (st) => etapas.style.setProperty("--avance", st.progress.toFixed(3)) });
    $$(".etapa").forEach((e) => {
      ST().create({ trigger: e, start: "top 65%", onEnter: () => e.classList.add("activa"), onLeaveBack: () => e.classList.remove("activa") });
      g().from(e, { x: 40, opacity: 0, duration: 0.7, ease: "power3.out", scrollTrigger: { trigger: e, start: "top 88%", once: true } });
    });
  });
}

/** Servicios: una baraja que se abre en abanico hasta formar la cuadrícula (escritorio). */
export function animarServicios(mm) {
  mm.add("(min-width: 1025px)", () => {
    const baraja = $(".baraja"), cartas = $$(".carta", baraja), caja = baraja.getBoundingClientRect();
    const centro = (el) => el.getBoundingClientRect();
    g().from(cartas, {
      x: (i, el) => caja.left + caja.width / 2 - (centro(el).left + centro(el).width / 2),
      y: (i, el) => caja.top + caja.height / 2 - (centro(el).top + centro(el).height / 2) + 40,
      rotate: (i) => (i - cartas.length / 2) * 4,
      scale: 0.9, ease: "power2.out", stagger: 0.03,
      scrollTrigger: { trigger: baraja, start: "top 85%", end: "top 30%", scrub: 0.9 },
    });
  });
  mm.add("(max-width: 1024px)", () => {
    g().from(".carta", { y: 40, opacity: 0, duration: 0.6, stagger: 0.07, ease: "power3.out", scrollTrigger: { trigger: ".baraja", start: "top 85%", once: true } });
  });
}

/** Mito o realidad: las tarjetas se reparten y la primera se voltea sola como demostración. */
export function animarMitos() {
  g().from(".mitos-titulo", { yPercent: 40, opacity: 0, duration: 1, ease: "power4.out", scrollTrigger: { trigger: ".mitos", start: "top 75%", once: true } });
  g().from(".mito", {
    y: 80, rotateX: -35, opacity: 0, transformPerspective: 900, transformOrigin: "50% 100%", duration: 0.9, stagger: 0.1, ease: "power3.out",
    scrollTrigger: { trigger: ".mitos-lista", start: "top 80%", once: true },
    onComplete: () => {
      const primera = $(".mito");
      if (!primera || primera.dataset.tocado) return;
      primera.setAttribute("aria-pressed", "true");
      setTimeout(() => { if (!primera.dataset.tocado) primera.setAttribute("aria-pressed", "false"); }, 1800);
    },
  });
}

/** Cronograma: la línea avanza y cada fecha se enciende. Se rehace al cambiar de pestaña. */
let disparadoresCrono = [];
export function animarCronograma() {
  disparadoresCrono.forEach((t) => t.kill());
  disparadoresCrono = [];
  const lista = $(".crono-panel:not([hidden]) .crono");
  if (!lista) return;
  disparadoresCrono.push(ST().create({ trigger: lista, start: "top 65%", end: "bottom 55%", scrub: true, onUpdate: (st) => lista.style.setProperty("--avance", st.progress.toFixed(3)) }));
  $$("li", lista).forEach((li) => disparadoresCrono.push(ST().create({ trigger: li, start: "top 62%", onEnter: () => li.classList.add("activa"), onLeaveBack: () => li.classList.remove("activa") })));
  ST().refresh();
}

/** Resultados: contador, letras que se cierran, mosaico de caras y casos. */
export function animarResultados() {
  const entrada = { trigger: ".resultados", start: "top 70%", once: true };
  ST().create({ ...entrada, onEnter: () => $$(".resultados .cuenta").forEach(contar) });
  g().from(".res-mas, .res-medicos", { opacity: 0, letterSpacing: "0.4em", duration: 1, ease: "power3.out", scrollTrigger: entrada });
  g().from(".cara", { scale: 0, rotate: () => g().utils.random(-25, 25), duration: 0.55, ease: "back.out(2)", stagger: { each: 0.035, from: "random" }, scrollTrigger: { trigger: ".mosaico", start: "top 85%", once: true } });
  g().from(".caso", { y: 50, opacity: 0, duration: 0.8, stagger: 0.12, ease: "power3.out", scrollTrigger: { trigger: ".casos", start: "top 85%", once: true } });
}

/** Documentos: cada fila se marca con un check que se dibuja. */
export function animarDocumentos() {
  $$(".lista-docs li").forEach((li, i) => {
    const check = $(".visto", li), largo = check.getTotalLength();
    g().set(check, { strokeDasharray: largo, strokeDashoffset: largo });
    ST().create({ trigger: li, start: "top 75%", once: true, onEnter: () => g().delayedCall(i * 0.12, () => {
      li.classList.add("lista");
      g().to(check, { strokeDashoffset: 0, duration: 0.45, delay: 0.1, ease: "power2.out" });
    }) });
  });
}

/** Instagram: se anima el contenedor, nunca las publicaciones (el embed las reemplaza por iframes
    y copia sus estilos en línea; animarlas las dejaba invisibles). */
export function animarInstagram() {
  g().fromTo("#insta-grid", { clipPath: "inset(0 0 100% 0)", y: 40 }, { clipPath: "inset(0 0 0% 0)", y: 0, duration: 1, ease: "power3.out",
    scrollTrigger: { trigger: "#insta-grid", start: "top 88%", once: true }, clearProps: "clipPath,transform" });
}

/** Agenda: el sello se estampa y los botones principales siguen al mouse. */
export function animarAgenda() {
  g().from(".sello svg", { scale: 2.2, rotate: -40, opacity: 0, duration: 0.9, ease: "back.out(1.4)", scrollTrigger: { trigger: ".agenda", start: "top 65%", once: true } });
  if (!punteroFino) return;
  $$(".boton-iman").forEach((b) => {
    b.addEventListener("pointermove", (e) => {
      const r = b.getBoundingClientRect();
      g().to(b, { x: (e.clientX - r.left - r.width / 2) * 0.25, y: (e.clientY - r.top - r.height / 2) * 0.35, duration: 0.3, ease: "power3.out" });
    });
    b.addEventListener("pointerleave", () => g().to(b, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, .45)" }));
  });
}

/** Test de etapa: la tarjeta sube y las opciones de la primera pregunta entran en cascada. */
export function animarTest() {
  const test = $("#test-etapa");
  if (!test) return;
  g().from(test, { y: 60, opacity: 0, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: test, start: "top 85%", once: true }, clearProps: "transform,opacity" });
  g().from($$(".test-pregunta.activa .opcion", test), { x: 30, opacity: 0, stagger: 0.08, duration: 0.6, ease: "power3.out", delay: 0.25,
    scrollTrigger: { trigger: test, start: "top 85%", once: true }, clearProps: "transform,opacity" });
}
