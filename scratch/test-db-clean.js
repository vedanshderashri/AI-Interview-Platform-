const mongoose = require('mongoose');

async function testConnection() {
  const uri = "mongodb+srv://vedanshderashri8_db_user:E5IUm2tAteXlK12c@mockmatedb.wiklknn.mongodb.net/?appName=MockmateDB";
  console.log('Testing connection with cleaned password...');
  
  try {
    await mongoose.connect(uri);
    console.log('✅ MongoDB connection successful with cleaned password!');
    process.exit(0);
  } catch (err) {
    console.error('❌ MongoDB connection failed even with cleaned password:');
    console.error(err.message);
    process.exit(1);
  }
}

testConnection();
