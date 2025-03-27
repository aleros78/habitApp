const { v4: uuidv4 } = require('uuid');

/**
 * Genera un ID univoco per i reset (es: reset_<uuid>)
 */
function generateResetId() {
  return `reset_${uuidv4()}`;
}

/**
 * Verifica se un valore è un numero valido
 */
function isValidNumber(value) {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Formatta una timestamp Firestore in `YYYY-MM-DD HH:mm:ss`
 */
function formatTimestamp(timestamp) {
  if (!timestamp || !timestamp.toDate) return null;
  const date = timestamp.toDate();
  return date.toISOString().replace('T', ' ').substring(0, 19);
}

module.exports = {
  generateResetId,
  isValidNumber,
  formatTimestamp
};
