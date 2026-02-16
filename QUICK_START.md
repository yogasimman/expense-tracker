# 🚀 Quick Start Guide - PostgreSQL Setup

## ⚠️ Current Issue: Password Authentication

You're getting a password authentication error because the default password "postgres" doesn't match your PostgreSQL installation.

## 🎯 Solution - Choose ONE of these methods:

---

### ✅ METHOD 1: Use the Interactive Setup (RECOMMENDED)

This will prompt you for your actual PostgreSQL password:

```bash
node database/setup-interactive.js
```

**Follow the prompts and enter:**
- Host: `localhost` (press Enter)
- Port: `5432` (press Enter)  
- Username: `postgres` (press Enter)
- Password: `[YOUR ACTUAL POSTGRES PASSWORD]`

---

### ✅ METHOD 2: Use the Batch Script (Windows)

Double-click or run:

```bash
database\setup.bat
```

This will:
1. Create the `expense_tracker` database
2. Create all tables
3. Prompt for your password when needed

---

### ✅ METHOD 3: Manual Setup with psql

1. **Open PowerShell as Administrator**

2. **Connect to PostgreSQL:**
```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres
# Enter your password when prompted
```

3. **Create the database:**
```sql
CREATE DATABASE expense_tracker;
```

4. **Connect to it:**
```sql
\c expense_tracker
```

5. **Run the schema file:**
```sql
\i 'C:/Users/Yogasimman/Documents/Old_Projects/expense-tracker/database/schema.sql'
```

6. **Verify tables created:**
```sql
\dt
```

You should see 13 tables listed.

7. **Exit psql:**
```sql
\q
```

---

### ✅ METHOD 4: Update Credentials in Code

If you know your PostgreSQL password, update these files:

**1. Create .env file:**
```bash
copy .env.example .env
```

**2. Edit .env and set your password:**
```
DB_PASSWORD=YOUR_ACTUAL_PASSWORD
```

**3. Install dotenv:**
```bash
npm install dotenv
```

**4. Update config/database.js** (beginning of file):
```javascript
require('dotenv').config();

const { Pool } = require('pg');

const dbConfig = {
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',  // This will use .env value
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'expense_tracker',
    // ... rest of config
```

**5. Run setup:**
```bash
node database/setup.js
```

---

## 🔍 How to Find Your PostgreSQL Password

### Option A: You Set It During Installation
- Check your installation notes or password manager
- It's the password you created when installing PostgreSQL

### Option B: Reset the Password

1. **Find pg_hba.conf:**
```
C:\Program Files\PostgreSQL\18\data\pg_hba.conf
```

2. **Edit as Administrator** and change this line:
```
# IPv4 local connections:
host    all             all             127.0.0.1/32            scram-sha-256
```

To:
```
host    all             all             127.0.0.1/32            trust
```

3. **Restart PostgreSQL service:**
```powershell
# In PowerShell as Administrator
Restart-Service postgresql-x64-18
```

4. **Connect without password and reset it:**
```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d postgres
```

```sql
ALTER USER postgres WITH PASSWORD 'postgres';
\q
```

5. **Change pg_hba.conf back to `scram-sha-256`**

6. **Restart the service again**

---

## ✅ After Database is Set Up

1. **Update your credentials** in `config/database.js` or `.env`

2. **Start the server:**
```bash
npm start
```

Or for development:
```bash
npm run run_dev
```

3. **Check the console** - you should see:
```
PostgreSQL connected successfully at: [timestamp]
Server running on port 5000
```

4. **Open your browser:**
```
http://localhost:5000
```

---

## 🆘 Still Having Issues?

### Test PostgreSQL Connection:
```bash
node -e "const {Client} = require('pg'); const c = new Client({user:'postgres',password:'YOUR_PASSWORD',host:'localhost',database:'postgres'}); c.connect().then(()=>{console.log('✅ Connected!'); c.end();}).catch(e=>console.error('❌', e.message));"
```

### Check PostgreSQL Service:
```powershell
Get-Service postgresql-x64-18
```

Should show "Running". If not:
```powershell
Start-Service postgresql-x64-18
```

### Check PostgreSQL Logs:
```
C:\Program Files\PostgreSQL\18\data\log\
```

---

## 📝 Summary

**You need to:**
1. Find or reset your PostgreSQL password
2. Run ONE of the setup methods above
3. Update credentials in code if needed
4. Start the server

**The easiest way is Method 1 (Interactive Setup)** - it will ask for your password and remember the rest!

```bash
node database/setup-interactive.js
```
