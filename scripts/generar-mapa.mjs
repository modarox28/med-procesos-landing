// Genera los trazados SVG de los países del mapa del hero (Natural Earth 1:50m vía world-atlas).
// Uso: npm run mapa  → escribe scripts/mapa.json con { W, H, paises: { colombia: "M…Z", … }, bogota, baires }
// Luego copia cada trazado al <path> correspondiente dentro de <figure class="hero-mapa"> en index.html.
// Solo hace falta si quieres cambiar el encuadre, la simplificación o añadir países.
import { feature } from "topojson-client";
import { readFileSync, writeFileSync } from "fs";
const topo = JSON.parse(readFileSync(new URL("../node_modules/world-atlas/countries-50m.json", import.meta.url)));
const fc = feature(topo, topo.objects.countries);
const IDS = { "170":"colombia","032":"argentina","076":"brasil","862":"venezuela","218":"ecuador","604":"peru","068":"bolivia","600":"paraguay","858":"uruguay","152":"chile","328":"guyana","740":"surinam","591":"panama","250":"francia" };
// Proyección: equirectangular con corrección de latitud media (-22°)
const LON0=-82.5, LON1=-33.5, LAT0=13.5, LAT1=-56;
const k=Math.cos(-22*Math.PI/180);
const W=300; const sx=W/((LON1-LON0)*k); const H=Math.round((LAT0-LAT1)*sx);
const P=([lon,lat])=>[((lon-LON0)*k*sx),((LAT0-lat)*sx)];
const out={W,H,paises:{}};
function ringPath(ring,tol=0.6){
  let pts=ring.map(P), d="", last=null;
  for(const [x,y] of pts){ const p=[+x.toFixed(1),+y.toFixed(1)]; if(last&&Math.hypot(p[0]-last[0],p[1]-last[1])<tol)continue; d+=(d?"L":"M")+p[0]+" "+p[1]; last=p; }
  return d+"Z";
}
const area=r=>{let a=0;const p=r.map(P);for(let i=0;i<p.length;i++){const [x1,y1]=p[i],[x2,y2]=p[(i+1)%p.length];a+=x1*y2-x2*y1;}return Math.abs(a/2);};
for(const f of fc.features){
  const n=IDS[f.id]; if(!n) continue;
  let polys=f.geometry.type==="Polygon"?[f.geometry.coordinates]:f.geometry.coordinates;
  if(n==="francia") polys=polys.filter(p=>p[0].every(([lon,lat])=>lon>-56&&lon<-50&&lat>1&&lat<6.5)); // Guayana Francesa
  polys=polys.filter(p=>p[0].some(([lon,lat])=>lon>LON0&&lon<LON1&&lat<LAT0&&lat>LAT1)).filter(p=>area(p[0])>2.5);
  const tol=(n==="colombia"||n==="argentina")?0.7:1.6; out.paises[n==="francia"?"guayana_fr":n]=polys.map(p=>ringPath(p[0],tol)).join("");
}
// Centros (Bogotá y Buenos Aires)
out.bogota=P([-74.08,4.61]).map(v=>+v.toFixed(1)); out.baires=P([-58.38,-34.6]).map(v=>+v.toFixed(1));
writeFileSync(new URL("./mapa.json", import.meta.url),JSON.stringify(out));
console.log(W,H,Object.keys(out.paises).map(k=>k+":"+out.paises[k].length).join(" "),out.bogota,out.baires);
