require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const connectDB = require('./config/db');
const attachSocket = require('./services/socket');

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const projectRoutes = require('./routes/project');
const generateRoutes = require('./routes/generate');
const userRoutes = require('./routes/user')

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' },
});

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes)
app.use('/api/projects', projectRoutes);
app.use('/api/generate', generateRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Unexpected server error.' });
});

attachSocket(io);

const PORT = process.env.PORT || 4000;
const AI_PROVIDER = process.env.AI_PROVIDER
const OLLAMA_URL = process.env.OLLAMA_BASE_URL
const OLLAMA_MODEL = process.env.OLLAMA_MODEL
connectDB().then(() => {
  server.listen(PORT, () => 
    console.log(`[server] listening on port ${PORT}
    console.log("AI Provider:", ${AI_PROVIDER});
    console.log("Ollama URL:", ${OLLAMA_URL});
    console.log("Ollama Model:", ${OLLAMA_MODEL});
  `));
});