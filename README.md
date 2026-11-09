<p align="center">
  <img src="www/icons/icon-512.png" alt="Icono de KizuNaka" width="140">
</p>

<h1 align="center">KizuNaka</h1>

<p align="center">
  <b>絆 (kizuna) + 仲間 (nakama)</b> · el vínculo entre compañeros<br>
  Creado por <a href="https://github.com/peter1323">peter1323</a>
</p>

App web (PWA) para fans del anime y el manga. Funciona en el móvil y en el PC, y se puede instalar como una app.

Está hecha con HTML, CSS y JavaScript puro (módulos ES), sin frameworks ni herramientas de build.

## Qué hace

### 🎮 Adivina el anime
Juego diario al estilo Wordle. Cada día hay un anime secreto, el mismo para todo el mundo, elegido entre los 200 más populares de [AniList](https://anilist.co).

- Escribe un título (en inglés o en romaji) y elige una sugerencia.
- Tienes **8 intentos**. Cada intento muestra pistas de colores:
  - **Año** y **episodios**: verde si coincide; si no, rojo con ↑ (el secreto es mayor) o ↓ (es menor).
  - **Formato** y **estudio principal**: verde o rojo.
  - **Géneros**: los que tiene en común con el secreto. Verde si son todos iguales, naranja si comparten alguno, rojo si ninguno.
- Los intentos del día se guardan, así que puedes cerrar la app y seguir luego.
- ¿Te sabe a poco? En el modo **Práctica** hay 100 niveles: elige el que quieras de la lista (en verde los acertados, en rojo los fallados) o juega una **partida aleatoria**.

### 📸 Buscar por captura
Sube una captura de un anime y, gracias a [trace.moe](https://trace.moe), verás los 3 resultados más parecidos con su episodio, el minuto exacto y el % de coincidencia. Si es menor del 87 %, se marca como «poco fiable».

### 📚 ¿Qué leo o veo?
Elige si quieres algo para leer o para ver, responde 5 preguntas (tipo, género, ambiente, longitud y si quieres algo popular o una joya oculta) y te recomienda mangas, manhwas, manhuas o animes de AniList, uno a uno. Puedes avanzar o volver a la recomendación anterior, y traducir la sinopsis al español con el botón «🌐 Traducir».

## Estructura (MVC)

```
www/
  index.html, manifest.json, sw.js
  css/estilos.css
  icons/
  js/app.js          → router por hash y barra de navegación
  js/models/         → datos y lógica (APIs y localStorage), sin tocar el DOM
  js/views/          → solo pintan el HTML y avisan de los eventos
  js/controllers/    → conectan modelo y vista
```

## Probarla en local

Los módulos ES y el service worker necesitan un servidor (no basta con abrir el `index.html` con doble clic). Con [Node.js](https://nodejs.org) instalado:

```bash
npx serve www
```

Y abre la dirección que aparece (normalmente http://localhost:3000).

## Instalarla como app

- **Android (Chrome):** abre la web, pulsa el menú ⋮ y elige «Instalar aplicación» o «Añadir a pantalla de inicio».
- **iPhone (Safari):** pulsa el botón Compartir y luego «Añadir a pantalla de inicio».
- **PC (Chrome o Edge):** pulsa el icono de instalar que sale a la derecha de la barra de direcciones.

## Publicación en GitHub Pages

Cada push a `main` publica la carpeta `www/` con GitHub Actions (`.github/workflows/pages.yml`).

La primera vez hay que activarlo en el repositorio: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

La app usa rutas relativas, así que funciona igual en `https://usuario.github.io/KizuNaka/`.

## Convertirla en app de Android con Capacitor

Necesitas Node.js y Android Studio.

```bash
npm init -y
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init KizuNaka com.kizunaka.app --web-dir www
npx cap add android
npx cap sync
npx cap open android
```

Desde Android Studio puedes probarla en un móvil o emulador y generar el APK/AAB. Cada vez que cambies algo en `www/`, ejecuta `npx cap sync`.

## Convertirla en app de PC con Tauri

Necesitas Node.js, [Rust](https://www.rust-lang.org/tools/install) y los [requisitos de Tauri](https://tauri.app/start/prerequisites/) para tu sistema.

```bash
npm init -y
npm install -D @tauri-apps/cli
npx tauri init
```

Cuando pregunte por la ubicación de los archivos web (relativa a `src-tauri`), responde `../www`, y deja vacíos los comandos de desarrollo y de build.

Después revisa `src-tauri/tauri.conf.json` para que el apartado `build` quede así (sin `devUrl`, para que use los archivos de `www/` directamente):

```json
"build": {
  "frontendDist": "../www"
}
```

Luego:

```bash
npx tauri dev
npx tauri build
```

El instalador aparece en `src-tauri/target/release/bundle/`.

## Futuras implementaciones

Ahora mismo KizuNaka no necesita servidor: todo funciona en el navegador y el progreso se guarda en el propio dispositivo. Solo haría falta un backend para añadir cosas como:

- **Cuentas de usuario** y sincronizar el progreso entre el móvil y el PC.
- **Ranking global** del juego diario para competir con otros jugadores.
- **Historial o favoritos en la nube.**

Para eso no haría falta montar un servidor propio: se podría usar [Firebase](https://firebase.google.com) o [Supabase](https://supabase.com), que tienen plan gratuito y se conectan directamente desde JavaScript. Más adelante, el backend también podría hacerse a medida en PHP.

## Créditos de datos

- Datos de anime y manga: [AniList](https://anilist.co) (API GraphQL).
- Búsqueda por imagen: [trace.moe](https://trace.moe).

## Autor y licencia

KizuNaka es un proyecto creado por **[peter1323](https://github.com/peter1323)**, su único autor.

© 2026 peter1323. Todos los derechos reservados. Puedes ver el código y usar la app, pero para modificarla, redistribuirla o publicarla hace falta pedir permiso al autor. Consulta el archivo [LICENSE](LICENSE).
