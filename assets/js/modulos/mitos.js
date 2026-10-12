// Mito o realidad: cada tarjeta es un botón que alterna aria-pressed (el CSS hace el giro 3D).
import { $$ } from "./entorno.js";

export function iniciarMitos() {
  $$(".mito").forEach((tarjeta) =>
    tarjeta.addEventListener("click", () => {
      tarjeta.dataset.tocado = "1"; // así la demostración automática no la vuelve a girar
      tarjeta.setAttribute("aria-pressed", tarjeta.getAttribute("aria-pressed") === "true" ? "false" : "true");
    })
  );
}
