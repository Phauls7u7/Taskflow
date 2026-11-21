# TaskFlow PWA - Lista de Pendientes y Notas

Aplicación Web Progresiva (PWA) instalable en Android desde Chrome o empaquetable como APK mediante PWABuilder.

## Estructura de Archivos
- `index.html`: Estructura principal con los 3 apartados (**Agregar**, **Pendientes**, **Hechas**).
- `styles.css`: Estilos responsivos optimizados para dispositivos móviles.
- `app.js`: Lógica de notas/checklist, almacenamiento persistente (`localStorage`) y registro del Service Worker.
- `manifest.json`: Configuración oficial de la PWA para Chrome y PWABuilder.
- `sw.js`: Service Worker para soporte offline y caché de recursos.
- `icons/`: Íconos oficiales de la aplicación (`icon-192.png`, `icon-512.png`, `icon.svg`).

## Cómo publicar en GitHub Pages y generar APK
1. Sube todos estos archivos (incluyendo la carpeta `icons`) a la raíz de tu repositorio en GitHub.
2. Activa **GitHub Pages** en **Settings > Pages** seleccionando la rama `main`.
3. Abre la URL HTTPS en **PWABuilder.com** para descargar el paquete `.apk` listo para Android.
