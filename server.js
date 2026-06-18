const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./config/db');  

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json({ status: 'OK', message: 'Ateric Tarot API is running' });
});

const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.post('/orders/public', async (req, res) => {
  const { name, email, phone, instagram, items } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [existing] = await conn.query('SELECT id FROM customers WHERE email = ?', [email]);
    let customer_id;
    if (existing.length > 0) {
      customer_id = existing[0].id;
    } else {
      const [result] = await conn.query(
        'INSERT INTO customers (name, email, phone, instagram) VALUES (?, ?, ?, ?)',
        [name, email, phone, instagram]
      );
      customer_id = result.insertId;
    }

    let total = 0;
    for (let item of items) {
      const [[service]] = await conn.query('SELECT price FROM services WHERE id = ?', [item.service_id]);
      if (!service) throw new Error(`Service id ${item.service_id} tidak ditemukan`);
      total += service.price * (item.quantity || 1);
    }

    const [orderResult] = await conn.query(
      'INSERT INTO orders (customer_id, total_amount) VALUES (?, ?)',
      [customer_id, total]
    );
    const orderId = orderResult.insertId;

    for (let item of items) {
      const [[service]] = await conn.query('SELECT price FROM services WHERE id = ?', [item.service_id]);
      const subtotal = service.price * (item.quantity || 1);
      await conn.query(
        'INSERT INTO order_items (order_id, service_id, quantity, subtotal) VALUES (?, ?, ?, ?)',
        [orderId, item.service_id, item.quantity || 1, subtotal]
      );
    }

    await conn.commit();
    res.status(201).json({ order_id: orderId, total });
  } catch (err) {
    await conn.rollback();
    console.error('Public order error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});


app.use('/auth', require('./routes/auth'));

const authenticate = require('./middleware/auth');

app.use('/services', authenticate, require('./routes/services'));
app.use('/customers', authenticate, require('./routes/customers'));
app.use('/orders', authenticate, require('./routes/orders'));
app.use('/statistics', authenticate, require('./routes/statistics'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Ateric Tarot API berjalan di port ${PORT}`);
});