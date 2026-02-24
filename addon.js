
const { addonBuilder, serveHTTP } = require('stremio-addon-sdk');
const manifest = require('./data/manifest.json');
const meta = require('./data/meta.json');
const streams = require('./data/streams.json');
const builder = new addonBuilder(manifest);
builder.defineCatalogHandler(({ type, id }) => {
  if (type === 'series' && id === 'one_pace_catalog') {
    return Promise.resolve({ metas: [{ id: "op", type: "series", name: "One Pace en Español", poster: meta.poster, posterShape: "regular", description: "One Piece editado sin relleno (One Pace) en Español. Esta versión elimina el relleno y sigue fielmente al manga." }] });
  }
  return Promise.resolve({ metas: [] });
});
builder.defineMetaHandler(({ type, id }) => {
  if (type === 'series' && id === 'op') return Promise.resolve({ meta });
  return Promise.resolve({ meta: null });
});
builder.defineStreamHandler(({ type, id }) => {
  if (streams[id]) return Promise.resolve({ streams: streams[id] });
  return Promise.resolve({ streams: [] });
});
const port = process.env.PORT || 7000;
serveHTTP(builder.getInterface(), { port });
console.log("Addon One Pace en Español corriendo en http://localhost:" + port);
