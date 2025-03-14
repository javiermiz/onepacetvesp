# One Pace en Español - Stremio Addon

Un addon para Stremio que permite ver One Pace (versión editada de One Piece sin relleno) en español, tanto con subtítulos como con doblaje.

## Características

- Incluye todos los arcos disponibles de One Pace
- Ofrece múltiples opciones de calidad (480p, 720p, 1080p)
- Soporta tanto versiones subtituladas como dobladas
- Incluye versiones "Extended" cuando están disponibles
- Organizado por arcos/temporadas siguiendo la estructura oficial de One Pace
- Interfaz sencilla integrada con Stremio

## Instalación rápida

Instala el addon directamente en Stremio desde esta URL:

```
https://63929344cee7-onepacetvstremioesp.baby-beamup.club/manifest.json
```

## Requisitos (para desarrollo)

- [Node.js](https://nodejs.org/) (v12 o superior)
- [Stremio](https://www.stremio.com/) instalado en tu dispositivo

## Instalación local (para desarrollo)

1. Clona este repositorio:

   ```
   git clone https://github.com/tu-usuario/one-pace-espanol-addon.git
   cd one-pace-espanol-addon
   ```

2. Instala las dependencias:

   ```
   npm install
   ```

3. Inicia el addon:

   ```
   npm start
   ```

4. Abre Stremio e instala el addon desde:
   ```
   http://localhost:7000/manifest.json
   ```

## Configuración y Personalización

El archivo `metadata.js` contiene toda la configuración del addon. Puedes modificar:

- Información general (título, descripción, etc.)
- Posters y fondos
- Configuración de versiones

Para regenerar el addon después de hacer cambios:

```
npm run build
```

## Actualización de Contenido

Cuando se publiquen nuevos arcos de One Pace:

1. Visita [One Pace](https://onepace.net/) o la fuente de la que obtienes los enlaces
2. Copia el HTML de la página con los enlaces y guárdalo en `paste.txt`
3. Ejecuta:
   ```
   npm run build
   ```
4. Reinicia el addon:
   ```
   npm start
   ```

## Estructura del Proyecto

- `addon.js` - El archivo principal del addon
- `generator.js` - Script que genera el addon a partir del HTML
- `metadata.js` - Configuración de metadatos y versiones
- `package.json` - Configuración del proyecto
- `data/` - Directorio con los archivos JSON generados:
  - `manifest.json` - Manifiesto del addon
  - `meta.json` - Metadatos de la serie
  - `seasons.json` - Información de temporadas
  - `videos.json` - Información de videos
  - `streams.json` - Enlaces de streaming (incluye todas las versiones)
  - `series_info.json` - Información general de la serie
  - `season_posters.json` - Listado de posters por temporada

## Cómo Funciona

El addon funciona extrayendo información de enlaces de Pixeldrain que contienen los episodios de One Pace en español. El proceso es el siguiente:

1. El script `generator.js` lee el HTML guardado en `paste.txt` (que es una copia de la página de One Pace con los enlaces en el codigo fuente)
2. Extrae información sobre los arcos, episodios y versiones disponibles
3. Genera archivos JSON con toda la información estructurada
4. `addon.js` utiliza estos archivos para proporcionar el contenido a Stremio

## Limitaciones

- El addon depende de la disponibilidad de los enlaces de Pixeldrain
- Solo incluye arcos disponibles en español
- La detección automática de episodios podría requerir ajustes manuales en algunos casos

## Contribuir

Las contribuciones son bienvenidas:

1. Haz un fork del proyecto
2. Crea una rama para tu funcionalidad (`git checkout -b feature/nueva-funcionalidad`)
3. Realiza tus cambios y haz commit (`git commit -am 'Añade nueva funcionalidad'`)
4. Sube los cambios (`git push origin feature/nueva-funcionalidad`)
5. Crea un Pull Request

## Despliegue

Este addon está desplegado usando [Beamup](https://github.com/Stremio/stremio-beamup), un servicio gratuito para alojar addons de Stremio.

URL actual del despliegue:

```
https://63929344cee7-onepacetvstremioesp.baby-beamup.club/
```

## Notas Legales

Este addon no aloja ni distribuye contenido. Simplemente proporciona enlaces a contenido disponible públicamente. El uso de estos enlaces es responsabilidad del usuario.

## Créditos

- [One Pace](https://onepace.net/) - Por su increíble trabajo editando One Piece
- [Stremio](https://www.stremio.com/) - Por su plataforma
- [stremio-addon-sdk](https://github.com/Stremio/stremio-addon-sdk) - Por facilitar la creación de addons
- [BeamUp](https://github.com/Stremio/stremio-beamup) - Por el servicio de hosting gratuito

## Licencia

Este proyecto está licenciado bajo la Licencia MIT.
