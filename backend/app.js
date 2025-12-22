const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { connectDB } = require('./config/db');

const app = express();

/* middleware */
app.use(cors());
app.use(express.json());


/* routes API */
app.use('/api/account', require('./routes/account'));
app.use('/api/staff', require('./routes/staff'));
app.use('/api/guest', require('./routes/guest'));
app.use('/api/room', require('./routes/room'));
// app.use('/api/booking', require('./routes/booking'));

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  await connectDB();
  console.log(`🚀 Backend API running at http://localhost:${PORT}`);
});
