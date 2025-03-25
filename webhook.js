const express = require('express');
const bodyParser = require('body-parser');
const { exec } = require('child_process');

const app = express();
app.use(bodyParser.json());

app.post('/deploy', (req, res) => {
  console.log('📩 Webhook ricevuto!');
  exec('/home/alessandro/deploy.sh', (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Errore: ${error.message}`);
      return res.status(500).send('Errore durante il deploy');
    }
    if (stderr) {
      console.error(`⚠️  Stderr: ${stderr}`);
    }
    console.log(`✅ Output: ${stdout}`);
    res.status(200).send('Deploy eseguito');
  });
});

const PORT = process.env.PORT_WEBHOOK || 4000; // o qualsiasi porta libera
app.listen(PORT, () => {
  console.log(`🚀 Webhook server attivo sulla porta ${PORT}`);
});
