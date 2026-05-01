const express = require('express');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Set your Google Sheet CSV URL as an env var: SHEET_URL
const SHEET_URL = process.env.SHEET_URL || '';

app.use(express.static(path.join(__dirname, 'public')));

// Proxy endpoint so we avoid CORS issues fetching the sheet from the browser
app.get('/api/data', async (req, res) => {
  if (!SHEET_URL) {
    return res.status(500).json({ error: 'SHEET_URL environment variable not set' });
  }
  try {
    const response = await fetch(SHEET_URL);
    if (!response.ok) throw new Error(`Sheet fetch failed: ${response.status}`);
    const csv = await response.text();
    if (csv.trim().startsWith('<') || csv.includes('<!DOCTYPE')) {
      return res.status(500).json({ error: 'SHEET_URL returned an HTML page, not CSV. Use the export URL: https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/export?format=csv&gid=0' });
    }
    res.set('Content-Type', 'text/plain');
    res.send(csv);
  } catch (err) {
    console.error('Error fetching sheet:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Debug endpoint — shows raw first 5 rows of the sheet
app.get('/api/debug', async (req, res) => {
  if (!SHEET_URL) return res.json({ error: 'SHEET_URL not set' });
  try {
    const response = await fetch(SHEET_URL);
    const text = await response.text();
    const lines = text.trim().split('\n').slice(0, 6);
    res.json({ lines });
  } catch (e) {
    res.json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`Leaderboard running on http://localhost:${PORT}`);
  if (!SHEET_URL) {
    console.warn('⚠  SHEET_URL not set — add it as an environment variable');
  }
});
