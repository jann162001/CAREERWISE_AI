# MongoDB Query Troubleshooting Guide

## Problem: Only 1 job showing in queries when you expect more

### Possible Causes:

1. **Jobs have wrong status** - Only jobs with `status: 'Active'` show to users
2. **Jobs weren't saved properly** - Save operation failed silently
3. **Database connection issue** - Connected to wrong database
4. **Pagination limiting results** - Default limit is 10 per page
5. **Multiple databases** - Jobs saved to different database than being queried

---

## Step 1: Check What's Actually in MongoDB

Run the diagnostic script:

```bash
node check-mongodb.js
```

This will show you:
- Total number of jobs in database
- Number of Active jobs
- Number of Draft/Closed jobs
- List of all jobs with titles and statuses
- Users, Profiles, and Admins count

**Look for:**
- "Total jobs: X" - This tells you how many jobs exist
- "Active jobs: X" - This tells you how many will show to users
- If total > active, some jobs have wrong status

---

## Step 2: Test the Debug Endpoint

Start your server:
```bash
node server.js
```

Then open browser and go to:
```
http://localhost:3000/api/jobs/debug/all
```

This will show:
```json
{
  "success": true,
  "totalJobs": 5,
  "activeJobs": 2,
  "allJobs": [...],
  "activeJobsList": [...]
}
```

**If you see more jobs in totalJobs than activeJobs:**
- Your jobs have wrong status (Draft, Closed, etc.)
- Need to update job status to "Active"

---

## Step 3: Check Server Logs

When you create a job, you should see:
```
Creating job with data: { jobTitle: '...', company: '...' }
✅ Job created successfully: { _id: '...', jobTitle: '...', status: 'Active' }
✅ Verification - Job exists in DB: YES
```

When you fetch jobs on dashboard:
```
📊 Fetching jobs with query: { status: 'Active' }
📊 Page: 1 Limit: 10 Skip: 0
📊 Query results: { foundJobs: 2, totalInDB: 2, page: 1, limit: 10 }
```

**If foundJobs is less than you expect:**
- Check the query filters
- Check job status in database
- Check if you're logged in (affects query)

---

## Common Issues and Fixes:

### Issue 1: Jobs Created with Wrong Status

**Problem:** Jobs saved as "Draft" instead of "Active"

**Fix:** When creating job in admin panel, make sure:
1. Status field is set to "Active"
2. Or default status in code is "Active"

**Update existing jobs:**
```javascript
// Run this in MongoDB Compass or shell
db.jobs.updateMany(
  { status: 'Draft' },
  { $set: { status: 'Active' } }
)
```

---

### Issue 2: Pagination Showing Only First Page

**Problem:** Dashboard only shows 10 jobs (first page)

**Fix:** The `/all` endpoint uses pagination with default `limit=10`

**Two solutions:**

1. **Remove pagination for dashboard (get ALL jobs):**
   Dashboard should call: `http://localhost:3000/api/jobs/all?limit=100`

2. **Or create a separate non-paginated endpoint:**
   (Already done - use `/debug/all`)

---

### Issue 3: Multiple Databases

**Problem:** Jobs saved to different database than being queried

**Check your .env file:**
```
MONGODB_URI=mongodb://localhost:27017/authdb
```

**Make sure:**
- Database name is correct (e.g., "authdb")
- All operations use same MONGODB_URI
- Not switching between local and cloud databases

---

### Issue 4: Jobs Not Being Saved

**Problem:** Job creation returns success but job not in DB

**Check server logs for:**
```
✅ Job created successfully: { _id: '...', ... }
✅ Verification - Job exists in DB: YES
```

**If verification says "NO":**
- Database connection issue
- Transaction not committing
- Mongoose model issue

---

## Quick Fixes:

### Fix 1: Update All Draft Jobs to Active

Create file `fix-job-status.js`:

