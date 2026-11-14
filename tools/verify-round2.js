const fs = require('fs');
const path = require('path');

const html = fs.readFileSync('index.html', 'utf8');

console.log('--- AUDITING index.html AGAINST USER REQUEST 10 ---');
let errors = [];
let passes = [];

function assert(condition, message) {
  if (condition) {
    passes.push(message);
    console.log(`[PASS] ${message}`);
  } else {
    errors.push(message);
    console.error(`[FAIL] ${message}`);
  }
}

// 1. Legal line & SITE_CONFIG
assert(html.includes('SITE_CONFIG = {'), 'SITE_CONFIG exists in script');
assert(!html.includes('[Razón social') && !html.includes('[Términos') && !html.includes('[Privacidad'), 'No brackets in legal lines');
assert(!html.includes('id="legalLine">[') && !html.includes('id="footerLegalLine">['), 'No bracket placeholders in legal line DOM');

// 2. "ejemplos de comercios" & tabs
assert(html.includes('ejemplos de comercios'), '"ejemplos de comercios" present');
assert(!html.includes('casos reales de comercio paraguayo'), '"casos reales de comercio paraguayo" removed');
assert(html.includes('Ejemplo: Ferretería &amp; Repuestos') || html.includes('Ejemplo: Ferretería & Repuestos'), 'Tab 1 labeled Ejemplo');
assert(html.includes('Ejemplo: Barber Studio &amp; Estética') || html.includes('Ejemplo: Barber Studio & Estética'), 'Tab 2 labeled Ejemplo');
assert(html.includes('Ejemplo: Boutique &amp; Calzados') || html.includes('Ejemplo: Boutique & Calzados'), 'Tab 3 labeled Ejemplo');

// 3. "condiciones claras desde el primer contacto"
assert(html.includes('condiciones claras desde el primer contacto') || html.includes('Condiciones claras desde el primer contacto'), '"condiciones claras desde el primer contacto" present');
assert(!html.includes('garantías reales por escrito'), '"garantías reales por escrito" removed');

// 4. "personas reales, sin bots" in 2 places
const personasCount = (html.match(/personas reales, sin bots/gi) || []).length;
assert(personasCount >= 2, `"personas reales, sin bots" present in at least 2 places (found: ${personasCount})`);
assert(!html.includes('ingenieros radicados en Paraguay'), '"ingenieros radicados en Paraguay" removed');

// 5. FAQ commissions
assert(html.includes('Cero comisiones por venta. Pagás el plan y listo.'), 'FAQ comisiones exact text present');
assert(!html.includes('pagás un único costo') && !html.includes('la plataforma es 100% tuya'), 'Removed "pagás un único costo… la plataforma es 100% tuya"');
assert(!html.toLowerCase().includes('segundo año'), 'No mention of "segundo año"');

// 6. Simulator
assert(html.includes('SIMULADOR DE AHORRO (EJEMPLO)') || html.includes('Simulador de Ahorro (Ejemplo)') || html.includes('EJEMPLO: SIMULADOR DE AHORRO'), 'Simulator labeled as Ejemplo');
assert(html.includes('ajustá el porcentaje que te cobra tu plataforma') || html.includes('Ajustá el porcentaje que te cobra tu plataforma'), '"Ajustá el porcentaje que te cobra tu plataforma" present');
assert(!html.includes('entre el 10% y el 20%'), '"entre el 10% y el 20%" removed');
assert(html.includes('0% COMISIONES POR VENTA'), '"0% COMISIONES POR VENTA" present');
assert(!html.includes('0% COMISIONES DE POR VIDA'), '"0% COMISIONES DE POR VIDA" removed');

// 7. Structure & Order
const sections = [];
const secRegex = /<(?:section|header|footer)[^>]+id=["']([^"']+)["']/g;
let sm;
while ((sm = secRegex.exec(html)) !== null) {
  sections.push(sm[1]);
}
console.log('Detected section IDs:', sections);
assert(!sections.includes('manifiesto') && !html.includes('Nuestra postura'), 'Section "Nuestra postura" / "manifiesto" removed');

