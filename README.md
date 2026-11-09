# Punto Prisma Studio · Landing Page Oficial

Sitio web y catálogo interactivo de alta conversión para **Punto Prisma Studio** (`studio.puntoprisma.store`), estudio paraguayo especializado en catálogos móviles de cierre por WhatsApp, landing pages de alta velocidad y sistemas a medida para PyMEs.

## 🚀 Despliegue en Vercel

Este proyecto está construido con arquitectura estática pura, listo para desplegar en Vercel, Netlify o GitHub Pages:

1. Importá esta carpeta o repositorio en [Vercel](https://vercel.com).
2. Dejá la configuración por defecto (Framework Preset: **Other** / Root Directory: `./`).
3. Hacé clic en **Deploy**.

La estructura incluye tanto la landing principal ([index.html](file:///c:/Users/Portfolio/Downloads/studio%20ide%20test/index.html)) como las demostraciones interactivas en vivo desplegables (como [demos/la-forja/index.html](file:///c:/Users/Portfolio/Downloads/studio%20ide%20test/demos/la-forja/index.html)).

## 💎 Identidad y Dirección de Arte

- **Estética:** *Swiss Grid / Brutalismo Editorial*
- **Fondo base:** Deep Void (`#060608`), superficies (`#0b0b0e`), elevación (`#111116`) y bordes expuestos de `1px solid rgba(255, 255, 255, 0.08)`.
- **Tipografía:**
  - **Titulares:** `Syne` (800) y `Space Grotesk` (700/600)
  - **Cuerpo y UI:** `Plus Jakarta Sans` (400/500/600)
  - **Métricas y Guaraníes (₲):** `JetBrains Mono` con `tabular-nums`
- **Sin AI Slop:** Cero emojis, cero gradientes arcoíris, cero decoraciones superfluas.

## 📱 Catálogo Escalable (`DEMOS`)

Para agregar nuevas plantillas al catálogo interactivo, añadí un nuevo objeto al array `const DEMOS = [...]` en la sección de scripts de `index.html`:

```javascript
{
  id: "la-forja-barber-studio",
  titulo: "La Forja Barber Studio",
  rubro: "Barberías & Estética",
  plan: "Catálogo Móvil WhatsApp",
  planTag: "CATÁLOGO WHATSAPP",
  descripcion: "Taller de corte y barbería de autor con tablero de servicios, precios en Guaraníes y sistema interactivo de reserva de turnos por WhatsApp.",
  imagenPreview: "demos/la-forja/sillon-1280.jpg",
  urlDemo: "demos/la-forja/index.html",
  waMsg: "Hola Punto Prisma Studio, vi la demo interactiva de La Forja Barber Studio y quiero un sistema de turnos y catálogo idéntico para mi barbería / salón."
}
```

## 📞 Enlaces de Conversión

Todos los botones y llamadas a la acción están enlazados exclusivamente al número oficial paraguayo:
- **WhatsApp Oficial:** `+595 986 125 649` (`https://wa.me/595986125649?text=...`)
