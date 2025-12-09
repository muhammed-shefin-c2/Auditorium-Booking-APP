import dotenv from 'dotenv';
import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';

import convention from './routes/convention.js';
import event from './routes/event.js';

// Load environment variables (local only)
dotenv.config({ path: './config/config.env' });

// Environment variables
const PORT = process.env.PORT || 3130;
const DB_CONN_STRING = process.env.MONGODB_URI; // ✅ Correct variable name for Render

const app = express();

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use(cors({ origin: "*" }));

// MongoDB Connection
mongoose.connect(DB_CONN_STRING, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("Database connected successfully"))
  .catch((error) => console.log("DB Error:", error));

// Routes
app.use('/api/v1/Convention', convention);
app.use('/api/v1/Event', event);

// Start Server
app.listen(PORT, () => {
  console.log(`Server started at port: ${PORT}`);
});
