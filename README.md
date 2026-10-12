# Med Procesos · Landing (concepto de portafolio)

Landing page informativa con reserva de asesorías para **Med Procesos**, que acompaña a médicos colombianos a hacer su especialidad en Argentina. Es un **concepto de diseño para mi portafolio**, no el sitio oficial. El contenido se basa en sus publicaciones públicas de Instagram ([@med.procesos](https://www.instagram.com/med.procesos/)), y los botones de reserva llevan a sus canales oficiales (Calendly y WhatsApp). La página no recoge ni guarda datos.

<img src="docs/escritorio.webp" alt="Inicio en escritorio con el mapa de Colombia a Argentina" width="640"> <img src="docs/celular.webp" alt="Inicio en celular" width="190">

**Sitio:** https://modarox28.github.io/med-procesos-landing/

## Qué tiene

- **Identidad de la marca:**
  - isotipo redibujado en SVG;
  - paleta tomada de sus publicaciones;
  - el recurso de las frases resaltadas con una etiqueta de color.
- **Mapa real:** siluetas de Suramérica generadas a partir de Natural Earth (dominio público), con la ruta Bogotá → Buenos Aires.
- **Animaciones propias:**
  - el logo se traza al cargar;
  - un avión recorre la ruta;
  - las frases se "pintan" con la etiqueta de color;
  - el camino en 4 etapas avanza en horizontal mientras bajas;
  - los servicios se abren como una baraja;
  - las tarjetas de mitos giran en 3D;
  - la lista de documentos se marca sola;
  - un sello se estampa junto a la reserva.
- **Celular primero:** carruseles deslizables, menú a pantalla completa y scroll nativo en pantallas táctiles.
- **Test "¿En qué etapa estás?":** 4 preguntas que ubican al médico en una de las 4 etapas, le sugieren servicios y le permiten copiar un resumen para enviarlo por WhatsApp. No guarda nada.
- **Listo para compartir:** imagen de vista previa, datos estructurados, sitemap y página 404 propia.
- **Accesible:** contraste AA, navegación con teclado y respeto por "reducir movimiento".
- **Seguro:**
  - Content-Security-Policy;
  - sin CDNs de terceros;
  - enlaces externos con `rel="noopener"`.

## Estructura del proyecto

```
med-procesos-landing/
├── index.html                  ← todo el contenido (textos, enlaces, publicaciones de Instagram)
├── 404.html                    ← página de error con la marca (GitHub Pages la usa sola)
├── sitemap.xml                 ← mapa del sitio para buscadores
├── assets/
│   ├── css/
│   │   ├── base.css            ← colores, fuentes, tamaños, reset y utilidades (.contenedor, .seccion)
│   │   ├── componentes.css     ← piezas reutilizables: botones, etiquetas, resaltados, barra y menú, carrusel, WhatsApp flotante
│   │   └── secciones/          ← un archivo por sección, en el mismo orden de la página
│   │       ├── 01-hero.css         (#inicio: título, mapa)
│   │       ├── 02-por-que.css      (#por-que: riesgos de hacerlo solo)
│   │       ├── 03-camino.css       (#camino: 4 etapas)
│   │       ├── 04-servicios.css    (#servicios: baraja de tarjetas)
│   │       ├── 05-etapa.css        (#etapa: test "¿En qué etapa estás?")
│   │       ├── 06-mitos.css        (#mitos: tarjetas que giran)
│   │       ├── 07-cronograma.css   (#cronograma: pestañas y fechas)
│   │       ├── 08-resultados.css   (#resultados: contador y caras)
│   │       ├── 09-documentos.css   (#documentos: lista de chequeo)
│   │       ├── 10-instagram.css    (#instagram: publicaciones)
│   │       ├── 11-preguntas.css    (#preguntas: acordeón)
│   │       ├── 12-agenda.css       (#agenda: reserva y sello)
│   │       └── 13-pie.css          (pie de página)
│   ├── js/
│   │   ├── main.js             ← punto de entrada: arranca interacciones y animaciones
│   │   ├── modulos/            ← comportamiento que funciona siempre (con o sin animaciones)
│   │   │   ├── entorno.js          utilidades ($, $$) y detección de "reducir movimiento"
│   │   │   ├── scroll.js           scroll suave (Lenis) y enlaces internos
│   │   │   ├── navegacion.js       barra superior y menú hamburguesa
│   │   │   ├── mitos.js            voltear tarjetas
│   │   │   ├── cronograma.js       pestañas accesibles
│   │   │   ├── preguntas.js        acordeón
│   │   │   ├── etapa.js            test de etapa (preguntas, cálculo y resultado)
│   │   │   ├── whatsapp-flotante.js botón flotante que aparece después del hero
│   │   │   ├── instagram.js        carga diferida del embed de Instagram
│   │   │   └── contadores.js       números que cuentan
│   │   └── animaciones/        ← solo efectos visuales (GSAP + ScrollTrigger)
│   │       ├── hero.js             logo, título y avión del mapa
│   │       ├── secciones.js        una función por sección (animarCamino, animarMitos…)
│   │       └── estado-final.js     deja todo visible si no hay animaciones
│   ├── vendor/                 ← librerías de terceros, sin modificar (GSAP 3, ScrollTrigger, Lenis)
│   ├── fonts/                  ← Oswald e Inter en woff2 (servidas localmente)
│   └── img/                    ← logos e isotipo en SVG, og.png (vista previa al compartir) y apple-touch-icon.png
├── scripts/generar-mapa.mjs    ← regenera los trazados de los países del mapa
├── tests/landing.spec.js       ← pruebas end-to-end con Playwright
├── docs/                       ← capturas para este README
└── .github/workflows/pruebas.yml ← corre las pruebas en cada push
```

**Regla general:** el contenido está en `index.html`, el aspecto en `assets/css/` y el comportamiento en `assets/js/`. Cada sección tiene el mismo nombre en los tres lugares. Por ejemplo, "Mito o realidad" es `#mitos` en el HTML, `05-mitos.css` en los estilos, `modulos/mitos.js` para el comportamiento y `animarMitos()` para la animación.

## Cómo editar

| Quiero cambiar…                          | Dónde                                                                                                                                                     |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Un texto, una pregunta, un servicio       | `index.html`, buscando el `id` de la sección                                                                                                              |
| Los colores                               | `assets/css/base.css`, en `:root`. Usa `--naranja-ui` y `--verde-osc` cuando el texto blanco es pequeño (contraste AA); `--naranja` solo para fondos y títulos grandes. |
| Fuentes, márgenes, ancho máximo           | `assets/css/base.css` (`--max`, `--gut`, `--nav-h`)                                                                                                       |
| Botones, etiquetas, menú del celular      | `assets/css/componentes.css`                                                                                                                              |
| El diseño de una sección                  | su archivo en `assets/css/secciones/`. Las reglas para celular están al final de cada archivo.                                                             |
| Una animación                             | `assets/js/animaciones/secciones.js` o `hero.js`                                                                                                          |
| Enlaces de Calendly o WhatsApp            | `index.html`, buscando `calendly.com` o `api.whatsapp.com`                                                                                                |
| Preguntas o resultados del test de etapa  | Preguntas: `index.html`, dentro de `#etapa`. Textos de cada etapa y reglas: `ETAPAS` y `calcularEtapa()` en `assets/js/modulos/etapa.js`. |
| Imagen al compartir el enlace             | `assets/img/og.png` (1200×630). Las etiquetas `og:` están en el `<head>` de `index.html`. |
| Fechas del cronograma                     | `index.html`, dentro de `#cronograma`. Cada pestaña tiene su `<div role="tabpanel">`.                                                                      |

### Añadir una sección nueva

1. Crea el `<section class="seccion nombre" id="nombre">` en `index.html`, en su lugar.
2. Crea `assets/css/secciones/NN-nombre.css` y enlázalo en el `<head>`, en orden.
3. Si tiene interacción, crea `assets/js/modulos/nombre.js` con una función `iniciarNombre()`, e impórtala y llámala en `main.js`.
4. Si tiene animación, añade `animarNombre()` en `animaciones/secciones.js` y llámala en `main.js`.
5. Si lleva un carrusel en celular, añade la clase `carrusel` al contenedor de las tarjetas.

### Publicaciones de Instagram

La sección "Comunidad" usa el **embed oficial de Instagram**. Para cambiar una publicación, edita su `<blockquote class="instagram-media">` dentro de `#insta-grid`. El enlace del post va en `data-instgrm-permalink` y también en su `<a>`. Si Instagram no carga, por ejemplo con un bloqueador, se ve una tarjeta con el enlace.

Las fotos del equipo y de los médicos son de Med Procesos y de las personas que aparecen, así que no se copian al sitio. Si Med Procesos lo autoriza, se pueden agregar en `assets/img/`.

### Si cambias CSS o JS: sube la versión

Todos los archivos se enlazan con `?v=15` en `index.html` y `404.html`. Al publicar cambios, cambia ese número en todos los enlaces (buscar y reemplazar `?v=15` → `?v=16`) para que los navegadores no usen la versión guardada en caché.

## Desarrollo local

Requisitos: [Node.js](https://nodejs.org) 20 o superior y Python 3. Python solo hace falta para el servidor local.

```bash
npm install                      # la primera vez
npx playwright install chromium  # la primera vez
npm run servir                   # abre http://localhost:8090
```

> El sitio usa módulos de JavaScript (`type="module"`), así que **no funciona abriendo `index.html` con doble clic**. Siempre hay que usar un servidor local, como `npm run servir` o la extensión Live Server de VS Code.

## Pruebas

```bash
npm test               # todas: escritorio, celular y "reducir movimiento"
npm run test:celular   # solo celular
```

Las pruebas revisan:

- errores de consola y desbordes horizontales;
- enlaces internos y externos;
- el mapa;
- el menú del celular, también después de hacer scroll;
- mitos, pestañas y preguntas;
- que todo quede visible tras las animaciones;
- la carga de Instagram;
- el test de etapa (con clics, con teclado y su lógica);
- el botón flotante de WhatsApp;
- la vista previa al compartir y la página 404;
- accesibilidad con axe (WCAG 2 AA);
- la CSP.

GitHub Actions las corre en cada push.

## Publicación

El sitio se publica con **GitHub Pages** desde la rama `main`: cada push a `main` actualiza el sitio en uno o dos minutos. No hay paso de compilación.

## Buscadores

- `sitemap.xml` se puede enviar en Google Search Console.
- `robots.txt` no se incluye a propósito: los buscadores solo lo leen en la raíz del dominio (`modarox28.github.io/robots.txt`), no dentro de `/med-procesos-landing/`.
- Los datos estructurados describen la página como un concepto **sobre** Med Procesos, no como su sitio oficial.

## Mapa

Los países del mapa del hero son trazados SVG dentro de `index.html`. Para regenerarlos, por ejemplo con otro encuadre o con más países:

1. Corre `npm run mapa`. Se genera `scripts/mapa.json`.
2. Copia cada trazado al `<path>` correspondiente dentro de `<figure class="hero-mapa">`.

Diseño y desarrollo: [modarox28](https://github.com/modarox28).
