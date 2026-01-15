const mongoose = require('mongoose');
const User = require('./src/models/User');

const MONGO_URI = 'mongodb://localhost:27017/pharmatrace';

mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log('Connected to DB');
        try {
            const users = await User.find({});
            const grouped = users.reduce((acc, user) => {
                acc[user.role] = acc[user.role] || [];
                acc[user.role].push(user);
                return acc;
            }, {});

            console.log('\n--- REGISTERED USERS ---');
            for (const [role, userList] of Object.entries(grouped)) {
                console.log(`\n[${role.toUpperCase()}]`);
                userList.forEach(u => {
                    console.log(`- Name: ${u.username}`);
                    console.log(`  Company: ${u.companyName}`);
                    console.log(`  Phone: ${u.phoneNumber}`);
                    console.log(`  Location: ${u.location}`);
                });
            }
            console.log('\n------------------------\n');
        } catch (err) {
            console.error(err);
        } finally {
            mongoose.connection.close();
            process.exit(0);
        }
    })
    .catch(err => console.error(err));
