/* ═══════════════════════════════════════════
   MAIN.JS — Med Procesos Landing
   Fase 3: GSAP + ScrollTrigger + Lenis
═══════════════════════════════════════════ */

gsap.registerPlugin(ScrollTrigger);

/* ─── Lenis smooth scroll integrado con GSAP ─── */
const lenis = new Lenis({ lerp: 0.1, duration: 1.2 });
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add(time => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

/* ─── Nav: scroll class ─── */
const navWrap    = document.querySelector('.nav-wrap');
const navToggle  = document.querySelector('.nav-toggle');
const navLinksList = document.querySelector('.nav-links');

window.addEventListener('scroll', () => {
  navWrap.classList.toggle('scrolled', window.scrollY > 24);
}, { passive: true });

/* ─── Nav toggle móvil ─── */
navToggle.addEventListener('click', () => {
  const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
  navToggle.setAttribute('aria-expanded', String(!isOpen));
  navLinksList.classList.toggle('open', !isOpen);
});
navLinksList.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    navToggle.setAttribute('aria-expanded', 'false');
    navLinksList.classList.remove('open');
  });
});

/* ─── Tabs cronograma ─── */
document.querySelectorAll('.crono-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const panelId = tab.getAttribute('aria-controls');
    const panel   = document.getElementById(panelId);
    document.querySelectorAll('.crono-tab').forEach(t => {
      t.classList.remove('active');
      t.setAttribute('aria-selected', 'false');
    });
    document.querySelectorAll('.crono-panel').forEach(p => p.classList.add('hidden'));
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');
    panel.classList.remove('hidden');
  });
});

/* ─── Mito/Realidad flip cards ─── */
document.querySelectorAll('.mito-card').forEach(card => {
  const front = card.querySelector('.mito-front');
  const back  = card.querySelector('.mito-back');
  function flip(state) {
    card.classList.toggle('flipped', state);
    front.setAttribute('aria-hidden', String(state));
    back.setAttribute('aria-hidden',  String(!state));
  }
  card.addEventListener('click',  () => flip(!card.classList.contains('flipped')));
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(!card.classList.contains('flipped')); }
  });
});

/* ═══════════════════════════════════════════
   GSAP — sólo si el usuario no prefiere
   movimiento reducido
═══════════════════════════════════════════ */
const motionOK = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!motionOK) {
  document.querySelectorAll('.highlight-bar').forEach(b => b.classList.add('visible'));
} else {

/* ─── A. Logo draw al cargar ─── */
{
  const logoLines = document.querySelectorAll('.nav-logo .logo-line');
  logoLines.forEach(line => {
    const len = line.getTotalLength ? line.getTotalLength() : 28;
    gsap.set(line, { strokeDasharray: len, strokeDashoffset: len });
  });
  gsap.to('.nav-logo .logo-line', {
    strokeDashoffset: 0,
    duration: 0.7,
    stagger: 0.07,
    ease: 'power2.out',
    delay: 0.2
  });
}

/* ─── B. Hero fade-in escalonado ─── */
const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
heroTl
  .from('.hero-badge',       { opacity: 0, y: 18, duration: 0.6 }, 0.3)
  .from('.hero-content h1',  { opacity: 0, y: 30, duration: 0.75 }, 0.45)
  .from('.hero-sub',         { opacity: 0, y: 20, duration: 0.65 }, 0.6)
  .from('.hero-actions',     { opacity: 0, y: 18, duration: 0.6  }, 0.75)
  .from('.hero-trust',       { opacity: 0, y: 14, duration: 0.55 }, 0.88)
  .from('.hero-illustration',{ opacity: 0, scale: 0.92, duration: 0.9, ease: 'power2.out' }, 0.4);

/* ─── C. Ruta del mapa + avión ─── */
{
  const routePath = document.querySelector('.route-path');
  const plane     = document.querySelector('.plane');
  if (routePath && plane) {
    const pathLen = routePath.getTotalLength();
    gsap.set(routePath, { strokeDasharray: pathLen, strokeDashoffset: pathLen });
    const prog = { p: 0 };

    gsap.to(prog, {
      p: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom center',
        scrub: 2
      },
      onUpdate() {
        const t      = pathLen * prog.p;
        const pt     = routePath.getPointAtLength(t);
        const ptNext = routePath.getPointAtLength(Math.min(pathLen, t + 6));
        const angle  = Math.atan2(ptNext.y - pt.y, ptNext.x - pt.x) * (180 / Math.PI);
        gsap.set(routePath, { strokeDashoffset: pathLen * (1 - prog.p) });
        gsap.set(plane, { x: pt.x - 114, y: pt.y - 78, rotation: angle + 90 });
      }
    });
  }
}

