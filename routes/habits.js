const express = require('express');
const router = express.Router();
const { db, admin } = require('../services/firebase');

router.post('/habits', async (req, res) => {
  const { name, value } = req.body;
  try {
    const habitRef = await db.collection('habits').add({
      userId: req.uid,
      name,
      value,
      deleted: false,
      createdAt: admin.firestore.Timestamp.now(),
    });
    res.json({ id: habitRef.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/habits/:userId', async (req, res) => {
  try {
    const snapshot = await db.collection('habits')
      .where('userId', '==', req.uid)
      .where('deleted', '!=', true)
      .get();
    const habits = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(habits);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/habits/:habitId', async (req, res) => {
  const { habitId } = req.params;
  try {
    const habitRef = db.collection('habits').doc(habitId);
    const habitDoc = await habitRef.get();

    if (!habitDoc.exists || habitDoc.data().userId !== req.uid) {
      return res.status(404).json({ error: 'Abitudine non trovata' });
    }

    await habitRef.update({ deleted: true });
    res.json({ message: 'Abitudine cancellata logicamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/complete-habit', async (req, res) => {
  const { habitId } = req.body;
  try {
    // Il valore viene letto dall'abitudine sul DB, non dal client, per evitare manomissioni.
    const habitDoc = await db.collection('habits').doc(habitId).get();

    if (!habitDoc.exists || habitDoc.data().userId !== req.uid || habitDoc.data().deleted) {
      return res.status(404).json({ error: 'Abitudine non trovata' });
    }

    const value = habitDoc.data().value;

    const pendingRef = db.collection('pending_completions').doc(req.uid);
    await pendingRef.set({
      userId: req.uid,
      completions: admin.firestore.FieldValue.arrayUnion({
        habitId,
        value,
        completedAt: admin.firestore.Timestamp.now()
      })
    }, { merge: true });

    const userRef = db.collection('users').doc(req.uid);
    await userRef.set({ balance: admin.firestore.FieldValue.increment(value) }, { merge: true });

    res.json({ message: 'Abitudine completata e aggiunta ai pending' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/history/:userId', async (req, res) => {
  try {
    const pendingRef = db.collection('pending_completions').doc(req.uid);
    const pendingDoc = await pendingRef.get();

    if (!pendingDoc.exists) {
      return res.json([]);
    }

    const completions = pendingDoc.data().completions || [];

    const enriched = [];

    for (const item of completions) {
      const habitDoc = await db.collection('habits').doc(item.habitId).get();
      const habitData = habitDoc.exists ? habitDoc.data() : null;

      enriched.push({
        habitId: item.habitId,
        habitName: habitData && !habitData.deleted ? habitData.name : 'Abitudine cancellata',
        value: item.value,
        completedAt: item.completedAt.toDate()
      });
    }

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/completed-history/:userId/:resetId', async (req, res) => {
  const { resetId } = req.params;

  try {
    const docRef = db.collection('completed_habits').doc(`${req.uid}_${resetId}`);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.json([]);
    }

    const data = doc.data();
    const completions = data.completions || [];

    const enriched = [];

    for (const item of completions) {
      const habitDoc = await db.collection('habits').doc(item.habitId).get();
      const habitData = habitDoc.exists ? habitDoc.data() : null;

      enriched.push({
        habitId: item.habitId,
        habitName: habitData && !habitData.deleted ? habitData.name : 'Abitudine cancellata',
        value: item.value,
        completedAt: item.completedAt.toDate()
      });
    }

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



module.exports = router;
