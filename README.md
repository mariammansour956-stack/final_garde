# ShopEase – E-Commerce Platform

A production-ready e-commerce platform built with **FastAPI microservices** (backend) and **React + TypeScript** (frontend), fully containerized with **Docker Compose**.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Frontend                          │
│          React + Vite + Tailwind CSS                 │
│              nginx (port 80)                         │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│              Docker Network (ecommerce-net)          │
│                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐  │
│  │  user-service │  │ order-service│  │ notif-svc │  │
│  │   (port 8001) │  │  (port 8002) │  │(port 8003)│  │
│  │   FastAPI     │  │   FastAPI    │  │  FastAPI  │  │
│  │   SQLite      │  │   SQLite     │  │  SQLite   │  │
│  └──────┬───────┘  └──────┬───────┘  └───────────┘  │
│         │                  │                          │
│         └──────────────────┘                          │
│         (JWT validation via shared SECRET_KEY)        │
└─────────────────────────────────────────────────────┘
```

### Services

| Service | Technology | Port | Description |
|---------|-----------|------|-------------|
| [`user-service`](ecommerce-microservices/user-service) | FastAPI + SQLite | 8001 | Authentication, user management, JWT tokens |
| [`order-service`](ecommerce-microservices/order-service) | FastAPI + SQLite | 8002 | Order CRUD, status workflow, revenue stats |
| [`notification-service`](ecommerce-microservices/notification-service) | FastAPI + SQLite | 8003 | User notifications, read/unread tracking |
| [`frontend`](ecommerce-frontend) | React + Vite + nginx | 80 | SPA with lazy-loaded routes, dark mode |

---

## Prerequisites (Ubuntu)

Before running the project, ensure your Ubuntu system has:

### 1. Docker Engine

```bash
# Update package index
sudo apt-get update

# Install prerequisites
sudo apt-get install -y ca-certificates curl

# Add Docker's official GPG key
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Add the repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update

# Install Docker Engine
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

### 2. Verify Docker Installation

```bash
# Check Docker version
docker --version

# Check Docker Compose version
docker compose version

# (Optional) Run hello-world to verify
sudo docker run hello-world
```

### 3. (Optional) Run Docker Without `sudo`

```bash
sudo usermod -aG docker $USER
# Log out and back in, or run: newgrp docker
```

### 4. System Requirements

- **OS**: Ubuntu 20.04 LTS or later (x86_64 / arm64)
- **RAM**: Minimum 2 GB (4 GB recommended)
- **Disk**: ~2 GB free space for Docker images + containers
- **Network**: Internet connection for pulling base images

---

## Step-by-Step: Run the Project

### Step 1 – Clone or Copy the Project

```bash
# If using Git:
git clone <your-repo-url> prod-grad-project
cd prod-grad-project

# Or if files are already on the server, navigate to the project root:
cd /path/to/prod-grad-project
```

### Step 2 – Verify Project Structure

Ensure the project root contains these directories/files:

```
prod-grad-project/
├── ecommerce-frontend/       # React frontend
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   └── src/
├── ecommerce-microservices/  # Backend services
│   ├── docker-compose.yml
│   ├── user-service/
│   ├── order-service/
│   └── notification-service/
└── README.md
```

### Step 3 – Start All Services with Docker Compose

```bash
# Navigate to the microservices directory (where docker-compose.yml is)
cd ecommerce-microservices

# Build images and start all containers in detached mode
docker compose up --build -d
```

**What this does**:
1. Builds 4 Docker images (3 backend Python services + 1 frontend nginx service)
2. Creates a shared Docker network (`ecommerce-net`)
3. Starts containers in dependency order with health checks:
   - `user-service` + `notification-service` start first
   - `order-service` starts after both are healthy
   - `frontend` starts after all 3 backends are healthy

### Step 4 – Monitor Startup

```bash
# Watch container status
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

Expected output:
```
NAMES                                            STATUS                          PORTS
ecommerce-microservices-frontend-1               Up X seconds                    0.0.0.0:80->80/tcp
ecommerce-microservices-order-service-1          Up X seconds (healthy)          0.0.0.0:8002->8002/tcp
ecommerce-microservices-user-service-1           Up X seconds (healthy)          0.0.0.0:8001->8001/tcp
ecommerce-microservices-notification-service-1   Up X seconds (healthy)          0.0.0.0:8003->8003/tcp
```

All 4 containers should show `Up` and backends should show `(healthy)`.  
The first startup may take 1–2 minutes while dependencies install.

### Step 5 – Check Logs (if any service fails)

```bash
# View logs for a specific service
docker logs ecommerce-microservices-user-service-1
docker logs ecommerce-microservices-order-service-1
docker logs ecommerce-microservices-notification-service-1
docker logs ecommerce-microservices-frontend-1

# Stream logs from all services
docker compose logs -f
```

### Step 6 – Verify the Application is Running

**Test the backend APIs**:

```bash
# Health check – user-service
curl -s http://localhost:8001/health

# Health check – order-service
curl -s http://localhost:8002/health

