// Punto de entrada. Orden: interacciones (funcionan siempre) y luego animaciones (si corresponde).
// GSAP, ScrollTrigger y Lenis se cargan antes como scripts clásicos desde assets/vendor.
// Todas las importaciones llevan ?v=N (igual que en index.html) para que el navegador no mezcle
// archivos nuevos con versiones viejas guardadas en caché.
import { animar, hayGSAP } from "./modulos/entorno.js?v=16";
import { iniciarScroll } from "./modulos/scroll.js?v=16";
import { iniciarNavegacion, cerrarMenu } from "./modulos/navegacion.js?v=16";
import { iniciarMitos } from "./modulos/mitos.js?v=16";
import { iniciarPestanas } from "./modulos/cronograma.js?v=16";
import { iniciarPreguntas } from "./modulos/preguntas.js?v=16";
import { iniciarTestEtapa } from "./modulos/etapa.js?v=16";
import { iniciarWhatsappFlotante } from "./modulos/whatsapp-flotante.js?v=16";
import { iniciarInstagram } from "./modulos/instagram.js?v=16";
import { mostrarEstadoFinal } from "./animaciones/estado-final.js?v=16";
import { animarLogo, animarHero, animarMapa } from "./animaciones/hero.js?v=16";
import * as secciones from "./animaciones/secciones.js?v=16";

if (hayGSAP) window.gsap.registerPlugin(window.ScrollTrigger);

// 1. Interacciones
iniciarScroll({ antesDeNavegar: cerrarMenu });
iniciarNavegacion();
iniciarMitos();
iniciarPestanas({ alCambiar: () => animar && secciones.animarCronograma() });
iniciarPreguntas();
iniciarTestEtapa();
iniciarWhatsappFlotante();
iniciarInstagram();

// 2. Animaciones
// Cada una va aislada: si una falla, las demás siguen funcionando (y el error queda en la consola).
const seguro = (nombre, fn) => {
  try { fn(); } catch (error) { console.error(`Animación "${nombre}" falló:`, error); }
};
if (!animar) {
  mostrarEstadoFinal();
} else {
  const mm = window.gsap.matchMedia();
  seguro("logo", animarLogo);
  seguro("hero", animarHero);
  seguro("mapa", animarMapa);
  seguro("textos", secciones.animarTextos);
  seguro("riesgos", secciones.animarRiesgos);
  seguro("camino", () => secciones.animarCamino(mm));
  seguro("servicios", () => secciones.animarServicios(mm));
  seguro("test", secciones.animarTest);
  seguro("mitos", secciones.animarMitos);
  seguro("cronograma", secciones.animarCronograma);
  seguro("resultados", secciones.animarResultados);
  seguro("documentos", secciones.animarDocumentos);
  seguro("instagram", secciones.animarInstagram);
  seguro("agenda", secciones.animarAgenda);
  // Las fuentes cambian alturas: recalcular posiciones cuando terminen de cargar
  document.fonts?.ready.then(() => window.ScrollTrigger.refresh());
}
