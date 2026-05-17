const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/services', require('./routes/services'));
app.use('/customers', require('./routes/customers'));
app.use('/orders', require('./routes/orders'));
app.use('/statistics', require('./routes/statistics'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Ateric Tarot API berjalan di http://localhost:${PORT}`);
  console.log(`Dokumentasi Swagger: http://localhost:${PORT}/api-docs`);
});