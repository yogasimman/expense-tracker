const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/express-tracker', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Define the User Schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'user' }
});

const User = mongoose.model('User', userSchema);

// Function to create and save users
const createUsers = async () => {
    try {
        // Define plain-text passwords
        const adminPassword = 'adminpassword';
        const user1Password = 'userpassword';

        // Hash the passwords
        const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);
        const hashedUser1Password = await bcrypt.hash(user1Password, 10);

        // Create users
        const users = [
            {
                username: 'admin',
                email: 'admin@example.com',
                password: hashedAdminPassword,
                role: 'admin',
            },
            {
                username: 'user1',
                email: 'user1@example.com',
                password: hashedUser1Password,
                role: 'user',
            }
        ];

        // Insert users into MongoDB
        await User.insertMany(users);
        console.log('Users inserted successfully!');
    } catch (error) {
        console.error('Error inserting users:', error.message);
    } finally {
        // Close the database connection
        mongoose.connection.close();
    }
};

// Call the function to create users
createUsers();
