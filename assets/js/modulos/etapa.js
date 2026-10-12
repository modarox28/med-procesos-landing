// Test "¿En qué etapa estás?": una pregunta a la vez y un resultado con la etapa y los servicios sugeridos.
// No envía ni guarda nada: todo se calcula en el navegador.
import { $, $$ } from "./entorno.js";

const WHATSAPP = "https://api.whatsapp.com/message/KINW7CGQKIVFO1";

/** Las 4 etapas del camino (mismos nombres que la sección #camino). */
export const ETAPAS = {
  1: {
    titulo: "Planeación y documentos",
    texto: "Estás al inicio. Lo más importante ahora es saber qué ruta de convalidación te corresponde y reunir los documentos sin errores: un detalle en una apostilla puede devolver todo el expediente.",
    servicios: ["Convalidación o reválida", "Cronograma personalizado", "Med Plus"],
  },
  2: {
    titulo: "DNI y convalidación",
    texto: "Ya arrancaste. Ahora toca cerrar la convalidación de tu título y tu residencia (Visa Mercosur o vía Radex), con la precaria mientras sale el DNI: sin ella no puedes inscribirte a residencias.",
    servicios: ["DNI argentino", "Convalidación o reválida", "Cronograma personalizado"],
  },
  3: {
    titulo: "Examen e inscripción",
    texto: "Tienes lo esencial para postularte. El reto ahora es prepararte con enfoque argentino y elegir bien la jurisdicción y las fechas de inscripción.",
    servicios: ["Examen de ingreso", "Inscripción a residencias", "Turismo académico"],
  },
  4: {
    titulo: "Adjudicación y matrícula",
    texto: "Estás en la recta final: elegir hospital y especialidad en la adjudicación (y estar atento a las readjudicaciones), y tramitar tu matrícula para empezar.",
    servicios: ["Inscripción a residencias", "Turismo académico", "Med Breakfast"],
  },
};

const TEXTOS = {
  titulo: { no: "todavía no empiezo", tramite: "en trámite", si: "ya lo tengo" },
  dni: { no: "aún no", precaria: "tengo la precaria", si: "tengo DNI" },
  examen: { no: "no he empezado", preparando: "me estoy preparando o ya me inscribí", presentado: "ya presenté el examen" },
  cuando: { pronto: "en la próxima convocatoria", anio: "en uno o dos años", explorando: "solo estoy explorando" },
};

/**
 * Calcula la etapa (1 a 4) y un aviso opcional según las respuestas.
 * @param {{titulo:string, dni:string, examen:string, cuando:string}} r
 */
export function calcularEtapa(r) {
  let etapa;
  if (r.titulo === "no") etapa = 1;
  else if (r.titulo === "tramite" || r.dni === "no") etapa = 2;
  else if (r.examen === "presentado") etapa = 4;
  else etapa = 3;

  let aviso = "";
  if (r.cuando === "pronto" && etapa <= 2) {
    aviso = "Para la próxima convocatoria el tiempo es justo: en el caso que publicó Med Procesos, el camino completo tomó 8 meses. Conviene agendar cuanto antes.";
  } else if (r.cuando === "pronto" && etapa === 3 && r.examen === "no") {
    aviso = "Revisa ya las fechas de inscripción: no todas las jurisdicciones manejan el mismo calendario y perder una ventana puede costar un año.";
  } else if (r.cuando === "explorando") {
    aviso = "Explorar con tiempo es la mejor decisión: con un cronograma desde ahora evitas perder una convocatoria.";
  }
  return { etapa, aviso };
}

/** Texto para pegar en WhatsApp con las respuestas. */
export function resumen(r, etapa) {
  return [
    "Hola, hice el test de etapa en la página:",
    `• Etapa ${etapa}: ${ETAPAS[etapa].titulo}`,
    `• Título convalidado: ${TEXTOS.titulo[r.titulo]}`,
    `• DNI o precaria: ${TEXTOS.dni[r.dni]}`,
    `• Examen: ${TEXTOS.examen[r.examen]}`,
    `• Quiero empezar: ${TEXTOS.cuando[r.cuando]}`,
    "Me gustaría agendar una asesoría.",
  ].join("\n");
}

