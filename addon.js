
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
        id: "op",
        type: "series",
        name: "One Pace en Español",
        poster: meta.poster,
        posterShape: "regular",
        description: "One Piece editado sin relleno (One Pace) en Español. Esta versión elimina el relleno y sigue fielmente al manga."
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
