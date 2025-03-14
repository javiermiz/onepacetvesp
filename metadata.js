// metadata.js - Archivo de configuración para la información de metadatos
module.exports = {
  // Información general de la serie
  seriesInfo: {
    id: 'op',
    name: 'One Pace en Español',
    description:
      'One Piece editado sin relleno (One Pace) en Español. Esta versión elimina el relleno y sigue fielmente al manga.',
    releaseInfo: '2006-',
    genres: ['Anime', 'Acción', 'Aventura'],
    logo: 'https://www.pngall.com/wp-content/uploads/13/One-Piece-Logo-PNG-Photos.png',
    background: 'https://images2.alphacoders.com/735/thumb-1920-735707.jpg',
    poster: 'https://i.imgur.com/rJY12N7.png',
  },

  // Manifest del addon
  manifest: {
    id: 'org.javermiz.onepace.spanish',
    version: '1.0.0',
    name: 'One Pace en Español',
    description: 'One Piece editado sin relleno (One Pace) en Español',
  },

  // URLs de los posters para cada temporada/arco
  seasonPosters: [
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
  ],

  // Configuraciones de rutas
  paths: {
    inputFile: 'paste.txt',
    dataDir: 'data',
    srcDir: 'src',
    publicDir: 'public',
  },

  // Configuración de versiones
  versions: {
    // Incluir todos los tipos de versiones disponibles
    includeAll: true,
    // Tipos de versiones a procesar
    types: {
      subtitulado: {
        identifier: 'Subtitulos en español',
        tag: 'Es Sub',
        priority: 1, // Prioridad más alta para mostrar primero
      },
      doblaje: {
        identifier: 'Doblaje en español',
        tag: 'Es Dub',
        priority: 2,
      },
      extended: {
        identifier: 'Extended',
        tag: 'Extended',
        priority: 3,
      },
    },
  },
};