export function iniciarTestEtapa() {
  const form = $("#test-etapa");
  if (!form) return;
  const preguntas = $$(".test-pregunta", form);
  const barra = $(".test-barra", form);
  const numero = $(".test-n", form);
  const atras = $(".test-atras", form);
  const caja = $(".test-resultado", form);
  const copiado = $(".test-copiado", form);
  let actual = 0;
  let porPuntero = false;
  let ultimoResumen = "";

  form.classList.add("paso-a-paso");
  preguntas.forEach((p) => p.setAttribute("tabindex", "-1"));

  const respuestas = () => Object.fromEntries(new FormData(form));

  function mostrar(i, enfocar = true) {
    actual = i;
    preguntas.forEach((p, j) => p.classList.toggle("activa", j === i));
    numero.textContent = String(i + 1);
    barra.style.width = `${((i + 1) / preguntas.length) * 100}%`;
    atras.disabled = i === 0;
    if (enfocar) preguntas[i].focus({ preventScroll: true });
  }

  function siguiente() {
    const clave = preguntas[actual].dataset.clave;
    if (!form.elements[clave].value) return;
    if (actual < preguntas.length - 1) mostrar(actual + 1);
    else mostrarResultado();
  }

  function mostrarResultado() {
    const r = respuestas();
    const { etapa, aviso } = calcularEtapa(r);
    const datos = ETAPAS[etapa];
    $(".test-num", caja).textContent = String(etapa).padStart(2, "0");
    $(".test-titulo", caja).textContent = datos.titulo;
    $(".test-texto", caja).textContent = datos.texto;
    const lista = $(".test-servicios", caja);
    lista.replaceChildren(...datos.servicios.map((s) => Object.assign(document.createElement("li"), { textContent: s })));
    const avisoEl = $(".test-aviso", caja);
    avisoEl.textContent = aviso;
    avisoEl.hidden = !aviso;
    copiado.replaceChildren();
    ultimoResumen = resumen(r, etapa);
    form.classList.add("terminado");
    form.dataset.etapa = String(etapa);
    caja.hidden = false;
    caja.focus({ preventScroll: true });
    const arriba = form.getBoundingClientRect().top;
    if (arriba < 0 || arriba > innerHeight * 0.6) form.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function reiniciar() {
    form.reset();
    form.classList.remove("terminado");
    delete form.dataset.etapa;
    caja.hidden = true;
    mostrar(0);
  }

  async function copiar() {
    let ok = false;
    try {
      await navigator.clipboard.writeText(ultimoResumen);
      ok = true;
    } catch { /* sin permiso de portapapeles: se muestra el texto para copiarlo a mano */ }
    const enlace = Object.assign(document.createElement("a"), {
      href: WHATSAPP, target: "_blank", rel: "noopener noreferrer", textContent: "Abrir WhatsApp",
    });
    if (ok) {
      copiado.replaceChildren("Copiado. Pégalo en el chat: ", enlace);
    } else {
      const pre = Object.assign(document.createElement("pre"), { textContent: ultimoResumen });
      pre.style.cssText = "white-space:pre-wrap;font:inherit;font-weight:400;color:var(--texto);margin:8px 0";
      copiado.replaceChildren("Copia este texto y pégalo en el chat: ", pre, enlace);
    }
  }

  // Con mouse o dedo se avanza solo al elegir; con teclado (flechas) no, para no saltar preguntas sin querer.
  form.addEventListener("pointerdown", () => (porPuntero = true));
  form.addEventListener("keydown", () => (porPuntero = false));
  // "click" y no "change": así también avanza si al volver atrás se toca la misma respuesta
  form.addEventListener("click", (e) => {
    if (porPuntero && e.target.matches("input[type=radio]")) setTimeout(siguiente, 260);
  });
  // Enter dentro del test = siguiente (la CSP no permite enviar formularios)
  form.addEventListener("submit", (e) => { e.preventDefault(); siguiente(); });
  form.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.matches("input[type=radio]")) { e.preventDefault(); siguiente(); }
  });
  atras.addEventListener("click", () => actual > 0 && mostrar(actual - 1));
  $(".test-copiar", form).addEventListener("click", copiar);
  $(".test-repetir", form).addEventListener("click", reiniciar);

  // Indicación para teclado
  const ayuda = document.createElement("p");
  ayuda.className = "test-ayuda";
  ayuda.textContent = "Con teclado: flechas para elegir y Enter para seguir.";
  $(".test-acciones", form).append(ayuda);

  mostrar(0, false);
}
