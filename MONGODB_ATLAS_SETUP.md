# MongoDB Atlas Cloud Setup Guide

## Why MongoDB Atlas over Supabase?

**MongoDB Atlas is the right choice for your project because:**
- ✅ You're already using MongoDB locally - zero code changes needed
- ✅ All your Mongoose models work as-is
- ✅ Simple connection string swap in .env file
- ✅ Free tier: 512MB storage, perfect for demos
- ✅ Automatic backups and scaling

**Supabase would require:**
- ❌ Complete rewrite from MongoDB to PostgreSQL
- ❌ Rewrite all Mongoose models to SQL schemas
- ❌ Change all queries from MongoDB to SQL
- ❌ Weeks of development time

## Step-by-Step Setup

### 1. Create MongoDB Atlas Account
1. Go to https://www.mongodb.com/cloud/atlas/register
2. Sign up with email (or Google/GitHub)
3. Choose **FREE** M0 tier
4. Select **AWS** as cloud provider
5. Choose region closest to you (e.g., **us-east-1** for East Coast)
6. Click "Create Cluster" (takes 3-5 minutes)

### 2. Create Database User
1. Click "Database Access" in left sidebar
2. Click "+ ADD NEW DATABASE USER"
3. **Authentication Method**: Password
4. **Username**: `meselectrical` (or your choice)
5. **Password**: Click "Autogenerate Secure Password" and **SAVE IT**
6. **Database User Privileges**: Read and write to any database
7. Click "Add User"

### 3. Whitelist IP Addresses
1. Click "Network Access" in left sidebar
2. Click "+ ADD IP ADDRESS"
3. Click "ALLOW ACCESS FROM ANYWHERE" (0.0.0.0/0)
   - This is safe for development/demo
   - For production, whitelist specific IPs
4. Click "Confirm"

### 4. Get Connection String
1. Click "Database" in left sidebar (or "Clusters")
2. Click "Connect" button on your cluster
3. Choose "Connect your application"
4. **Driver**: Node.js
5. **Version**: 5.5 or later
6. Copy the connection string, it looks like:
   ```
   mongodb+srv://meselectrical:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
7. Replace `<password>` with your actual database user password

### 5. Update Your .env File
```bash
# OLD (local):
MONGODB_URI=mongodb://localhost:27017/electrical-crm

# NEW (cloud):
MONGODB_URI=mongodb+srv://meselectrical:YOUR_ACTUAL_PASSWORD@cluster0.xxxxx.mongodb.net/electrical-crm?retryWrites=true&w=majority
```

**IMPORTANT**: Add `/electrical-crm` before the `?` to specify database name

### 6. Test Connection
```bash
cd backend
node -e "const mongoose = require('mongoose'); require('dotenv').config(); mongoose.connect(process.env.MONGODB_URI).then(() => console.log('✓ Connected to MongoDB Atlas!')).catch(err => console.error('✗ Error:', err.message));"
```

### 7. Migrate Data (Optional)
If you want to keep your local data:

```bash
# Export from local MongoDB
mongodump --db electrical-crm --out ./backup

# Import to Atlas (replace with your connection string)
mongorestore --uri="mongodb+srv://meselectrical:PASSWORD@cluster0.xxxxx.mongodb.net/electrical-crm" ./backup/electrical-crm
```

Or start fresh - just run your sample data scripts:
```bash
node createAdmin.js
node addSampleEmails.js
```

### 8. Restart Backend
```bash
# Kill current backend
pkill -f "node src/server.js"

# Start fresh
cd backend
npm start
```

### 9. Deploy Frontend to Vercel (Optional)
To share with clients:

1. Push code to GitHub
2. Go to https://vercel.com
3. Import your repository
4. Environment variables:
   - `VITE_API_URL`: Your backend URL (if deployed) or http://localhost:5001/api
5. Deploy!

## Security Best Practices

### For Production:
1. **Network Access**: Whitelist only specific IPs
2. **.env file**: Add to .gitignore (already done)
3. **Database User**: Use role-based access
4. **Connection String**: Never commit to git
5. **Enable Monitoring**: Set up Atlas alerts

## Troubleshooting

### Connection Error: "Authentication failed"
- Check username/password in connection string
- Ensure database user was created successfully

### Connection Error: "Timeout"
- Check Network Access whitelist
- Ensure "Allow Access from Anywhere" is enabled

### Database Empty After Migration
- Check database name in connection string (`/electrical-crm`)
- Run sample data scripts again

## Next Steps

1. Share the Vercel URL with your client
2. They can access from anywhere with login credentials
3. All data persists in cloud
4. You can access MongoDB Atlas dashboard to view/edit data directly
