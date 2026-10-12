// Punto de entrada. Orden: interacciones (funcionan siempre) y luego animaciones (si corresponde).
// GSAP, ScrollTrigger y Lenis se cargan antes como scripts clásicos desde assets/vendor.
import { animar, hayGSAP } from "./modulos/entorno.js";
import { iniciarScroll } from "./modulos/scroll.js";
import { iniciarNavegacion, cerrarMenu } from "./modulos/navegacion.js";
import { iniciarMitos } from "./modulos/mitos.js";
import { iniciarPestanas } from "./modulos/cronograma.js";
import { iniciarPreguntas } from "./modulos/preguntas.js";
import { iniciarTestEtapa } from "./modulos/etapa.js";
import { iniciarWhatsappFlotante } from "./modulos/whatsapp-flotante.js";
import { iniciarInstagram } from "./modulos/instagram.js";
import { mostrarEstadoFinal } from "./animaciones/estado-final.js";
import { animarLogo, animarHero, animarMapa } from "./animaciones/hero.js";
import * as secciones from "./animaciones/secciones.js";

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
if (!animar) {
  mostrarEstadoFinal();
} else {
  const mm = window.gsap.matchMedia();
  animarLogo();
  animarHero();
  animarMapa();
  secciones.animarTextos();
  secciones.animarRiesgos();
  secciones.animarCamino(mm);
  secciones.animarServicios(mm);
  secciones.animarTest();
  secciones.animarMitos();
  secciones.animarCronograma();
  secciones.animarResultados();
  secciones.animarDocumentos();
  secciones.animarInstagram();
  secciones.animarAgenda();
  // Las fuentes cambian alturas: recalcular posiciones cuando terminen de cargar
  document.fonts?.ready.then(() => window.ScrollTrigger.refresh());
}
