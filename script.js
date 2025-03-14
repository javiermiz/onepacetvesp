const fs = require('fs');
const { JSDOM } = require('jsdom');
const axios = require('axios');

// Función principal
async function createOnePaceAddon() {
  try {
    // Lee el HTML
    const htmlContent = fs.readFileSync('paste.txt', 'utf8');
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;

    // Extrae todos los arcos (que serán temporadas)
    const arcElements = document.querySelectorAll('div[role="listitem"][id]');

    // URLs directas para los posters de cada temporada
    // Convertimos los enlaces ImgBB a URLs directas
    const seasonPosters = [
      'https://i.ibb.co/rR1KzrvQ/image.jpg',
      'https://i.ibb.co/vxw4gf6V/image.jpg',
      'https://i.ibb.co/67jnWyZS/image.jpg',
      'https://i.ibb.co/pjhqZ9TN/image.jpg',
      'https://i.ibb.co/tPxxmYZZ/image.jpg',
      'https://i.ibb.co/PZfJw2Rd/image.jpg',
      'https://i.ibb.co/Nv8kkSQ/image.jpg',
      'https://i.ibb.co/d05QnvZL/image.jpg',
      'https://i.ibb.co/ZqZxpvM/image.jpg',
      'https://i.ibb.co/ZRz7SCQx/image.jpg',
      'https://i.ibb.co/bMM5XNTv/image.jpg',
      'https://i.ibb.co/3yS9G8fj/image.jpg',
      'https://i.ibb.co/1YcQWZfq/image.jpg',
      'https://i.ibb.co/gcqDTbG/image.jpg',
      'https://i.ibb.co/NgYsWqRp/image.jpg',
      'https://i.ibb.co/B5FyY2Gy/image.jpg',
      'https://i.ibb.co/Cy37xXP/image.jpg',
      'https://i.ibb.co/TM6kCPj6/image.jpg',
      'https://i.ibb.co/FpRkwk2/image.jpg',
      'https://i.ibb.co/KpF1DZWw/image.jpg',
      'https://i.ibb.co/Xf2VJcc5/image.jpg',
      'https://i.ibb.co/RkqN5pQd/image.jpg',
      'https://i.ibb.co/R4VWjrdT/image.jpg',
      'https://i.ibb.co/v4Mb1prx/image.jpg',
      'https://i.ibb.co/tp5yC7hk/image.jpg',
      'https://i.ibb.co/DPShkxFp/image.jpg',
      'https://i.ibb.co/MyygdKZw/image.jpg',
      'https://i.ibb.co/svjPFcdg/image.jpg',
      'https://i.ibb.co/zhnrr03N/image.jpg',
      'https://i.ibb.co/yFQ5TbKD/image.jpg',
      'https://i.ibb.co/nNT9v6r7/image.jpg',
      'https://i.ibb.co/NdBCsSZs/image.jpg',
      'https://i.ibb.co/5WXWjmHy/image.jpg',
      'https://i.ibb.co/9HbDyLzj/image.jpg',
      'https://i.ibb.co/m5xNXTz8/image.jpg',
      'https://i.ibb.co/fYKHXNbt/image.jpg',
    ];

    // Logo y fondo para la serie

    const seriesLogo =
      'https://www.pngall.com/wp-content/uploads/13/One-Piece-Logo-PNG-Photos.png';
    const seriesBackground =
      'https://images2.alphacoders.com/735/thumb-1920-735707.jpg';
    const seriesPoster = 'https://i.imgur.com/rJY12N7.png';

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
        posterIndex < seasonPosters.length
          ? seasonPosters[posterIndex]
          : seriesLogo;
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

      // Buscar versiones con subtítulos en español (ignorar doblajes)
      const versionElements = arcElement.querySelectorAll('h3.flex.grow');
      let subtitleVersion = null;

      for (const versionElement of versionElements) {
        // Buscar solo versiones con subtítulos (no doblaje)
        if (!versionElement.textContent.includes('Doblaje')) {
          subtitleVersion = versionElement;
          break;
        }
      }

      if (subtitleVersion) {
        const linkElements = subtitleVersion.parentElement.querySelectorAll(
          'a[href*="pixeldrain.com"]'
        );

        // Para cada episodio de la temporada
        let episodeNumber = 1;

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
                // Solo procesar archivos con subtítulos en español
                if (
                  file.name.includes('[Es Sub]') ||
                  !file.name.includes('[Es')
                ) {
                  // Generar un ID único para el video
                  const videoId = `op:${seasonNumber}:${episodeNumber}`;

                  // Crear un objeto de video
                  const video = {
                    id: videoId,
                    title: `${arcName} - Episodio ${episodeNumber}`,
                    released: new Date().toISOString(),
                    season: seasonNumber,
                    episode: episodeNumber,
                    thumbnail: poster, // Usamos el mismo póster como thumbnail
                  };

                  // Añadir el video a la lista
                  videos.push(video);

                  // Convertir URL para el stream
                  const streamUrl = `https://cdn.pd10.workers.dev/api/file/${file.id}?download`;

                  // Generar el stream para este video
                  streams[videoId] = [
                    {
                      url: streamUrl,
                      title: 'One Pace Español',
                      name: `${resolution} Subtitulado`,
                    },
                  ];

                  // Incrementar el contador de episodios
                  episodeNumber++;
                }
              }
            }
          } catch (error) {
            console.error(
              `Error al obtener archivos de Pixeldrain para ${arcName}:`,
              error.message
            );
          }
        }
      }

      // Incrementar el número de temporada
      seasonNumber++;
    }

    // Manifest
    const manifest = {
      id: 'org.javermiz.onepace.spanish',
      version: '1.0.0',
      name: 'One Pace en Español',
      description: 'One Piece editado sin relleno (One Pace) en Español',
      logo: seriesLogo,
      background: seriesBackground,
      resources: ['catalog', 'meta', 'stream'],
      types: ['series'],
      catalogs: [
        {
          type: 'series',
          id: 'one_pace_catalog',
          name: 'One Pace en Español',
          extra: [{ name: 'search', isRequired: false }],
        },
      ],
    };

    // Crear el meta objeto para la serie principal con nombres de temporadas personalizados
    const metaObj = {
      id: 'op',
      type: 'series',
      name: 'One Pace en Español',
      poster: seriesPoster,
      background: seriesBackground,
      logo: seriesLogo,
      description:
        'One Piece editado sin relleno (One Pace) en Español. Esta versión elimina el relleno y sigue fielmente al manga.',
      releaseInfo: '2006-',
      genres: ['Anime', 'Acción', 'Aventura'],
      videos: videos,
      seasons: seasons,
    };

    // Generar el código del addon
    const addonCode = `
const { addonBuilder, serveHTTP } = require('stremio-addon-sdk');

// Definiciones del addon
const manifest = ${JSON.stringify(manifest, null, 2)};

// Metadatos de la serie
const meta = ${JSON.stringify(metaObj, null, 2)};

// Mapeo de streams por ID de video
const streams = ${JSON.stringify(streams, null, 2)};

// Crear el builder
const builder = new addonBuilder(manifest);

// Manejador de catálogo
builder.defineCatalogHandler(({ type, id }) => {
  if (type === 'series' && id === 'one_pace_catalog') {
    // Devolver solo una entrada para One Pace
    return Promise.resolve({
      metas: [{
        id: "op",
        type: "series",
        name: "One Pace en Español",
        poster: "${seriesPoster}",
        posterShape: "regular",
        description: "One Piece editado sin relleno (One Pace) en Español"
      }]
    });
  }
  
  return Promise.resolve({ metas: [] });
});

// Manejador de metadatos
builder.defineMetaHandler(({ type, id }) => {
  if (type === 'series' && id === 'op') {
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
console.log("Addon One Pace en Español corriendo en http://localhost:7000");
`;

    // Guardar el addon
    fs.writeFileSync('addon.js', addonCode, 'utf8');

    // Crear package.json
    const packageJson = {
      name: 'one-pace-espanol-addon',
      version: '1.0.0',
      description: 'Addon de Stremio para One Pace en Español',
      main: 'addon.js',
      scripts: {
        start: 'node addon.js',
      },
      dependencies: {
        'stremio-addon-sdk': '^1.6.10',
        axios: '^0.21.1',
      },
    };

    fs.writeFileSync(
      'package.json',
      JSON.stringify(packageJson, null, 2),
      'utf8'
    );

    console.log('\n=== Addon generado exitosamente ===');
    console.log('Para correr el addon:');
    console.log('1. Instala las dependencias: npm install');
    console.log('2. Inicia el addon: npm start');
    console.log('3. Instala en Stremio: http://localhost:7000/manifest.json');
  } catch (error) {
    console.error('Error al crear el addon:', error);
  }
}

// Ejecutar la función principal
createOnePaceAddon();