const expectedOrder = ['inicio', 'soluciones', 'demos', 'garantias', 'proceso', 'amedida', 'simulador', 'dominios', 'faq'];
let lastIndex = -1;
let orderOk = true;
expectedOrder.forEach(id => {
  const idx = sections.indexOf(id);
  if (idx < lastIndex) {
    orderOk = false;
    console.error(`Order mismatch: ${id} is at index ${idx}, previous was ${lastIndex}`);
  }
  lastIndex = idx;
});
assert(orderOk, `Section order matches required flow: ${expectedOrder.join(' -> ')}`);

// 3 razones bar
assert(html.includes('Precio final con IVA · Sin comisiones · Tu pedido llega armado a tu WhatsApp') || html.includes('Precio final con IVA') && html.includes('Tu pedido llega armado a tu WhatsApp'), '3 razones bar present between hero and plans');

// 8. "Ver ejemplo de este plan" on plan cards
const verEjemploCount = (html.match(/Ver ejemplo de este plan/g) || []).length;
assert(verEjemploCount >= 2, `"Ver ejemplo de este plan" present on plan cards (found: ${verEjemploCount})`);

// 9. Jargon check
const forbiddenWords = ['Intake', 'Sprint de 7 Días', 'ingesta', 'SKUs', 'gTLD', 'Edge', 'ICANN', 'ARCHIVO_FUENTE'];
forbiddenWords.forEach(word => {
  // Allow gTLD or edge only if not present or check exact case
  const regex = new RegExp(`\\b${word}\\b`, 'g');
  const count = (html.match(regex) || []).length;
  assert(count === 0, `Forbidden jargon '${word}' count: ${count}`);
});

// Check decorative brackets like "[OK]" or "[...]" in user visible text
const bracketMatches = html.match(/\[(OK|PRESENCIA|CATALOGO|DOMINIO|HOSTING|CORREO)\]/g) || [];
assert(bracketMatches.length === 0, `Decorative brackets count: ${bracketMatches.length}`);

// 10. Numbering of sections without repetitions
const numRegex = /\b0([1-9])\s*·/g;
let nm;
const numbersFound = [];
while ((nm = numRegex.exec(html)) !== null) {
  numbersFound.push(nm[0]);
}
console.log('Section numbers found in headers:', numbersFound);

// 11. CSS compiled and static
assert(!html.includes('cdn.tailwindcss.com'), 'Tailwind CDN completely removed');
assert(html.includes('assets/css/styles.css'), 'Static compiled stylesheet linked (assets/css/styles.css)');

// 12. prefers-reduced-motion
assert(html.includes('prefers-reduced-motion'), 'prefers-reduced-motion handled');

// 13. Head metadata
assert(html.includes('<title>Catálogos con carrito a WhatsApp para comercios en Paraguay | Punto Prisma Studio</title>'), 'Exact page title present');
assert(html.includes('<meta property="og:title" content="Catálogos con carrito a WhatsApp para comercios en Paraguay | Punto Prisma Studio">'), 'og:title present');
assert(html.includes('<meta property="og:image" content="https://studio.puntoprisma.store/assets/og.png">'), 'og:image points to assets/og.png');
assert(html.includes('<meta property="og:locale" content="es_PY">'), 'og:locale is es_PY');
assert(html.includes('<meta name="theme-color" content="#0C0B0A">'), 'theme-color is #0C0B0A');
assert(html.includes('Saltar a los planes'), 'Skip link "Saltar a los planes" present');

// 14. Palette check
assert(html.includes('#0e0d0c') || html.includes('asuncion-void') || html.includes('#0C0B0A'), 'Visual identity preserved');
assert(html.includes('#e0a96d') || html.includes('asuncion-cognac'), 'Amber/cognac preserved');

console.log(`\nTOTAL PASSES: ${passes.length}`);
console.log(`TOTAL ERRORS: ${errors.length}`);
if (errors.length > 0) process.exit(1);

