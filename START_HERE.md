# 🎯 EASY SETUP GUIDE - START HERE!

## 📋 What You Need

You're getting a password error because the setup script doesn't know your PostgreSQL password.

## ⚡ FASTEST SOLUTION (3 Steps)

### Step 1: Run the Interactive Setup

This will ask you for your PostgreSQL password once:

```bash
node database/setup-interactive.js
```

**Enter when prompted:**
- Host: just press Enter (uses localhost)
- Port: just press Enter (uses 5432)
- Username: just press Enter (uses postgres)
- **Password: TYPE YOUR ACTUAL POSTGRES PASSWORD HERE**

### Step 2: Update Your Password in Code

Create a `.env` file:

```bash
copy .env.example .env
```

Open `.env` and change this line:
```
DB_PASSWORD=your_postgres_password_here
```

To:
```
DB_PASSWORD=YOUR_ACTUAL_PASSWORD
```

### Step 3: Start the Server

```bash
npm start
```

That's it! Open http://localhost:5000

---

## ❓ Don't Remember Your PostgreSQL Password?

### Quick Password Reset:

1. **Open PowerShell as Administrator**

2. **Run these commands:**

```powershell
# Stop PostgreSQL
Stop-Service postgresql-x64-18

# Find pg_hba.conf
notepad "C:\Program Files\PostgreSQL\18\data\pg_hba.conf"
```

3. **In Notepad, find this line:**
```
host    all             all             127.0.0.1/32            scram-sha-256
```

4. **Change to:**
```
host    all             all             127.0.0.1/32            trust
```

5. **Save and close Notepad**

6. **Start PostgreSQL:**
```powershell
Start-Service postgresql-x64-18
```

7. **Connect and reset password:**
```powershell
cd "C:\Program Files\PostgreSQL\18\bin"
.\psql.exe -U postgres -d postgres
```

8. **In psql, type:**
```sql
ALTER USER postgres WITH PASSWORD 'postgres';
\q
```

9. **Change pg_hba.conf back to `scram-sha-256`** (repeat step 2-5 but change back)

10. **Restart PostgreSQL:**
```powershell
Restart-Service postgresql-x64-18
```

11. **Now your password is "postgres"!** Go back to Step 1 above.

---

## 🎉 After Setup is Complete

Your console should show:
```
PostgreSQL connected successfully at: [time]
Server running on port 5000
```

Visit: **http://localhost:5000**

---

## 🆘 Still Having Issues?

### Test Your PostgreSQL Password First:

```bash
node -e "const {Client}=require('pg'); const c=new Client({user:'postgres',password:'YOUR_PASSWORD',host:'localhost',database:'postgres'}); c.connect().then(()=>{console.log('✅ Password works!'); c.end();}).catch(e=>console.error('❌ Wrong password'));"
```

Replace `YOUR_PASSWORD` with your actual password.

---

## 📱 Contact

If you need more help, check:
- `QUICK_START.md` - Detailed instructions
- `POSTGRESQL_SETUP.md` - PostgreSQL specific help
- `MIGRATION_SUMMARY.md` - What was changed

---

**TL;DR:**
1. Run: `node database/setup-interactive.js` and enter your password
2. Create `.env` file and add your password
3. Run: `npm start`
4. Open: http://localhost:5000
