const express = require('express');
const router = express.Router();
const { db, admin } = require('../services/firebase');

router.get('/reset-balance/:userId', async (req, res) => {
  try {
    const userRef = db.collection('users').doc(req.uid);
    const userDoc = await userRef.get();
    const currentBalance = userDoc.exists ? userDoc.data().balance || 0 : 0;

    if (currentBalance === 0) {
      return res.json({ message: 'Saldo già azzerato' });
    }

    const pendingRef = db.collection('pending_completions').doc(req.uid);
    const pendingDoc = await pendingRef.get();
    const completions = pendingDoc.exists ? pendingDoc.data().completions : [];

    const resetDoc = await db.collection('balance_resets').add({
      userId: req.uid,
      amount: currentBalance,
      resetAt: admin.firestore.Timestamp.now()
    });

    await db.collection('completed_habits').doc(`${req.uid}_${resetDoc.id}`).set({
      userId: req.uid,
      resetId: resetDoc.id,
      from: completions.length > 0 ? completions[0].completedAt : null,
      to: completions.length > 0 ? completions[completions.length - 1].completedAt : null,
      completions
    });

    await userRef.set({ balance: 0 }, { merge: true });
    await pendingRef.delete();

    res.json({ message: 'Reset completato', oldBalance: currentBalance, resetId: resetDoc.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/balance/:userId', async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.uid).get();
    const data = userDoc.exists ? userDoc.data() : {};
    res.json({ balance: data.balance || 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/balance-history/:userId', async (req, res) => {
  try {
    const snapshot = await db.collection('balance_resets')
      .where('userId', '==', req.uid)
      .orderBy('resetAt', 'desc')
      .get();

    const history = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      resetAt: doc.data().resetAt.toDate()
    }));

    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
