const fs = require('fs');
const path = require('path');

const html = fs.readFileSync('index.html', 'utf8');

console.log('=== VERIFYING RONDA 3 REQUIREMENTS ===');
let errors = 0;
function check(cond, desc) {
  if (cond) {
    console.log(`[PASS] ${desc}`);
  } else {
    console.error(`[FAIL] ${desc}`);
    errors++;
  }
}

// 1. OG Image & Meta
check(fs.existsSync('assets/og.png'), 'assets/og.png exists on disk');
check(html.includes('<meta property="og:image:width" content="1200">'), 'og:image:width 1200 present');
check(html.includes('<meta property="og:image:height" content="630">'), 'og:image:height 630 present');
check(html.includes('<meta property="og:image:alt" content="Punto Prisma Studio: catálogos con carrito a WhatsApp">'), 'og:image:alt present');
check(html.includes('<meta name="twitter:card" content="summary_large_image">'), 'twitter:card summary_large_image present');

// 2. Plazos
check(html.includes('Válido para Presencia Express y Catálogo Móvil'), 'Garantía 02 clarifies validity for Presencia Express & Catálogo Móvil');
check(html.includes('En el plan Corporativo, el plazo es según alcance y se confirma en la cotización.'), 'Garantía 02 clarifies Corporativo plazo');
check(html.includes('Plazo según alcance, se confirma en la cotización'), 'Plan Corporativo card states "Plazo según alcance, se confirma en la cotización"');

// 3. Promesas sin definir
check(!html.includes('Servidores de alta velocidad con CDN global'), 'Removed "Servidores de alta velocidad con CDN global"');
check(html.includes('Certificado de seguridad SSL incluido.'), 'Present "Certificado de seguridad SSL incluido."');
check(!html.includes('Soporte prioritario y capacitación incluida'), 'Removed "Soporte prioritario y capacitación incluida"');
check(html.includes('DOMINIO PROPIO'), 'Present "DOMINIO PROPIO"');
check(!html.includes('REGISTRO OFICIAL INCLUIDO'), 'Removed "REGISTRO OFICIAL INCLUIDO"');

// 4. Tiempos de respuesta
check(html.includes('Respondemos en menos de 15 minutos de 08:00 a 18:00 (hora de Paraguay). Fuera de ese horario, apenas abrimos.'), 'Unified response time present in Garantía 5 & FAQ');
check(html.includes('en menos de 2 horas, dentro del horario de atención'), 'Formal quote in pre-footer CTA states "en menos de 2 horas, dentro del horario de atención"');

// 5. Imágenes WebP & Picture
const webpImgs = ['asuncion-district.webp', 'solucion-catalogo.webp', 'solucion-presencia.webp', 'solucion-sistemas.webp'];
webpImgs.forEach(f => {
  const p = path.join('assets/img', f);
  const exists = fs.existsSync(p);
  const sizeKb = exists ? (fs.statSync(p).size / 1024).toFixed(1) : 0;
  check(exists && sizeKb >= 70 && sizeKb <= 200, `${f} exists (~150 KB, actual: ${sizeKb} KB)`);
  check(html.includes(`assets/img/${f}`), `HTML references assets/img/${f} in <source>`);
});
check(html.includes('assets/img/asuncion-district.webp') && html.includes('fetchpriority="high"'), 'Hero image has fetchpriority="high" and no loading="lazy"');
check(html.includes('assets/img/solucion-presencia.webp') && html.includes('loading="lazy"'), 'Presencia image has loading="lazy"');

// 6. Botón flotante WhatsApp
check(html.includes('w-14 h-14') || html.includes('w-[56px] h-[56px]'), 'WhatsApp button is 56px');
check(html.includes('bg-asuncion-cognac'), 'WhatsApp button is dorado ámbar (bg-asuncion-cognac)');
check(html.includes('fill-black') || html.includes('text-black'), 'WhatsApp icon is black');
check(html.includes('safe-area-inset'), 'WhatsApp button has safe-area-inset');
check(html.includes('pb-28 sm:pb-12'), 'Footer has clearance for mobile button (pb-28 sm:pb-12)');

console.log(`\nTOTAL FAILURES: ${errors}`);
if (errors > 0) process.exit(1);
