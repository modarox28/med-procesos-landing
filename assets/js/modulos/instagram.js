// Publicaciones de Instagram con el embed oficial.
// Las publicaciones están en el HTML (#insta-grid) como <blockquote class="instagram-media">.
// El script de Instagram se carga solo cuando el visitante se acerca a la sección.
// Si no carga (sin internet o con bloqueador), queda la tarjeta de color con el enlace al post.
import { $ } from "./entorno.js";

export function iniciarInstagram() {
  const grilla = $("#insta-grid");
  if (!grilla || !$(".instagram-media", grilla)) return;
  const observador = new IntersectionObserver((entradas) => {
    if (!entradas[0].isIntersecting) return;
    observador.disconnect();
    const script = document.createElement("script");
    script.src = "https://www.instagram.com/embed.js";
    script.async = true;
    script.onload = () => window.instgrm?.Embeds.process();
    document.body.appendChild(script);
  }, { rootMargin: "600px" });
  observador.observe(grilla);
}
