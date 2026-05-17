const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Ateric Tarot API',
      version: '1.0.0',
      description: 'API untuk sistem pemesanan jasa tarot Ateric',
    },
    servers: [{ url: 'http://localhost:3000' }],
  },
  apis: ['./routes/*.js'],
};

module.exports = swaggerJsdoc(options);