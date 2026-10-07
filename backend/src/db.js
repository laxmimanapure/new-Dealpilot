const path = require('path');
const dotenv = require('dotenv');

// Ensure environment variables are loaded regardless of current working directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const mongoose = require('mongoose');
const dns = require('dns');

async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('❌ MONGODB_URI environment variable is missing!');
    console.error('   Please configure process.env.MONGODB_URI in backend/.env');
    process.exit(1);
  }

  const options = {
    serverSelectionTimeoutMS: 8000,
    dbName: 'dealpilot'
  };

  // Extract custom dbName if specified in URI path
  try {
    const cleanUri = uri.replace('mongodb+srv://', 'http://').replace('mongodb://', 'http://');
    const parsedUrl = new URL(cleanUri);
    const pathDb = parsedUrl.pathname.replace(/^\//, '');
    if (pathDb) {
      options.dbName = pathDb;
    }
  } catch (e) {
    options.dbName = 'dealpilot';
  }

  try {
    mongoose.set('strictQuery', false);
    console.log(`🍃 Connecting to MongoDB Atlas using process.env.MONGODB_URI...`);
    const conn = await mongoose.connect(uri, options);
    console.log(`===================================================`);
    console.log(`✅ MongoDB connected successfully`);
    console.log(`   Connected database name: ${conn.connection.name}`);
    console.log(`   Host: ${conn.connection.host}`);
    console.log(`===================================================`);
    return conn;
  } catch (err) {
    // If standard SRV lookup fails (common on Windows DNS), resolve SRV hosts dynamically and connect
    if (err.message.includes('querySrv') || err.message.includes('ECONNREFUSED') || uri.startsWith('mongodb+srv://')) {
      console.log(`⚠️ Standard SRV DNS lookup failed (${err.message}). Resolving cluster nodes dynamically...`);
      try {
        const match = uri.match(/mongodb\+srv:\/\/([^:]+):([^@]+)@([^\/\?]+)/);
        if (match) {
          const user = match[1];
          const pass = match[2];
          const clusterHost = match[3];

          dns.setServers(['8.8.8.8', '1.1.1.1']);
          const srvs = await new Promise((resolve, reject) => {
            dns.resolveSrv(`_mongodb._tcp.${clusterHost}`, (dnsErr, addrs) => {
              if (dnsErr) reject(dnsErr);
              else resolve(addrs);
            });
          });

          const hosts = srvs.map(s => `${s.name}:${s.port}`).join(',');
          const seedlistUri = `mongodb://${user}:${pass}@${hosts}/${options.dbName}?ssl=true&authSource=admin&retryWrites=true&w=majority`;

          console.log(`🍃 Connecting to resolved cluster nodes...`);
          const conn = await mongoose.connect(seedlistUri, options);
          console.log(`===================================================`);
          console.log(`✅ MongoDB connected successfully`);
          console.log(`   Connected database name: ${conn.connection.name}`);
          console.log(`   Host: ${conn.connection.host}`);
          console.log(`===================================================`);
          return conn;
        }
      } catch (srvErr) {
        console.error('❌ Dynamic SRV resolution failed:', srvErr.message);
      }
    }

    console.error('❌ MongoDB connection failed:', err.message);
    if (err.message.includes('IP') || err.message.includes('whitelist') || err.message.includes('connect')) {
      console.error('💡 Hint: Please ensure your current IP address is whitelisted in MongoDB Atlas Network Access (0.0.0.0/0 for all IPs).');
    }
    process.exit(1);
  }
}

module.exports = {
  connectDB,
  mongoose
};

