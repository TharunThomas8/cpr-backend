const url = "mongodb+srv://ajitht:OYgO3wM0Op2kACKq@cluster0.9l7kqct.mongodb.net/";
const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = () => {
  return mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
};

module.exports = connectDB;
