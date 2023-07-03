// app.js
const express = require('express');
const app = express();
const router = require('./routes/data');
const connectDB = require('./db');
const errorHandler = require('./errorhandler');
const cors = require('cors');

require('dotenv').config();


// Middleware
const corsOptions = {
  origin: 'https://cpr-react.vercel.app', // Replace with your frontend's URL
};

app.use(cors(corsOptions));
// app.use(cors());
app.use(express.json());



// Connect to MongoDB
connectDB()
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });

// Routes
app.use('/', router);

// Error handling middleware
app.use(errorHandler);

app.listen(process.env.PORT, () => {
  console.log(`Server listening on port ${process.env.PORT}`);
});

module.exports = app;