# Health check – notification-service
curl -s http://localhost:8003/health

# Readiness check
curl -s http://localhost:8001/ready
```

Expected response from each health endpoint:
```json
{"status":"ok","service":"user-service","version":"1.0.0"}
```

**Test the frontend**:

```bash
curl -s http://localhost:80 | head -5
```

Expected response (HTML with Vite-built React app):
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    ...
```

### Step 7 – Open the Application

Open a web browser and navigate to:

```
http://<your-server-ip>:80
```

- If running locally: **http://localhost:80**
- If running on a remote server: **http://<server-public-ip>:80**

---

## API Endpoints

### User Service (`http://localhost:8001`)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | Login (email + password) | No |
| POST | `/auth/refresh` | Refresh access token | No |
| GET | `/users/me` | Get current user profile | Yes |
| PUT | `/users/me` | Update profile | Yes |
| GET | `/users` | List all users (admin) | Admin |
| GET | `/users/{id}` | Get user by ID (admin) | Admin |
| GET | `/health` | Health check | No |
| GET | `/ready` | Readiness check (DB) | No |
| GET | `/metrics` | Prometheus metrics | No |

### Order Service (`http://localhost:8002`)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/orders` | List user's orders | Yes |
| POST | `/orders` | Create new order | Yes |
| GET | `/orders/{id}` | Get order by ID | Yes |
| PUT | `/orders/{id}/cancel` | Cancel order | Yes |
| PATCH | `/orders/{id}/status` | Update status (admin) | Admin |
| GET | `/orders/stats` | Order statistics (admin) | Admin |
| GET | `/health` | Health check | No |
| GET | `/ready` | Readiness check (DB) | No |
| GET | `/metrics` | Prometheus metrics | No |

### Notification Service (`http://localhost:8003`)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/notifications` | List user's notifications | Yes |
| GET | `/notifications/unread/count` | Unread count | Yes |
| PATCH | `/notifications/{id}/read` | Mark as read | Yes |
| PATCH | `/notifications/read-all` | Mark all as read | Yes |
| DELETE | `/notifications/{id}` | Delete notification | Yes |
| GET | `/health` | Health check | No |
| GET | `/ready` | Readiness check (DB) | No |
| GET | `/metrics` | Prometheus metrics | No |

### Authentication

- **Register**: `POST /auth/register` with `{username, email, full_name, password}`
- **Login**: `POST /auth/login` with `{email, password}`
- Both return: `{access_token, refresh_token, token_type: "bearer"}`
- Use the `access_token` as a `Bearer` token in the `Authorization` header
- Access tokens expire in 30 minutes, refresh tokens in 7 days

---

## Useful Docker Commands

```bash
# Start all services
docker compose up -d

# Rebuild and start (after code changes)
docker compose up --build -d

# Stop all services
docker compose down

# Stop and remove volumes (deletes databases)
docker compose down -v

# View logs
docker compose logs -f

# View logs for a specific service
docker compose logs user-service -f

# Restart a specific service
docker compose restart user-service

# Check resource usage
docker stats
```

---

## Configuration

### Environment Variables

All environment variables are defined directly in [`docker-compose.yml`](ecommerce-microservices/docker-compose.yml). Key variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `SECRET_KEY` | `dev-secret-key-change-in-production` | JWT signing key |
| `ALGORITHM` | `HS256` | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | Access token lifetime |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `7` | Refresh token lifetime |
| `DATABASE_URL` | `sqlite+aiosqlite:///./{service}.db` | Database connection |
| `NOTIFICATION_SERVICE_URL` | `http://notification-service:8003` | For order-service to call notifications |
| `LOG_LEVEL` | `INFO` | Logging level |

### Production Hardening

Before deploying to production, change these defaults:

1. **`SECRET_KEY`** – Generate a strong random key:
   ```bash
   openssl rand -hex 32
   ```
2. **`ACCESS_TOKEN_EXPIRE_MINUTES`** – Reduce to 15 for better security
3. **`allow_origins`** in [`main.py`](ecommerce-microservices/user-service/app/main.py:39) – Restrict to your domain
4. **Remove `curl`** from Dockerfiles if not using health checks
5. **Use a managed database** (PostgreSQL) instead of SQLite for production

---

## Troubleshooting

### Container exits immediately with code 3

```bash
docker logs ecommerce-microservices-user-service-1
```

Common causes:
- Missing Python dependency (run `pip install -r requirements.txt` inside the container)
- Import error in application code
- Database permissions issue

### Health check fails

```bash
# Check if curl is installed inside the container
docker exec ecommerce-microservices-user-service-1 curl --version

# Manually test the health endpoint
docker exec ecommerce-microservices-user-service-1 curl -f http://localhost:8001/health
```

### Port conflicts

If port 80, 8001, 8002, or 8003 are already in use, change the host port in [`docker-compose.yml`](ecommerce-microservices/docker-compose.yml):

```yaml
ports:
  - "8080:80"   # Change host port 80 → 8080
```
