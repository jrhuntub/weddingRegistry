// routes/index.mjs
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

// ES Module fix for directory paths inside the router
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// GET: Show the Homepage (Index)
router.get('/', (req, res) => {
    // This tells Express to go up one folder (../), look in 'public', and send index.html
    res.sendFile(path.join(__dirname, '../views/index.html'));
});

router.get('/honeymoon', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/honeymoon.html'));
});

export default router;