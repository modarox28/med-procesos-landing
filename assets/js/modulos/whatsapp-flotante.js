// Botón flotante de WhatsApp: aparece después del hero y se esconde cuando ya se ve la sección de agenda
// (que tiene sus propios botones) o cuando el menú del celular está abierto.
import { $ } from "./entorno.js?v=16";

export function iniciarWhatsappFlotante() {
  const boton = $(".wa-flotante");
  const hero = $(".hero");
  const agenda = $("#agenda");
  if (!boton || !hero || !agenda || !("IntersectionObserver" in window)) return;

  let pasoHero = false;
  let veAgenda = false;
  const actualizar = () => boton.classList.toggle("visible", pasoHero && !veAgenda);

  new IntersectionObserver(([e]) => { pasoHero = !e.isIntersecting && e.boundingClientRect.top < 0; actualizar(); }).observe(hero);
  new IntersectionObserver(([e]) => { veAgenda = e.isIntersecting; actualizar(); }, { rootMargin: "0px 0px -20% 0px" }).observe(agenda);
}
