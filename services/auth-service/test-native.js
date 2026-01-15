const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const url = process.env.MONGODB_URI;

async function main() {
    const client = new MongoClient(url);
    try {
        console.log('Connecting to:', url.replace(/:([^@]+)@/, ':****@'));
        await client.connect();
        console.log('Native Driver Connected successfully!');
        const db = client.db('pharmatrace');
        const ping = await db.command({ ping: 1 });
        console.log('Ping result:', ping);
    } catch (err) {
        console.error('Native Driver Connection failed:', err);
    } finally {
        await client.close();
    }
}

main();
