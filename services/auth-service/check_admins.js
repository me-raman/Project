const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const User = require('./models/User');

async function checkAdmins() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const admins = await User.find({ role: 'Admin' });
        if (admins.length > 0) {
            console.log('Admin Users found:');
            admins.forEach(admin => {
                console.log(`- Username: ${admin.username}, Email: ${admin.email}, Role: ${admin.role}`);
            });
        } else {
            console.log('No Admin users found in the database.');
        }

        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

checkAdmins();
