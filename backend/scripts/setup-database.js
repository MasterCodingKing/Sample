require('dotenv').config();
const mysql = require('mysql2/promise');

async function setupDatabase() {
  try {
    console.log('Connecting to MySQL server...');
    
    // Connect without database selected
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });

    const dbName = process.env.DB_NAME || 'barangay_system';
    
    console.log(`Creating database: ${dbName}...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`✓ Database '${dbName}' is ready`);

    await connection.end();
    console.log('\nDatabase setup complete!');
    console.log('\nNext steps:');
    console.log('  npm run migrate   - Run database migrations');
    console.log('  npm run seed      - Seed initial data');
    console.log('  npm run dev       - Start development server');
    
  } catch (error) {
    console.error('Error setting up database:', error.message);
    process.exit(1);
  }
}

setupDatabase();
