const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Health check root
app.get('/', (req, res) => {
    res.json({ status: 'OK', message: 'Ateric Tarot API is running' });
});

const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const authenticate = require('./middleware/auth');

app.use('/auth', require('./routes/auth'));
app.use('/services', authenticate, require('./routes/services'));
app.use('/customers', authenticate, require('./routes/customers'));
app.use('/orders', authenticate, require('./routes/orders'));
app.use('/statistics', authenticate, require('./routes/statistics'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Ateric Tarot API berjalan di port ${PORT}`);
});