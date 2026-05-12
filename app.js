// app.mjs
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import indexRouter from './routes/index.js'; // 1. Import your new router

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Tell Express to serve the images/CSS from the public folder
app.use(express.static(__dirname));

// 2. Mount your router! 
app.use('/', indexRouter);

// Start the server
app.listen(PORT, () => {
    console.log(`Registry server is running securely on http://localhost:${PORT}`);
});