/* ─── D. Parallax hero illustration ─── */
gsap.to('.hero-illustration', {
  y: -70,
  ease: 'none',
  scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
});

/* ─── E. Highlight bars por ScrollTrigger ─── */
document.querySelectorAll('.highlight-bar').forEach(bar => {
  gsap.fromTo(bar,
    { scaleX: 0, transformOrigin: 'left' },
    {
      scaleX: 1,
      duration: 0.7,
      ease: 'power3.out',
      scrollTrigger: { trigger: bar, start: 'top 88%' }
    }
  );
});

/* ─── F. Fade-up escalonado por grupo ─── */
function fadeUpGroup(selector, delay = 0.09) {
  const all = gsap.utils.toArray(selector);
  if (!all.length) return;
  const sections = [...new Set(all.map(el => el.closest('section, .container') || document.body))];
  sections.forEach(sec => {
    const group = all.filter(el => sec.contains(el));
    if (!group.length) return;
    gsap.fromTo(group,
      { opacity: 0, y: 36 },
      {
        opacity: 1, y: 0,
        duration: 0.65,
        ease: 'power3.out',
        stagger: delay,
        scrollTrigger: { trigger: group[0], start: 'top 88%' }
      }
    );
  });
}
fadeUpGroup('.solo-card');
fadeUpGroup('.servicio-card', 0.07);
fadeUpGroup('.etapa', 0.1);
fadeUpGroup('.mito-card', 0.08);
fadeUpGroup('.caso-card', 0.1);
fadeUpGroup('.doc-item', 0.1);

/* ─── G. Títulos de sección ─── */
gsap.utils.toArray('.section-title, .section-sub, .section-label').forEach(el => {
  gsap.fromTo(el,
    { opacity: 0, y: 22 },
    { opacity: 1, y: 0, duration: 0.65, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 90%' } }
  );
});

/* ─── H. Counter ─── */
{
  const counterEl = document.querySelector('.counter-grande');
  if (counterEl) {
    const target = parseInt(counterEl.dataset.target, 10);
    const obj    = { val: 0 };
    gsap.to(obj, {
      val: target,
      duration: 2,
      ease: 'power2.out',
      snap: { val: 1 },
      onUpdate: () => { counterEl.textContent = Math.round(obj.val); },
      scrollTrigger: { trigger: counterEl, start: 'top 80%' }
    });
  }
}

/* ─── I. Checklist draw (SVG stroke-dashoffset) ─── */
document.querySelectorAll('.check-path').forEach((path, i) => {
  const len = path.getTotalLength ? path.getTotalLength() : 20;
  gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
  gsap.to(path, {
    strokeDashoffset: 0,
    duration: 0.55,
    ease: 'power2.out',
    delay: i * 0.18,
    scrollTrigger: { trigger: path.closest('.doc-item'), start: 'top 85%' }
  });
});

/* ─── J. Siluetas mosaico ─── */
gsap.fromTo('.silueta',
  { opacity: 0, scale: 0.5 },
  {
    opacity: 1, scale: 1,
    duration: 0.4,
    ease: 'back.out(1.5)',
    stagger: { each: 0.04, from: 'random' },
    scrollTrigger: { trigger: '.mosaico-grid', start: 'top 82%' }
  }
);

/* ─── K. Cronograma items ─── */
gsap.utils.toArray('.crono-item').forEach((item, i) => {
  gsap.fromTo(item,
    { opacity: 0, x: -20 },
    {
      opacity: 1, x: 0,
      duration: 0.5,
      ease: 'power3.out',
      delay: i * 0.08,
      scrollTrigger: { trigger: item, start: 'top 90%' }
    }
  );
});

/* ─── L. Agenda CTA entrance ─── */
gsap.fromTo('.agenda-content > *',
  { opacity: 0, y: 28 },
  {
    opacity: 1, y: 0,
    duration: 0.65,
    ease: 'power3.out',
    stagger: 0.1,
    scrollTrigger: { trigger: '.agenda-content', start: 'top 80%' }
  }
);

/* ─── M. Botón magnético ─── */
document.querySelectorAll('.btn-magnetic').forEach(btn => {
  btn.addEventListener('mousemove', e => {
    const r  = btn.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width  / 2)) * 0.22;
    const dy = (e.clientY - (r.top  + r.height / 2)) * 0.22;
    gsap.to(btn, { x: dx, y: dy, duration: 0.25, ease: 'power3.out' });
  });
  btn.addEventListener('mouseleave', () => {
    gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.45)' });
  });
});

} // fin else motionOK
