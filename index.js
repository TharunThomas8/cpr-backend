// ajith
// OYgO3wM0Op2kACKq

const express = require('express');
const app = express();
const port = 5000;
const router = require('./routes/data');
const mongoose = require('mongoose');

// Middleware
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb+srv://ajitht:OYgO3wM0Op2kACKq@cluster0.9l7kqct.mongodb.net/', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });

// Routes
app.use('/', router);

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
