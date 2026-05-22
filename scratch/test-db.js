const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

function getEnv(key) {
  const envPath = path.resolve(__dirname, '../.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split(/\r?\n/);
  for (const line of lines) {
    if (line.startsWith(`${key}=`)) {
      return line.slice(key.length + 1).trim();
    }
  }
  return null;
}

async function testConnection() {
  const uri = getEnv('MONGODB_URI');
  if (!uri) {
    console.error('❌ MONGODB_URI not found in .env.local');
    process.exit(1);
  }
  
  console.log('Testing connection to:', uri.replace(/:.+@/, ':****@'));
  
  try {
    await mongoose.connect(uri);
    console.log('✅ MongoDB connection successful!');
    process.exit(0);
  } catch (err) {
    console.error('❌ MongoDB connection failed:');
    console.error(err.message);
    process.exit(1);
  }
}

testConnection();
