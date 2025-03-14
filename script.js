// generator.js
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const axios = require('axios');
const metadata = require('./metadata');

// Función principal
async function createOnePaceAddon() {
  try {
    // Crea la estructura de directorios
    const directories = [
      metadata.paths.dataDir,
      metadata.paths.srcDir,
      metadata.paths.publicDir,
    ];

    directories.forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      }
    });

    // Lee el HTML
    const htmlContent = fs.readFileSync(metadata.paths.inputFile, 'utf8');
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;

    // Extrae todos los arcos (que serán temporadas)
    const arcElements = document.querySelectorAll('div[role="listitem"][id]');

    // Guardar información general en archivos JSON
    fs.writeFileSync(
      path.join(metadata.paths.dataDir, 'series_info.json'),
      JSON.stringify(metadata.seriesInfo, null, 2),
      'utf8'
    );

    fs.writeFileSync(
      path.join(metadata.paths.dataDir, 'season_posters.json'),
      JSON.stringify(metadata.seasonPosters, null, 2),
      'utf8'
    );

    // Prepara arrays para almacenar los datos
    const videos = [];
    const streams = {};
    const seasons = [];

    // ID de temporada
    let seasonNumber = 1;
    let posterIndex = 0;

    // Procesa cada arco como una temporada
    for (const arcElement of arcElements) {
      const arcId = arcElement.id;
      const arcName = arcElement.querySelector('h2').textContent.trim();
      const notAvailable = arcElement.querySelector('p.italic.text-gray-400');

      // Obtiene el poster para esta temporada
      const poster =
        posterIndex < metadata.seasonPosters.length
          ? metadata.seasonPosters[posterIndex]
          : metadata.seriesInfo.logo;
      posterIndex++;

      // Añadir la temporada al listado con su nombre personalizado y poster
      seasons.push({
        id: seasonNumber.toString(),
        title: arcName,
        season: seasonNumber,
        poster: poster,
      });

      // Si no está disponible, saltamos este arco
      if (
        notAvailable &&
        notAvailable.textContent.includes('Not yet available')
      ) {
        console.log(`Arco no disponible: ${arcName}`);
        seasonNumber++; // Incrementamos igualmente para mantener el orden
        continue;
      }

      // Buscar todas las versiones disponibles
      const versionElements = arcElement.querySelectorAll('h3.flex.grow');
      let versionStreams = {}; // Para almacenar todas las versiones para cada episodio

      // Procesar todas las versiones disponibles
      for (const versionElement of versionElements) {
        const versionTitle = versionElement.textContent.trim();
        let versionType = '';
        let versionName = '';

        // Determinar tipo de versión
        if (versionTitle.includes('Subtitulos')) {
          versionType = 'subtitulado';
          versionName = metadata.versions.types.subtitulado.identifier;
        } else if (versionTitle.includes('Doblaje')) {
          versionType = 'doblaje';
          versionName = metadata.versions.types.doblaje.identifier;
        } else {
          continue; // Saltamos versiones desconocidas
        }

        // Verificar si es una versión extended
        const isExtended = versionTitle.includes('Extended');

        const linkElements = versionElement.parentElement.querySelectorAll(
          'a[href*="pixeldrain.com"]'
        );

        // Para cada episodio de la temporada
        // Elegimos el enlace de mayor calidad disponible (normalmente el último)
        if (linkElements.length > 0) {
          const linkElement = linkElements[linkElements.length - 1];
          const resolution = linkElement
            .querySelector('span.grow')
            .textContent.trim();
          const pixeldrainUrl = linkElement.href;
          const listId = pixeldrainUrl.split('/').pop();

          try {
            // Obtenemos los archivos de la lista de Pixeldrain
            const response = await axios.get(
              `https://pixeldrain.com/api/list/${listId}`
            );

            if (response.data && response.data.success && response.data.files) {
              // Procesar los archivos
              for (const file of response.data.files) {
                // Convertir URL para el stream
                const streamUrl = `https://cdn.pd10.workers.dev/api/file/${file.id}?download`;

                // Extraer número de episodio del nombre del archivo
                // Aquí podría necesitar una lógica más compleja
                let episodeNumber = 1; // Por defecto

                // Para simplificar, usamos el índice del archivo como episodio
                // Esto debería mejorarse para extraer el número real de episodio
                episodeNumber = response.data.files.indexOf(file) + 1;

                // Generar un ID único para el video
                const videoId = `op:${seasonNumber}:${episodeNumber}`;

                // Crear un stream para esta versión
                const streamObj = {
                  url: streamUrl,
                  title: versionName + (isExtended ? ' (Extended)' : ''),
                  name: `${resolution} ${
                    versionType === 'doblaje' ? 'Doblado' : 'Subtitulado'
                  }${isExtended ? ' Extended' : ''}`,
                };

                // Añadir a la lista de streams para este episodio
                if (!versionStreams[videoId]) {
                  versionStreams[videoId] = [];
                }
                versionStreams[videoId].push(streamObj);

                // Solo creamos el objeto de video una vez para cada episodio
                if (!streams[videoId]) {
                  // Crear un objeto de video
                  const video = {
                    id: videoId,
                    title: `${arcName} - Episodio ${episodeNumber}`,
                    season: seasonNumber,
                    episode: episodeNumber,
                    thumbnail: poster, // Usamos el mismo póster como thumbnail
                  };

                  // Añadir el video a la lista solo si no existe
                  if (!videos.find((v) => v.id === videoId)) {
                    videos.push(video);
                  }
                }
              }
            }
          } catch (error) {
            console.error(
              `Error al obtener archivos de Pixeldrain para ${arcName} (${versionName}):`,
              error.message
            );
          }
        }
      }

      // Ahora combinamos todos los streams para cada episodio
      for (const videoId in versionStreams) {
        streams[videoId] = versionStreams[videoId];
      }

      // Incrementar el número de temporada
      seasonNumber++;
    }

    // Ordenar videos por temporada y episodio
    videos.sort((a, b) => {
      if (a.season !== b.season) {
        return a.season - b.season;
      }
      return a.episode - b.episode;
    });

    // Guardar datos en archivos JSON
    fs.writeFileSync(
      path.join(metadata.paths.dataDir, 'videos.json'),
      JSON.stringify(videos, null, 2),
      'utf8'
    );

    fs.writeFileSync(
      path.join(metadata.paths.dataDir, 'streams.json'),
      JSON.stringify(streams, null, 2),
      'utf8'
    );

    fs.writeFileSync(
      path.join(metadata.paths.dataDir, 'seasons.json'),
      JSON.stringify(seasons, null, 2),
      'utf8'
    );

    // Crear el manifest completo del addon
    const manifest = {
      ...metadata.manifest,
      logo: metadata.seriesInfo.logo,
      background: metadata.seriesInfo.background,
      resources: ['catalog', 'meta', 'stream'],
      types: ['series'],
      catalogs: [
        {
          type: 'series',
          id: 'one_pace_catalog',
          name: metadata.manifest.name,
          extra: [{ name: 'search', isRequired: false }],
        },
      ],
    };

    // Crear el meta objeto para la serie principal
    const metaObj = {
      id: metadata.seriesInfo.id,
      type: 'series',
      name: metadata.seriesInfo.name,
      poster: metadata.seriesInfo.poster,
      background: metadata.seriesInfo.background,
      logo: metadata.seriesInfo.logo,
      description: metadata.seriesInfo.description,
      releaseInfo: metadata.seriesInfo.releaseInfo,
      genres: metadata.seriesInfo.genres,
      videos: videos,
      seasons: seasons,
    };

    // Guardar manifest y meta en archivos JSON
    fs.writeFileSync(
      path.join(metadata.paths.dataDir, 'manifest.json'),
      JSON.stringify(manifest, null, 2),
      'utf8'
    );

    fs.writeFileSync(
      path.join(metadata.paths.dataDir, 'meta.json'),
      JSON.stringify(metaObj, null, 2),
      'utf8'
    );

    // Generar archivo principal del addon
    const addonCode = `
const { addonBuilder, serveHTTP } = require('stremio-addon-sdk');
const fs = require('fs');
const path = require('path');

// Cargar datos desde archivos JSON
const manifest = require('./data/manifest.json');
const meta = require('./data/meta.json');
const streams = require('./data/streams.json');

// Crear el builder
const builder = new addonBuilder(manifest);

// Manejador de catálogo
builder.defineCatalogHandler(({ type, id }) => {
  if (type === 'series' && id === 'one_pace_catalog') {
    // Devolver solo una entrada para One Pace
    return Promise.resolve({
      metas: [{
        id: "${metadata.seriesInfo.id}",
        type: "series",
        name: "${metadata.seriesInfo.name}",
        poster: meta.poster,
        posterShape: "regular",
        description: "${metadata.seriesInfo.description}"
      }]
    });
  }
  
  return Promise.resolve({ metas: [] });
});

// Manejador de metadatos
builder.defineMetaHandler(({ type, id }) => {
  if (type === 'series' && id === '${metadata.seriesInfo.id}') {
    return Promise.resolve({ meta });
  }
  
  return Promise.resolve({ meta: null });
});

// Manejador de streams
builder.defineStreamHandler(({ type, id }) => {
  if (streams[id]) {
    return Promise.resolve({ streams: streams[id] });
  }
  
  return Promise.resolve({ streams: [] });
});

// Iniciar el servidor
serveHTTP(builder.getInterface(), { port: process.env.PORT || 7000 });
console.log("Addon ${metadata.manifest.name} corriendo en http://localhost:7000");
`;

    // Generar archivo de inicio
    fs.writeFileSync('addon.js', addonCode, 'utf8');

    // Crear package.json
    const packageJson = {
      name: 'one-pace-espanol-addon',
      version: metadata.manifest.version,
      description: metadata.manifest.description,
      main: 'addon.js',
      scripts: {
        start: 'node addon.js',
        build: 'node generator.js',
      },
      dependencies: {
        'stremio-addon-sdk': '^1.6.10',
        axios: '^0.21.1',
        jsdom: '^20.0.0',
      },
    };

    fs.writeFileSync(
      'package.json',
      JSON.stringify(packageJson, null, 2),
      'utf8'
    );

    // Guardar este mismo script como generator.js
    fs.copyFileSync(__filename, path.join(process.cwd(), 'generator.js'));

    console.log('\n=== Addon generado exitosamente ===');
    console.log('Estructura de archivos:');
    console.log('- addon.js - El archivo principal del addon');
    console.log('- generator.js - El script generador');
    console.log('- metadata.js - Configuración de metadatos y versiones');
    console.log('- package.json - Configuración del proyecto');
    console.log('- data/ - Directorio con los archivos JSON de datos');
    console.log('  - manifest.json - Manifiesto del addon');
    console.log('  - meta.json - Metadatos de la serie');
    console.log('  - seasons.json - Información de temporadas');
    console.log('  - videos.json - Información de videos');
    console.log(
      '  - streams.json - Enlaces de streaming (incluye todas las versiones)'
    );
    console.log('  - series_info.json - Información general de la serie');
    console.log('  - season_posters.json - Listado de posters por temporada');
    console.log('\nPara correr el addon:');
    console.log('1. Instala las dependencias: npm install');
    console.log('2. Inicia el addon: npm start');
    console.log('3. Instala en Stremio: http://localhost:7000/manifest.json');
    console.log('\nPara regenerar los datos:');
    console.log('1. Edita paste.txt con el nuevo contenido');
    console.log('2. Ejecuta: npm run build');
    console.log('\nPara modificar metadatos y configuración de versiones:');
    console.log('1. Edita metadata.js con la información que desees cambiar');
    console.log('2. Ejecuta: npm run build para regenerar los archivos');
  } catch (error) {
    console.error('Error al crear el addon:', error);
  }
}

// Si este script se ejecuta directamente (no es importado)
if (require.main === module) {
  createOnePaceAddon();
}

// Exportamos la función para poder usarla desde otros scripts
module.exports = { createOnePaceAddon };
