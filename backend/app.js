const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { connectDB } = require('./config/db');
const auth = require("./middlewares/auth");
const app = express();

/* middleware */
app.use(cors());
app.use(express.json());


/* routes API */

app.use('/api/accounts', require('./routes/account'));
app.use('/api/staff', require('./routes/staff'));
app.use("/api/room", auth(), require("./routes/room"));
app.use('/api/login', require('./routes/login'));
app.use('/api/groups', require('./routes/group'));
app.use('/api/transactions', require('./routes/transaction'));
app.use('/api/booking', require('./routes/booking'));

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  await connectDB();
  console.log(`🚀 Backend API running at http://localhost:${PORT}`);
});
