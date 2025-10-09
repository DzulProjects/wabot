# 🔧 Coolify Database Connection Troubleshooting

## Issue: `getaddrinfo ENOTFOUND wabot-mysql`

This error means your WABOT application cannot find the MySQL service by hostname.

## ✅ Step-by-Step Fix

### 1. Check MySQL Service Name
1. Go to **Coolify Dashboard**
2. Navigate to your **MySQL service**
3. Check the **Service Name** (it might not be exactly `wabot-mysql`)
4. Copy the exact service name

### 2. Update Environment Variables
In your WABOT application environment variables in Coolify, update:

```bash
# Instead of:
DB_HOST=wabot-mysql

# Use the exact service name from step 1, for example:
DB_HOST=your-actual-mysql-service-name
# OR try the internal IP/hostname format:
DB_HOST=mysql-service-uuid
```

### 3. Alternative Hostname Formats to Try

Try these different hostname formats in your `DB_HOST` environment variable:

```bash
# Option 1: Service name only
DB_HOST=wabot-mysql

# Option 2: Service name with project suffix
DB_HOST=wabot-mysql-randomstring

# Option 3: Full internal hostname (check Coolify network tab)
DB_HOST=mysql-service.coolify-network

# Option 4: Container name (check Coolify containers)
DB_HOST=wabot-mysql-container-name
```

### 4. Verify Network Configuration
1. Both services should be on the **same Coolify network**
2. In Coolify dashboard, check both services are in the same project
3. Ensure MySQL service is **running and healthy**

### 5. Check MySQL Service Status
1. Go to MySQL service in Coolify
2. Verify it shows **"Running"** status
3. Check the **logs** for any MySQL errors
4. Ensure **port 3306** is accessible

### 6. Test Database Connection
Add this temporary environment variable to test:
```bash
# Add this to your WABOT environment variables for debugging
DB_DEBUG=true
```

Then check the logs for more detailed database connection information.

## 🧪 Quick Tests

### Test 1: Check if MySQL is accessible
In your WABOT application, you can run this command in Coolify's terminal (if available):
```bash
# Test MySQL connection from your WABOT container
telnet your-mysql-hostname 3306
# OR
nc -zv your-mysql-hostname 3306
```

### Test 2: Verify Environment Variables
Make sure these are set correctly in Coolify:
```bash
DB_HOST=your-correct-mysql-hostname
DB_PORT=3306
DB_USER=wabot
DB_PASSWORD=your-mysql-password
DB_NAME=wabot_ai
```

## 🔍 Common Solutions

### Solution 1: Use Coolify's Internal DNS
If your MySQL service name is `mysql-abc123`, try:
```bash
DB_HOST=mysql-abc123
```

### Solution 2: Use Service Discovery
Some Coolify setups require full service names:
```bash
DB_HOST=mysql-service-name.project-name
```

### Solution 3: Check Docker Network
Both services must be on the same Docker network. In Coolify:
1. Go to **Project Settings**
2. Verify both services are in the same **network**
3. Restart both services if needed

## 🚨 Emergency Fallback
If you can't get the internal hostname to work, temporarily use the MySQL container's IP address:

1. Find MySQL container IP in Coolify
2. Use it temporarily:
```bash
DB_HOST=172.17.0.x  # Replace with actual IP
```
(Note: IPs can change, so fix the hostname issue as soon as possible)