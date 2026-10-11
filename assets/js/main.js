/* Med Procesos · landing (concepto de portafolio)
   Interacciones y animaciones: GSAP + ScrollTrigger + Lenis (copiados en assets/vendor). */
(() => {
  "use strict";

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reducido = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const punteroFino = matchMedia("(hover: hover) and (pointer: fine)").matches;

  // Al recargar, siempre al inicio (salvo que se llegue con un #enlace)
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  const nav0 = performance.getEntriesByType("navigation")[0];
  if (!location.hash || (nav0 && nav0.type === "reload")) {
    if (location.hash) history.replaceState(null, "", location.pathname + location.search);
    window.scrollTo(0, 0);
  }

  const hayGSAP = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
  if (hayGSAP) gsap.registerPlugin(ScrollTrigger);

  // ── Scroll suave solo con mouse/trackpad (en celular, scroll nativo) ──
  let lenis = null;
  if (hayGSAP && !reducido && punteroFino && typeof window.Lenis !== "undefined") {
    lenis = new Lenis({ lerp: 0.11 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const irA = (destino) => {
    if (lenis) lenis.scrollTo(destino, { offset: -8, duration: 1.2 });
    else destino.scrollIntoView({ behavior: reducido ? "auto" : "smooth" });
  };
  $$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
    const id = a.getAttribute("href");
    const destino = id.length > 1 && $(id);
    if (!destino) return;
    e.preventDefault();
    cerrarMenu();
    irA(destino);
    if (id !== "#inicio") destino.setAttribute("tabindex", "-1"), destino.focus({ preventScroll: true });
  }));

  // ── Navegación ──
  const nav = $("#nav");
  const boton = $(".nav-boton");
  const menu = $("#menu");
  let ultimoY = 0;
  const alDesplazar = () => {
    const y = window.scrollY;
    nav.classList.toggle("con-fondo", y > 20);
    const abierto = boton.getAttribute("aria-expanded") === "true";
    nav.classList.toggle("oculta", !abierto && y > 400 && y > ultimoY + 4);
    if (y < ultimoY - 4 || y < 400) nav.classList.remove("oculta");
    ultimoY = y;
  };
  addEventListener("scroll", alDesplazar, { passive: true });
  alDesplazar();

  function abrirMenu() {
    boton.setAttribute("aria-expanded", "true");
    boton.setAttribute("aria-label", "Cerrar menú");
    menu.classList.add("abierto");
    document.documentElement.style.overflow = "hidden";
    if (lenis) lenis.stop();
    if (hayGSAP && !reducido) gsap.fromTo($$("a", menu), { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5, stagger: 0.05, delay: 0.15, ease: "power3.out" });
    setTimeout(() => $("a", menu).focus(), 200);
  }
  function cerrarMenu() {
    if (boton.getAttribute("aria-expanded") !== "true") return;
    boton.setAttribute("aria-expanded", "false");
    boton.setAttribute("aria-label", "Abrir menú");
    menu.classList.remove("abierto");
    document.documentElement.style.overflow = "";
    if (lenis) lenis.start();
  }
  boton.addEventListener("click", () => (boton.getAttribute("aria-expanded") === "true" ? cerrarMenu() : abrirMenu()));
  addEventListener("keydown", (e) => { if (e.key === "Escape" && boton.getAttribute("aria-expanded") === "true") { cerrarMenu(); boton.focus(); } });
  matchMedia("(min-width: 901px)").addEventListener("change", (e) => { if (e.matches) cerrarMenu(); });

  // ── Mito o realidad: voltear ──
  $$(".mito").forEach((m) => m.addEventListener("click", () => {
    m.setAttribute("aria-pressed", m.getAttribute("aria-pressed") === "true" ? "false" : "true");
  }));

  // ── Pestañas del cronograma (con flechas del teclado) ──
  const pestanas = $$(".pestana");
  const elegir = (p, foco) => {
    pestanas.forEach((x) => {
      const sel = x === p;
      x.setAttribute("aria-selected", String(sel));
      x.tabIndex = sel ? 0 : -1;
      $("#" + x.getAttribute("aria-controls")).hidden = !sel;
    });
    if (foco) p.focus();
    if (hayGSAP) ScrollTrigger.refresh();
    animarCrono();
  };
  pestanas.forEach((p, i) => {
    p.addEventListener("click", () => elegir(p));
    p.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        elegir(pestanas[(i + (e.key === "ArrowRight" ? 1 : pestanas.length - 1)) % pestanas.length], true);
      }
    });
  });

  // ── Preguntas: abrir/cerrar con altura animada ──
  $$(".faq-item").forEach((d) => {
    const sum = $("summary", d), r = $(".faq-r", d);
    sum.addEventListener("click", (e) => {
      if (!hayGSAP || reducido) return;
      e.preventDefault();
      if (d.open) {
        gsap.to(r, { height: 0, duration: 0.35, ease: "power2.inOut", onComplete: () => { d.open = false; r.style.height = ""; } });
      } else {
        d.open = true;
        gsap.fromTo(r, { height: 0 }, { height: r.scrollHeight, duration: 0.45, ease: "power3.out", onComplete: () => (r.style.height = "") });
      }
    });
  });

  // ── Instagram: embed oficial, cargado solo al acercarse a la sección ──
  // Las publicaciones están en el HTML (#insta-grid) como <blockquote class="instagram-media">.
  // Si Instagram no carga (sin internet o bloqueador), queda la tarjeta con el enlace a cada post.
  const gridInsta = $("#insta-grid");
  if (gridInsta && $(".instagram-media", gridInsta)) {
    new IntersectionObserver((ents, o) => {
      if (!ents[0].isIntersecting) return;
      o.disconnect();
      const s = document.createElement("script");
      s.src = "https://www.instagram.com/embed.js";
      s.async = true;
      s.onload = () => { if (window.instgrm) window.instgrm.Embeds.process(); };
      document.body.appendChild(s);
    }, { rootMargin: "600px" }).observe(gridInsta);
  }

  // ── Contadores ──
  function contar(el) {
    const hasta = +el.dataset.hasta, pre = el.dataset.prefijo || "";
    if (!hayGSAP || reducido) { el.textContent = pre + hasta; return; }
    const o = { v: 0 };
    gsap.to(o, { v: hasta, duration: 1.8, ease: "power3.out", onUpdate: () => (el.textContent = pre + Math.round(o.v)) });
  }

  // ── Línea de tiempo del cronograma ──
  let animarCrono = () => {};

  // Sin GSAP o con movimiento reducido: todo visible y en su estado final
  if (!hayGSAP || reducido) {
    $$(".resalta").forEach((m) => m.classList.add("pintado"));
    $$(".etapa, .crono li, .parada").forEach((e) => e.classList.add("activa"));
    $$(".lista-docs li").forEach((e) => e.classList.add("lista"));
    $$(".crono, .etapas").forEach((e) => e.style.setProperty("--avance", 1));
    $$(".cuenta").forEach((c) => (c.textContent = (c.dataset.prefijo || "") + c.dataset.hasta));
    const ruta = $("#ruta"), avion = $("#avion");
    if (ruta && avion) {
      const L = ruta.getTotalLength(), p = ruta.getPointAtLength(L), q = ruta.getPointAtLength(L - 2);
      avion.setAttribute("transform", `translate(${p.x} ${p.y}) rotate(${Math.atan2(p.y - q.y, p.x - q.x) * 57.3 + 90})`);
    }
    return;
  }

  // ════════════════ ANIMACIONES ════════════════

  // A. El logo se traza al cargar
  $$(".nav .trazo").forEach((t, i) => {
    const L = t.getTotalLength();
    gsap.fromTo(t, { strokeDasharray: L, strokeDashoffset: L }, { strokeDashoffset: 0, duration: 0.7, delay: 0.15 + i * 0.16, ease: "power2.inOut" });
  });
  gsap.from(".nav .marca-txt small", { letterSpacing: "0em", opacity: 0, duration: 1.2, delay: 0.6, ease: "power3.out" });
  gsap.from(".nav .marca-txt b", { yPercent: 60, opacity: 0, duration: 0.6, delay: 0.4, ease: "power3.out" });

  // B. Hero: líneas que suben tras una máscara y frases que se pintan
  const hero = gsap.timeline({ defaults: { ease: "power4.out" } });
  hero.from(".hero-titulo .linea > span", { yPercent: 110, duration: 1, stagger: 0.09 }, 0.2)
      .from(".hero .etiqueta", { y: 16, opacity: 0, duration: 0.6 }, 0.1)
      .add(() => $$(".hero .resalta").forEach((m, i) => setTimeout(() => m.classList.add("pintado"), i * 260)), 0.85)
      .from(".hero-sub, .hero-botones, .hero-datos", { y: 22, opacity: 0, duration: 0.8, stagger: 0.1 }, 0.7)
      .add(() => $$(".hero .cuenta").forEach(contar), 1.1);

  // C. Mapa: países que aparecen y avión que recorre la ruta parando en cada etapa
  const ruta = $("#ruta"), avion = $("#avion");
  if (ruta && avion) {
    const L = ruta.getTotalLength();
    const paradas = $$(".parada").map((g) => {
      const p = +g.dataset.p, pt = ruta.getPointAtLength(L * p);
      g.setAttribute("transform", `translate(${pt.x} ${pt.y})`);
      return { g, p };
    });
    const colocar = (p) => {
      const a = ruta.getPointAtLength(L * p), b = ruta.getPointAtLength(Math.min(L, L * p + 1.5));
      const ang = Math.atan2(b.y - a.y, b.x - a.x) * 57.2958 + 90;
      avion.setAttribute("transform", `translate(${a.x} ${a.y}) rotate(${ang}) scale(1.05)`);
      ruta.style.strokeDashoffset = L * (1 - p);
      paradas.forEach((x) => x.g.classList.toggle("activa", p >= x.p - 0.005));
    };
    ruta.style.strokeDasharray = L;
    colocar(0);
    const o = { p: 0 };
    // En celular el mapa queda debajo del texto: su animación empieza cuando se ve
    const mapaTl = gsap.timeline({ scrollTrigger: { trigger: ".hero-mapa", start: "top 88%", once: true } });
    mapaTl.from(".mapa-vecinos path", { opacity: 0, duration: 0.8, stagger: { each: 0.03, from: "random" } }, 0)
        .from(".pais", { scale: 0.6, opacity: 0, transformOrigin: "50% 50%", duration: 1, ease: "back.out(1.6)", stagger: 0.25 }, 0.25)
        .from(".ciudad", { scale: 0, transformOrigin: "50% 50%", duration: 0.5, ease: "back.out(2)", stagger: 0.4 }, 0.7)
        .from(".parada text", { opacity: 0, x: -6, duration: 0.4, stagger: 0.5 }, 1.4)
        .to(o, { p: 1, duration: 2.6, ease: "power2.inOut", onUpdate: () => colocar(o.p) }, 0.9);
    gsap.to(".hero-mapa", { yPercent: -12, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  }

  // D. Frases resaltadas que se pintan al llegar
  $$(".resalta").filter((m) => !m.closest(".hero")).forEach((m) => {
    ScrollTrigger.create({ trigger: m, start: "top 82%", once: true, onEnter: () => m.classList.add("pintado") });
  });

  // Títulos y entradas: suben tras una máscara de recorte (no un simple fundido)
  $$(".seccion .titulo, .camino .titulo, .agenda .titulo, .seccion .entrada, .camino .entrada, .agenda .entrada").forEach((el) => {
    gsap.fromTo(el, { clipPath: "inset(0 0 100% 0)", y: 24 }, { clipPath: "inset(0 0 0% 0)", y: 0, duration: 0.9, ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 88%", once: true }, clearProps: "clipPath" });
  });
  $$(".etiqueta").filter((e) => !e.closest(".hero")).forEach((el) => {
    gsap.from(el, { scaleX: 0, transformOrigin: "left center", duration: 0.6, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 90%", once: true } });
  });

  // E. Riesgos: se descubren como si se pasara la página
  gsap.from(".riesgos li", { clipPath: "inset(0 100% 0 0)", duration: 1, ease: "power3.inOut", stagger: 0.18,
    scrollTrigger: { trigger: ".riesgos", start: "top 80%", once: true }, clearProps: "clipPath" });

  const mm = gsap.matchMedia();

  // F. El camino
  mm.add("(min-width: 901px)", () => {
    const etapas = $(".etapas"), lista = $$(".etapa");
    const distancia = () => Math.max(0, etapas.scrollWidth - innerWidth + 40);
    const barra = $(".camino-barra"), av = $(".camino-avion"), prog = $(".camino-progreso");
    const t = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: ".camino", start: "top top", end: () => "+=" + (distancia() + innerHeight * 0.6),
        pin: ".camino-fijo", scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1,
        onUpdate: (st) => lista.forEach((e, i) => e.classList.toggle("activa", st.progress >= i / lista.length - 0.02)),
      },
    });
    t.to(etapas, { x: () => -distancia() }, 0)
     .to(barra, { scaleX: 1 }, 0)
     .to(av, { x: () => prog.offsetWidth - 20 }, 0);
    gsap.from(lista, { y: 60, rotate: 2, opacity: 0, duration: 0.8, stagger: 0.1, ease: "power3.out", scrollTrigger: { trigger: ".camino", start: "top 70%", once: true } });
  });
  mm.add("(max-width: 900px)", () => {
    const etapas = $(".etapas");
    ScrollTrigger.create({ trigger: etapas, start: "top 70%", end: "bottom 60%", scrub: true,
      onUpdate: (st) => etapas.style.setProperty("--avance", st.progress.toFixed(3)) });
    $$(".etapa").forEach((e) => ScrollTrigger.create({ trigger: e, start: "top 65%", onEnter: () => e.classList.add("activa"), onLeaveBack: () => e.classList.remove("activa") }));
    gsap.utils.toArray(".etapa").forEach((e) => gsap.from(e, { x: 40, opacity: 0, duration: 0.7, ease: "power3.out", scrollTrigger: { trigger: e, start: "top 88%", once: true } }));
  });

  // G. Servicios: una baraja que se abre en abanico hasta formar la cuadrícula
  mm.add("(min-width: 1025px)", () => {
    const baraja = $(".baraja"), cartas = $$(".carta", baraja);
    const caja = baraja.getBoundingClientRect();
    gsap.from(cartas, {
      x: (i, el) => { const r = el.getBoundingClientRect(); return caja.left + caja.width / 2 - (r.left + r.width / 2); },
      y: (i, el) => { const r = el.getBoundingClientRect(); return caja.top + caja.height / 2 - (r.top + r.height / 2) + 40; },
      rotate: (i) => (i - cartas.length / 2) * 4,
      scale: 0.9,
      ease: "power2.out",
      stagger: 0.03,
      scrollTrigger: { trigger: baraja, start: "top 85%", end: "top 30%", scrub: 0.9 },
    });
  });
  mm.add("(max-width: 1024px)", () => {
    gsap.from(".carta", { y: 40, opacity: 0, duration: 0.6, stagger: 0.07, ease: "power3.out", scrollTrigger: { trigger: ".baraja", start: "top 85%", once: true } });
  });

  // H. Mito o realidad: las tarjetas se reparten y la primera se voltea como demostración
  gsap.from(".mitos-titulo", { yPercent: 40, opacity: 0, duration: 1, ease: "power4.out", scrollTrigger: { trigger: ".mitos", start: "top 75%", once: true } });
  gsap.from(".mito", { y: 80, rotateX: -35, opacity: 0, transformPerspective: 900, transformOrigin: "50% 100%", duration: 0.9, stagger: 0.1, ease: "power3.out",
    scrollTrigger: { trigger: ".mitos-lista", start: "top 80%", once: true },
    onComplete: () => {
      const m = $(".mito");
      if (!m || m.dataset.tocado) return;
      m.setAttribute("aria-pressed", "true");
      setTimeout(() => { if (!m.dataset.tocado) m.setAttribute("aria-pressed", "false"); }, 1800);
    } });
  $$(".mito").forEach((m) => m.addEventListener("click", () => (m.dataset.tocado = "1")));

  // I. Cronograma: la línea avanza y cada fecha se enciende
  let triggersCrono = [];
  animarCrono = () => {
    triggersCrono.forEach((t) => t.kill());
    triggersCrono = [];
    const panel = $(".crono-panel:not([hidden]) .crono");
    if (!panel) return;
    triggersCrono.push(ScrollTrigger.create({ trigger: panel, start: "top 65%", end: "bottom 55%", scrub: true,
      onUpdate: (st) => panel.style.setProperty("--avance", st.progress.toFixed(3)) }));
    $$("li", panel).forEach((li) => triggersCrono.push(ScrollTrigger.create({ trigger: li, start: "top 62%",
      onEnter: () => li.classList.add("activa"), onLeaveBack: () => li.classList.remove("activa") })));
    ScrollTrigger.refresh();
  };
  animarCrono();

  // J. Resultados: número gigante, mosaico de caras y casos
  ScrollTrigger.create({ trigger: ".resultados", start: "top 70%", once: true, onEnter: () => $$(".resultados .cuenta").forEach(contar) });
  gsap.from(".res-mas, .res-medicos", { opacity: 0, letterSpacing: "0.4em", duration: 1, ease: "power3.out", scrollTrigger: { trigger: ".resultados", start: "top 70%", once: true } });
  gsap.from(".cara", { scale: 0, rotate: () => gsap.utils.random(-25, 25), duration: 0.55, ease: "back.out(2)", stagger: { each: 0.035, from: "random" },
    scrollTrigger: { trigger: ".mosaico", start: "top 85%", once: true } });
  gsap.from(".caso", { y: 50, opacity: 0, duration: 0.8, stagger: 0.12, ease: "power3.out", scrollTrigger: { trigger: ".casos", start: "top 85%", once: true } });

  // K. Documentos: la lista se marca sola
  $$(".lista-docs li").forEach((li, i) => {
    const v = $(".visto", li), L = v.getTotalLength();
    gsap.set(v, { strokeDasharray: L, strokeDashoffset: L });
    ScrollTrigger.create({ trigger: li, start: "top 75%", once: true, onEnter: () => {
      gsap.delayedCall(i * 0.12, () => { li.classList.add("lista"); gsap.to(v, { strokeDashoffset: 0, duration: 0.45, delay: 0.1, ease: "power2.out" }); });
    } });
  });

  // L. Instagram: las tarjetas caen como fotos sobre la mesa
  // Se anima el contenedor y no cada publicación: el embed de Instagram reemplaza los blockquote
  // por iframes y copia sus estilos en línea, así que animar los hijos los dejaba invisibles.
  gsap.fromTo("#insta-grid", { clipPath: "inset(0 0 100% 0)", y: 40 }, { clipPath: "inset(0 0 0% 0)", y: 0, duration: 1, ease: "power3.out",
    scrollTrigger: { trigger: "#insta-grid", start: "top 88%", once: true }, clearProps: "clipPath,transform" });

  // M. Agenda: el sello se estampa
  gsap.from(".sello svg", { scale: 2.2, rotate: -40, opacity: 0, duration: 0.9, ease: "back.out(1.4)", scrollTrigger: { trigger: ".agenda", start: "top 65%", once: true } });

  // N. Botones magnéticos (solo con mouse)
  if (punteroFino) {
    $$(".boton-iman").forEach((b) => {
      b.addEventListener("pointermove", (e) => {
        const r = b.getBoundingClientRect();
        gsap.to(b, { x: (e.clientX - r.left - r.width / 2) * 0.25, y: (e.clientY - r.top - r.height / 2) * 0.35, duration: 0.3, ease: "power3.out" });
      });
      b.addEventListener("pointerleave", () => gsap.to(b, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, .45)" }));
    });
  }

  // Recalcular cuando cargan las fuentes (cambian alturas)
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
})();
