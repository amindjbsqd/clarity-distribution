# CLARITY DISTRIBUTION
### Admin Dashboard — Distribution Management System

---

## 🔐 Default Login
```
Email:    admin@clarity.ma
Password: Admin@2026
```

---

## ═══════════════════════════════════════
## PART 1: HOST ON LOCALHOST
## ═══════════════════════════════════════

### Prerequisites
- Node.js 18+ → https://nodejs.org
- PostgreSQL 15+ → https://www.postgresql.org/download/
- Git (optional)

### Step 1: Install PostgreSQL
```bash
# Windows: download installer from postgresql.org
# Mac:
brew install postgresql@15 && brew services start postgresql@15
# Linux:
sudo apt update && sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Step 2: Create Database
```bash
sudo -u postgres psql
```
```sql
CREATE USER clarity_user WITH PASSWORD 'clarity2026';
CREATE DATABASE clarity_db OWNER clarity_user;
GRANT ALL PRIVILEGES ON DATABASE clarity_db TO clarity_user;
\q
```

### Step 3: Setup Project
```bash
cd clarity-distribution
cp .env.example .env
```

Edit `.env`:
```
DATABASE_URL="postgresql://clarity_user:clarity2026@localhost:5432/clarity_db"
JWT_SECRET="run-this-command-openssl-rand-hex-32"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

Generate JWT_SECRET:
```bash
openssl rand -hex 32
```

### Step 4: Install & Run
```bash
npm install
npx prisma db push          # Creates all 22 tables
npm run db:seed              # Seeds cities, brands, admin, etc.
npm run dev                  # Starts on http://localhost:3000
```

### Step 5: Open Browser
```
http://localhost:3000
→ Login: admin@clarity.ma / Admin@2026
```

---

## ═══════════════════════════════════════
## PART 2: HOST ON HOSTINGER VPS
## ═══════════════════════════════════════

### What to Buy
→ Go to https://www.hostinger.com/vps-hosting
→ Buy **KVM 2** plan minimum (2 vCPU, 8GB RAM)
→ Choose **Ubuntu 22.04** as OS
→ You will get an IP address and root password

---

### STEP 1: Connect to VPS via SSH

```bash
# From your local terminal:
ssh root@YOUR_VPS_IP
# Enter the password Hostinger gave you
```

---

### STEP 2: Install System Dependencies

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Verify
node -v    # Should show v20.x.x
npm -v     # Should show 10.x.x

# Install PostgreSQL
apt install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql

# Install Nginx
apt install -y nginx
systemctl start nginx
systemctl enable nginx

# Install PM2 (process manager)
npm install -g pm2

# Install Git
apt install -y git
```

---

### STEP 3: Setup PostgreSQL Database

```bash
sudo -u postgres psql
```
```sql
CREATE USER clarity_user WITH PASSWORD 'YOUR_STRONG_PASSWORD_HERE';
CREATE DATABASE clarity_db OWNER clarity_user;
GRANT ALL PRIVILEGES ON DATABASE clarity_db TO clarity_user;
\q
```

---

### STEP 4: Upload Project to VPS

**Option A: Via Git (recommended)**
```bash
# On your local machine, push to GitHub/GitLab first
# Then on VPS:
cd /var/www
git clone https://github.com/YOUR_USERNAME/clarity-distribution.git
cd clarity-distribution
```

**Option B: Via SCP (direct upload)**
```bash
# From your LOCAL machine:
scp clarity-distribution.zip root@YOUR_VPS_IP:/var/www/
# Then on VPS:
cd /var/www
unzip clarity-distribution.zip
cd clarity-distribution
```

---

### STEP 5: Configure Environment

```bash
cp .env.example .env
nano .env
```

Set these values:
```
DATABASE_URL="postgresql://clarity_user:YOUR_STRONG_PASSWORD_HERE@localhost:5432/clarity_db"
JWT_SECRET="PASTE_OUTPUT_OF_openssl_rand_hex_32"
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
NODE_ENV="production"
```

Generate secret:
```bash
openssl rand -hex 32
```

---

### STEP 6: Install, Build, Seed

```bash
npm install
npx prisma db push
npm run db:seed
npm run build
```

Wait for build to complete (2-5 minutes).

---

### STEP 7: Start with PM2

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

Verify it's running:
```bash
pm2 status
pm2 logs clarity-distribution
curl http://localhost:3000    # Should return HTML
```

---

### STEP 8: Configure Nginx

```bash
nano /etc/nginx/sites-available/clarity
```

Paste this (replace yourdomain.com):
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    client_max_body_size 20M;
}
```

Enable and restart:
```bash
ln -s /etc/nginx/sites-available/clarity /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
nginx -t           # Test config
systemctl restart nginx
```

---

### STEP 9: Point Domain to VPS

In **Hostinger hPanel**:
1. Go to **Domains** → your domain
2. Go to **DNS / Nameservers**
3. Add **A Record**:
   - Name: `@`
   - Value: `YOUR_VPS_IP`
4. Add another **A Record**:
   - Name: `www`
   - Value: `YOUR_VPS_IP`
5. Wait 5-30 minutes for DNS propagation

---

### STEP 10: Install SSL (HTTPS)

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Follow prompts → select "Redirect HTTP to HTTPS"

Auto-renew test:
```bash
certbot renew --dry-run
```

---

### STEP 11: Done! Open Your Site

```
https://yourdomain.com
→ Login: admin@clarity.ma / Admin@2026
```

---

## ═══════════════════════════════════════
## USEFUL COMMANDS (on VPS)
## ═══════════════════════════════════════

```bash
# View app status
pm2 status

# View live logs
pm2 logs clarity-distribution

# Restart app
pm2 restart clarity-distribution

# After code update
cd /var/www/clarity-distribution
git pull                     # if using git
npm install                  # if deps changed
npm run build
pm2 restart clarity-distribution

# Database management
npx prisma studio            # Visual DB browser on port 5555

# Backup database
pg_dump -U clarity_user clarity_db > backup_$(date +%Y%m%d).sql

# Restore database
psql -U clarity_user clarity_db < backup_file.sql
```

---

## ═══════════════════════════════════════
## FIREWALL SETUP (Security)
## ═══════════════════════════════════════

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
ufw status
```

This blocks all ports except SSH (22), HTTP (80), HTTPS (443).

---

## Tech Stack
- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Prisma ORM** + PostgreSQL
- **JWT Auth** (bcryptjs + jose)
- **PM2** process manager
- **Nginx** reverse proxy
