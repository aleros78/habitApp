// index.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

const habitsRoutes = require('./routes/habits.js');
const authRoutes = require('./routes/auth.js');
const balanceRoutes = require('./routes/balance.js');
const notificationsRoutes = require('./routes/notifications.js');

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "https://habit-money-front.vercel.app"
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Origin non consentito dal CORS"));
    }
  },
  methods: "GET,POST,PUT,DELETE",
  allowedHeaders: "Content-Type,Authorization"
}));

app.use(express.json());

app.use(authRoutes);
app.use(habitsRoutes);
app.use(balanceRoutes);
app.use(notificationsRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server in esecuzione su http://localhost:${PORT}`);
});