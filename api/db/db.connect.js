const mongoose = require("mongoose");

console.log(process.env.MONGODB);
const mongoURI = process.env.MONGODB;

const initializeDatabase = async () => {
  try {
    const connection = mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    if (connection) {
      console.log("Connected Successfully");
    }
  } catch (error) {
    console.log("Connection Failed", error);
  }
};

module.exports = { initializeDatabase };
