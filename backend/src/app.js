const express = require('express');
const authRoutes = require('./routes/auth.routes');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

app.use('/auth', authRoutes);

app.get('/secure', require('./middlewares/auth.middleware'), (req, res) => {
  res.json({
    message: 'Secure data',
    user: req.user,
  });
});

module.exports = app;
