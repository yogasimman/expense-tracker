# PostgreSQL Setup Instructions

## Password Authentication Error Fix

If you're getting "password authentication failed for user 'postgres'", follow these steps:

### Option 1: Reset PostgreSQL Password

1. Open PowerShell as Administrator

2. Switch to the postgres user and reset password:
```powershell
# Find PostgreSQL bin directory (usually)
cd "C:\Program Files\PostgreSQL\<version>\bin"

# Connect to PostgreSQL
.\psql.exe -U postgres

# If that works, you can reset the password:
ALTER USER postgres WITH PASSWORD 'postgres';
```

### Option 2: Configure pg_hba.conf for Trust Authentication (Temporary)

1. Find your PostgreSQL data directory (usually `C:\Program Files\PostgreSQL\<version>\data`)

2. Open `pg_hba.conf` in a text editor (as Administrator)

3. Find lines that look like:
```
# IPv4 local connections:
host    all             all             127.0.0.1/32            scram-sha-256
```

4. Change `scram-sha-256` to `trust` temporarily:
```
# IPv4 local connections:
host    all             all             127.0.0.1/32            trust
```

5. Restart PostgreSQL service:
```powershell
# In PowerShell as Administrator
Restart-Service postgresql-x64-<version>
```

6. Now you can connect without a password and set one:
```powershell
psql -U postgres -d postgres
ALTER USER postgres WITH PASSWORD 'postgres';
```

7. Change `pg_hba.conf` back to `scram-sha-256` and restart the service

### Option 3: Use Different Credentials

If you have different credentials for your PostgreSQL installation, update the files:

**config/database.js** and **database/setup.js**:
```javascript
const dbConfig = {
    user: 'your_username',      // Change this
    password: 'your_password',  // Change this
    host: 'localhost',
    port: 5432,
    database: 'postgres'
};
```

## Manual Database Setup

If the automated script doesn't work, you can set up the database manually:

### 1. Connect to PostgreSQL
```powershell
psql -U postgres
```

### 2. Create the database
```sql
CREATE DATABASE expense_tracker;
```

### 3. Connect to the new database
```sql
\c expense_tracker
```

### 4. Run the schema file
```sql
\i 'C:/Users/Yogasimman/Documents/Old_Projects/expense-tracker/database/schema.sql'
```

OR copy the contents of schema.sql and paste them into the psql prompt.

### 5. Verify tables were created
```sql
\dt
```

You should see tables like:
- users
- categories
- trips
- expenses
- etc.

## Quick Test After Setup

After setting up the database, test the connection:

```bash
node -e "const {pool} = require('./config/database'); pool.query('SELECT NOW()', (err, res) => { if(err) console.error(err); else console.log('Connected:', res.rows[0]); pool.end(); })"
```

## Common Issues

### Issue: Permission Denied
**Solution**: Run PowerShell or Command Prompt as Administrator

### Issue: PostgreSQL Service Not Running
**Solution**: 
```powershell
Start-Service postgresql-x64-<version>
```

### Issue: Can't Find psql Command
**Solution**: Add PostgreSQL bin directory to PATH or use full path:
```powershell
& "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres
```

## Next Steps

Once the database is set up successfully:

1. Run the setup script again:
```bash
node database/setup.js
```

2. Start the application:
```bash
npm start
```

3. Check that it connects successfully (you should see "PostgreSQL connected successfully" in the console)
