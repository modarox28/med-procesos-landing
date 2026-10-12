// Pestañas del cronograma, accesibles con teclado (flechas izquierda/derecha).
import { $, $$ } from "./entorno.js";

/** @param {{ alCambiar?: () => void }} opciones  se llama después de mostrar otro panel */
export function iniciarPestanas({ alCambiar = () => {} } = {}) {
  const pestanas = $$(".pestana");
  const elegir = (pestana, conFoco) => {
    pestanas.forEach((p) => {
      const seleccionada = p === pestana;
      p.setAttribute("aria-selected", String(seleccionada));
      p.tabIndex = seleccionada ? 0 : -1;
      $("#" + p.getAttribute("aria-controls")).hidden = !seleccionada;
    });
    if (conFoco) pestana.focus();
    alCambiar();
  };
  pestanas.forEach((p, i) => {
    p.addEventListener("click", () => elegir(p));
    p.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      e.preventDefault();
      const paso = e.key === "ArrowRight" ? 1 : pestanas.length - 1;
      elegir(pestanas[(i + paso) % pestanas.length], true);
    });
  });
}
