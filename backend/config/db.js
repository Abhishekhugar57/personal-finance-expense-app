const mongoose = require("mongoose");
const dns = require("dns");

// Some networks fail SRV lookups for mongodb+srv; public DNS is more reliable.
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const connectDb = async () => {
  require("dotenv").config();

  console.log(
    "Using DB:",
    process.env.MONGO_URI.includes("mongodb+srv") ? "Atlas" : "Local"
  );

  await mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
      console.log(" Connected to MongoDB Atlas");
      console.log(" Database name:", mongoose.connection.name);
      console.log(" Connection host:", mongoose.connection.host);
    })
    .catch((err) => {
      console.error(" MongoDB Atlas connection error:", err);
      process.exit(1);
    });
};
module.exports = connectDb;
