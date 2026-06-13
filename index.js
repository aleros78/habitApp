// index.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

const habitsRoutes = require('./routes/habits.js');
const authRoutes = require('./routes/auth.js');
const balanceRoutes = require('./routes/balance.js');
const notificationsRoutes = require('./routes/notifications.js');
const remindersRoutes = require('./routes/reminders.js');
const paymentsRoutes = require('./routes/payments.js');
const stripeWebhook = require('./routes/stripeWebhook.js');
const verifyToken = require('./middleware/auth.js');

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "https://habit-money-front.vercel.app",
  "http://localhost:5173",
  "http://localhost:4173"
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

// Webhook Stripe: necessita del body grezzo e va montato PRIMA di express.json().
// Non passa per verifyToken: l'autenticità è garantita dalla firma Stripe.
app.post('/stripe-webhook', express.raw({ type: 'application/json' }), stripeWebhook);

app.use(express.json());

// Route pubbliche (non richiedono autenticazione)
app.use(authRoutes);
// /send-reminders è protetta dal proprio secret (CRON_SECRET), non da verifyToken
app.use(remindersRoutes);

// Da qui in poi tutte le route richiedono un Firebase ID token valido
app.use(verifyToken);
app.use(habitsRoutes);
app.use(balanceRoutes);
app.use(notificationsRoutes);
app.use(paymentsRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server in esecuzione su http://localhost:${PORT}`);
});