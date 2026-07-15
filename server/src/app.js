require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const connectDB = require('./config/db');
const attachSocket = require('./services/socket');

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/project');
const generateRoutes = require('./routes/generate');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' },
});

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/generate', generateRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Unexpected server error.' });
});

attachSocket(io);

const PORT = process.env.PORT || 4000;

connectDB().then(() => {
  server.listen(PORT, () => console.log(`[server] listening on port ${PORT}`));
});