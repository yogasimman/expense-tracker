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
    employee_id: { type: String, required: true, unique: true }, // Primary key
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    mobile: { type: String, required: true },
    designation: { type: String, required: true },
    department: { type: String, required: true },
    role: { type: String, default: 'user' } // Optional, defaults to 'user'
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
                employee_id: 'EMP001',
                name: 'Admin User',
                email: 'admin@example.com',
                password: hashedAdminPassword,
                mobile: '1234567890',
                designation: 'Administrator',
                department: 'Management',
                role: 'admin',
            },
            {
                employee_id: 'EMP002',
                name: 'John Doe',
                email: 'user1@example.com',
                password: hashedUser1Password,
                mobile: '0987654321',
                designation: 'Employee',
                department: 'Finance',
                role: 'submitter',
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
