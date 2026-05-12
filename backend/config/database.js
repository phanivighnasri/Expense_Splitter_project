const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://shreyaegurla_db_user:shreya%403@shreya.ds8oerk.mongodb.net/expenseSplitter?retryWrites=true&w=majority');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;

