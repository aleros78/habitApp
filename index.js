require('dotenv').config(); // Carica le variabili d'ambiente
const express = require('express');
const admin = require('firebase-admin');
const { initializeApp } = require('firebase/app');
const { getAuth } = require('firebase/auth');
const { getFirestore } = require('firebase/firestore');
const cors = require("cors");

// Configura Firebase Admin SDK per il backend
const serviceAccount = require(process.env.FIREBASE_CREDENTIALS_PATH);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Inizializza Firebase SDK (per client-side features come Auth)
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = admin.firestore();
const messaging = admin.messaging();

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL,
  methods: "GET,POST,PUT,DELETE",
  allowedHeaders: "Content-Type,Authorization"
}));

app.use(express.json());

/** ✅ API di autenticazione */
app.post('/register', async (req, res) => {
  const { email, password } = req.body;
  try {
    const userRecord = await admin.auth().createUser({
      email,
      password,
    });
    res.json({ uid: userRecord.uid, email: userRecord.email });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Firebase Admin SDK non supporta signInWithEmailAndPassword, bisogna usare il client-side per questo
    return res.status(400).json({ error: "Il login con email e password deve essere gestito dal frontend!" });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

/** ✅ API per gestire le abitudini */
app.post('/habits', async (req, res) => {
  const { userId, name, value } = req.body;
  try {
    const habitRef = await db.collection('habits').add({
      userId,
      name,
      value,
      createdAt: admin.firestore.Timestamp.now(),
    });
    res.json({ id: habitRef.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/habits/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const snapshot = await db.collection('habits').where('userId', '==', userId).get();
    const habits = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(habits);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/** ✅ API per il completamento delle abitudini */
app.post('/complete-habit', async (req, res) => {
  const { userId, habitId, value } = req.body;
  try {
    await db.collection('completed_habits').add({
      userId,
      habitId,
      value,
      completedAt: admin.firestore.Timestamp.now(),
    });

    const userRef = db.collection('users').doc(userId);
    await userRef.set({ balance: admin.firestore.FieldValue.increment(value) }, { merge: true });

    res.json({ message: 'Habit completed and balance updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/** ✅ API per inviare notifiche push */
app.post('/notifications', async (req, res) => {
  const { token, message } = req.body;

  const notification = {
    notification: {
      title: 'Reminder',
      body: message
    },
    token
  };

  try {
    await messaging.send(notification);
    res.json({ message: 'Notifica inviata con successo' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/** ✅ API per gestire il saldo */
app.post('/reset-balance', async (req, res) => {
  const { userId } = req.body;
  try {
    const userRef = db.collection('users').doc(userId);
    await userRef.update({ balance: 0 });
    res.json({ message: 'Saldo azzerato' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


/** ✅ API per recuperare il saldo */
app.get('/balance/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Utente non trovato' });
    }

    const data = userDoc.data();
    res.json({ balance: data.balance || 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/** ✅ API per gestire l’abbonamento Premium */
app.post('/subscribe', async (req, res) => {
  const { userId, isPremium } = req.body;
  try {
    const userRef = db.collection('users').doc(userId);
    await userRef.update({ isPremium });
    res.json({ message: 'Abbonamento aggiornato' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/** ✅ Avvia il server */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server in esecuzione su http://localhost:${PORT}`);
});
