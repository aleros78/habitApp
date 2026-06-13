require('dotenv').config();
const Stripe = require('stripe');

// Client Stripe condiviso. La chiave segreta è fornita via env (mai nel codice).
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = stripe;
