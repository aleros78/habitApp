const { db } = require('../services/firebase');
const stripe = require('../services/stripe');

// Handler del webhook Stripe.
// DEVE ricevere il body grezzo (Buffer), quindi va montato con
// express.raw({ type: 'application/json' }) PRIMA di express.json() — vedi index.js.
// Imposta isPremium=true server-side quando il pagamento è confermato: il client
// non può falsificare questo stato.
async function stripeWebhook(req, res) {
  const signature = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const uid = session.client_reference_id || (session.metadata && session.metadata.uid);

    if (uid) {
      try {
        await db.collection('users').doc(uid).set({ isPremium: true }, { merge: true });
      } catch (error) {
        return res.status(500).send(`Errore aggiornamento utente: ${error.message}`);
      }
    }
  }

  res.json({ received: true });
}

module.exports = stripeWebhook;
