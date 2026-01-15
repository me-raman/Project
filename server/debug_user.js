const mongoose = require('mongoose');
const User = require('/Users/raman/Desktop/backend_project/src/models/User.js');
require('dotenv').config();

const checkUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pharmatrace');
        console.log('Connected to DB');

        const users = await User.find({});
        console.log(`Found ${users.length} users.`);
        users.forEach(u => {
            console.log(`- Phone: ${u.phoneNumber}, Role: '${u.role}', Name: ${u.companyName}`);
        });

        const target = users.find(u => u.phoneNumber === '1234567899');
        if (target) {
            console.log('TARGET MATCHED!');
            console.log('Role Check:', target.role === 'Manufacturer');
        } else {
            console.log('Target 1234567899 NOT FOUND');
        }

        await mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkUser();
