// Animaciones de entrada: logo que se traza, título del hero y mapa con el avión.
import { $, $$ } from "../modulos/entorno.js?v=16";
import { contar } from "../modulos/contadores.js?v=16";

export function animarLogo() {
  const { gsap } = window;
  $$(".nav .trazo").forEach((trazo, i) => {
    const largo = trazo.getTotalLength();
    gsap.fromTo(trazo, { strokeDasharray: largo, strokeDashoffset: largo }, { strokeDashoffset: 0, duration: 0.7, delay: 0.15 + i * 0.16, ease: "power2.inOut" });
  });
  gsap.from(".nav .marca-txt b", { yPercent: 60, opacity: 0, duration: 0.6, delay: 0.4, ease: "power3.out" });
  gsap.from(".nav .marca-txt small", { letterSpacing: "0em", opacity: 0, duration: 1.2, delay: 0.6, ease: "power3.out" });
}

export function animarHero() {
  const { gsap } = window;
  // Las líneas del título suben detrás de una máscara y luego se pintan las frases resaltadas
  gsap.timeline({ defaults: { ease: "power4.out" } })
    .from(".hero .etiqueta", { y: 16, opacity: 0, duration: 0.6 }, 0.1)
    .from(".hero-titulo .linea > span", { yPercent: 110, duration: 1, stagger: 0.09 }, 0.2)
    .add(() => $$(".hero .resalta").forEach((m, i) => setTimeout(() => m.classList.add("pintado"), i * 260)), 0.85)
    .from(".hero-sub, .hero-botones, .hero-datos", { y: 22, opacity: 0, duration: 0.8, stagger: 0.1 }, 0.7)
    .add(() => $$(".hero .cuenta").forEach(contar), 1.1);
}

export function animarMapa() {
  const { gsap } = window;
  const ruta = $("#ruta"), avion = $("#avion");
  if (!ruta || !avion) return;

  const largo = ruta.getTotalLength();
  const paradas = $$(".parada").map((g) => {
    const p = Number(g.dataset.p), punto = ruta.getPointAtLength(largo * p);
    g.setAttribute("transform", `translate(${punto.x} ${punto.y})`);
    return { g, p };
  });

  // Coloca el avión en el punto p (0 a 1) de la ruta, orientado hacia donde va
  const colocar = (p) => {
    const a = ruta.getPointAtLength(largo * p);
    const b = ruta.getPointAtLength(Math.min(largo, largo * p + 1.5));
    const angulo = Math.atan2(b.y - a.y, b.x - a.x) * 57.2958 + 90;
    avion.setAttribute("transform", `translate(${a.x} ${a.y}) rotate(${angulo}) scale(1.05)`);
    ruta.style.strokeDashoffset = largo * (1 - p);
    paradas.forEach((x) => x.g.classList.toggle("activa", p >= x.p - 0.005));
  };
  ruta.style.strokeDasharray = largo;
  colocar(0);

  // En celular el mapa queda debajo del texto: la animación empieza cuando se ve
  const avance = { p: 0 };
  gsap.timeline({ scrollTrigger: { trigger: ".hero-mapa", start: "top 88%", once: true } })
    .from(".mapa-vecinos path", { opacity: 0, duration: 0.8, stagger: { each: 0.03, from: "random" } }, 0)
    .from(".pais", { scale: 0.6, opacity: 0, transformOrigin: "50% 50%", duration: 1, ease: "back.out(1.6)", stagger: 0.25 }, 0.25)
    .from(".ciudad", { scale: 0, transformOrigin: "50% 50%", duration: 0.5, ease: "back.out(2)", stagger: 0.4 }, 0.7)
    .from(".parada text", { opacity: 0, x: -6, duration: 0.4, stagger: 0.5 }, 1.4)
    .to(avance, { p: 1, duration: 2.6, ease: "power2.inOut", onUpdate: () => colocar(avance.p) }, 0.9);

  // Paralaje suave del mapa al bajar
  gsap.to(".hero-mapa", { yPercent: -12, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
}