```javascript
require('dotenv').config();
const mongoose = require('mongoose');
const Job = require('./src/models/Job');

async function fixJobStatus() {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/authdb');
    
    const result = await Job.updateMany(
        { status: { $ne: 'Active' } },
        { $set: { status: 'Active' } }
    );
    
    console.log(`Updated ${result.modifiedCount} jobs to Active status`);
    
    const activeCount = await Job.countDocuments({ status: 'Active' });
    console.log(`Total active jobs now: ${activeCount}`);
    
    await mongoose.connection.close();
}

fixJobStatus();
```

Run: `node fix-job-status.js`

---

### Fix 2: Increase Pagination Limit in Dashboard

Update Dashboard.js:

```javascript
const fetchJobs = async () => {
  setLoadingJobs(true);
  try {
    // Change limit to 100 or remove limit
    const response = await fetch('http://localhost:3000/api/jobs/all?limit=100', {
      credentials: 'include'
    });
    const data = await response.json();
    
    if (data.success) {
      setJobs(data.jobs);
      console.log('📊 Loaded jobs:', data.jobs.length);
    }
  } catch (error) {
    console.error('Error fetching jobs:', error);
  } finally {
    setLoadingJobs(false);
  }
};
```

---

### Fix 3: Create Non-Paginated Endpoint

Add to `src/routes/jobs.js`:

```javascript
// Get all jobs without pagination (for dashboard)
router.get('/all-no-pagination', async (req, res) => {
    try {
        const query = req.session.adminId ? {} : { status: 'Active' };
        
        const jobs = await Job.find(query)
            .sort({ createdAt: -1 })
            .populate('postedBy', 'fullName username');

        console.log('📊 All jobs (no pagination):', jobs.length);

        res.json({ 
            success: true, 
            jobs,
            total: jobs.length
        });
    } catch (error) {
        console.error('Get all jobs error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching jobs',
            error: error.message 
        });
    }
});
```

Then update Dashboard to use: `/api/jobs/all-no-pagination`

---

## Testing Checklist:

1. ✅ Run `node check-mongodb.js` to see database contents
2. ✅ Check browser at `http://localhost:3000/api/jobs/debug/all`
3. ✅ Check server console logs when creating jobs
4. ✅ Check server console logs when fetching jobs on dashboard
5. ✅ Verify job status is "Active" in database
6. ✅ Check if pagination limit is too low
7. ✅ Verify MONGODB_URI is correct
8. ✅ Make sure all jobs have `status: 'Active'`

---

## What to Look For in Logs:

**When creating job (should see):**
```
Creating job with data: { ... }
✅ Job created successfully: { _id: '...', jobTitle: '...', company: '...', status: 'Active' }
✅ Verification - Job exists in DB: YES
```

**When loading dashboard (should see):**
```
📊 Fetching jobs with query: { status: 'Active' }
📊 Page: 1 Limit: 10 Skip: 0
📊 Query results: { foundJobs: 5, totalInDB: 5, page: 1, limit: 10 }
```

**When clicking Job Matches (should see):**
```
✅ Profile found: { fullName: '...', skills: 10, ... }
📋 Active jobs found: 5
🎯 Job: "Software Developer" - Match Score: 75.50%
🎯 Job: "Frontend Developer" - Match Score: 68.20%
✨ Total matches above threshold: 2
📦 Fetched matches response: { success: true, matches: [...], totalMatches: 2 }
```

---

## If Still Not Working:

1. **Check MongoDB Compass** - Install and connect to see actual database
2. **Check for errors** in server console
3. **Clear database and start fresh** - Drop collections and recreate
4. **Verify admin is logged in** when creating jobs
5. **Check network tab** in browser DevTools for API responses

---

## MongoDB Compass Instructions:

1. Download MongoDB Compass: https://www.mongodb.com/products/compass
2. Connect to: `mongodb://localhost:27017`
3. Select database: `authdb` (or your database name)
4. Click on `jobs` collection
5. You'll see all jobs with all fields
6. Check:
   - How many documents exist
   - What their `status` field contains
   - If they have all required fields

---

Need help? Check the console logs - they'll tell you exactly what's happening!
