// Sin GSAP o con "reducir movimiento": deja todo en su estado final, sin animar.
import { $, $$ } from "../modulos/entorno.js";

export function mostrarEstadoFinal() {
  $$(".resalta").forEach((m) => m.classList.add("pintado"));
  $$(".etapa, .crono li, .parada").forEach((e) => e.classList.add("activa"));
  $$(".lista-docs li").forEach((e) => e.classList.add("lista"));
  $$(".crono, .etapas").forEach((e) => e.style.setProperty("--avance", 1));
  $$(".cuenta").forEach((c) => (c.textContent = (c.dataset.prefijo || "") + c.dataset.hasta));

  // Paradas del mapa en su lugar y avión en Buenos Aires
  const ruta = $("#ruta"), avion = $("#avion");
  if (!ruta || !avion) return;
  const largo = ruta.getTotalLength();
  $$(".parada").forEach((g) => {
    const p = ruta.getPointAtLength(largo * Number(g.dataset.p));
    g.setAttribute("transform", `translate(${p.x} ${p.y})`);
  });
  const fin = ruta.getPointAtLength(largo), antes = ruta.getPointAtLength(largo - 2);
  const angulo = Math.atan2(fin.y - antes.y, fin.x - antes.x) * 57.2958 + 90;
  avion.setAttribute("transform", `translate(${fin.x} ${fin.y}) rotate(${angulo})`);
}
