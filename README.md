# My Java App (Cloud-Native 3-Tier Application)

A production-ready 3-tier cloud-native application designed specifically for practicing modern DevOps workflows, including 12-factor configuration, containerization, Kubernetes orchestration, database migrations, observability, CI/CD automation, and a responsive presentation tier.

---

## 🏛️ 3-Tier Architecture

```text
┌────────────────────────────────────────────────────────┐
│               TIER 1: PRESENTATION TIER                │
│  Modern Single-Page Client (HTML5, Vanilla JS, CSS3)   │
│  - Standalone: Nginx reverse proxy (Port 3000 / 80)    │
│  - Embedded: Spring Boot static resources (Port 8080)  │
└───────────────────────────┬────────────────────────────┘
                            │ REST API Calls (/api/v1/...)
┌───────────────────────────▼────────────────────────────┐
│               TIER 2: APPLICATION TIER                 │
│  Spring Boot 3 REST Application (Port 8080)            │
│  Controllers, DTO Validation, Services, Actuator       │
└───────────────────────────┬────────────────────────────┘
                            │ JDBC Connection (HikariCP)
┌───────────────────────────▼────────────────────────────┐
│                  TIER 3: DATA TIER                     │
│  PostgreSQL 15 Database (Port 5432 / 5433)             │
│  Flyway automated schema migrations (V1__init.sql)     │
└────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```text
my-java-app/
├── frontend/                     # Tier 1: Standalone Presentation Tier
│   ├── index.html                # Responsive Dashboard SPA
│   ├── css/style.css             # Design system, cards, table, modals, toasts
│   ├── js/app.js                 # State, REST API client, debounced search & CRUD
│   ├── nginx.conf.template       # Config template with dynamic ${BACKEND_URL}
│   ├── nginx.conf                # Default Nginx reverse proxy configuration
│   └── Dockerfile                # Nginx Alpine container definition
├── .github/
│   └── workflows/
│       └── ci-cd.yml             # GitHub Actions build, test, scan & push workflow
├── src/
│   main/
│       java/com/example/demo/
│           ├── controller/       # REST Endpoints (@RestController)
│           ├── model/            # JPA Entities (@Entity)
│           ├── repository/       # Spring Data Interfaces (JpaRepository)
│           ├── service/          # Business logic (@Service)
│           ├── dto/              # Request / Response validation objects
│           ├── exception/        # Global exception handling
│           └── DemoApplication.java
│       resources/
│           ├── static/           # Embedded Web UI (served directly at /)
│           │   ├── index.html
│           │   ├── css/style.css
│           │   └── js/app.js
│           ├── application.yml   # Externalized configuration via env vars
│           └── db/migration/     # Flyway SQL migration scripts (V1__init.sql)
│   test/
│       java/com/example/demo/    # JUnit 5 integration tests
│       resources/
│           └── application-test.yml # In-memory H2 test profile
├── Dockerfile                    # Multi-stage build (JDK -> JRE runtime)
├── docker-compose.yml            # Full 3-tier local stack (Postgres + App + Frontend)
├── pom.xml                       # Maven dependency lock file
└── k8s/
    ├── deployment.yaml           # Backend Deployment, Service, ConfigMap & Secret
    ├── frontend-deployment.yaml  # Frontend Nginx Deployment & NodePort Service
    └── postgres-statefulset.yaml # PostgreSQL StatefulSet & Service for Minikube
```

---

## 🚀 Key Features

1. **Modern Presentation Tier (UI)**:
   - **Interactive Dashboard**: Real-time KPI summary cards (Total Inventory, Valuation, Low-Stock items, Backend Health).
   - **Dynamic Architecture Drawer**: Visualizes 3-Tier flow directly inside the UI.
   - **Search & Filter**: Real-time debounced product search, stock status filtering, and multi-field sorting.
   - **Full CRUD Support**: Add, view, edit, and delete items with validation and confirmation dialogs.
   - **Toast Notifications**: Non-intrusive feedback on user actions.
   - **Dual Hosting Modes**: Deployable as a dedicated Nginx container or served directly from Spring Boot.
2. **Spring Boot 3 & Java 17/21**: Built with modern cloud-native standards.
3. **Flyway Migrations**: Automated database schema migrations run on application startup (`db/migration/V1__init.sql`).
4. **Observability & Probes**: Spring Boot Actuator configured with `/actuator/health/liveness`, `/actuator/health/readiness`, and Prometheus metrics (`/actuator/prometheus`).
5. **Multi-Stage Dockerfile**:
   - Stage 1: Builds JAR using `maven:3.9.9-eclipse-temurin-17-alpine` with layer caching.
   - Stage 2: Runs JAR inside minimal `eclipse-temurin:17-jre-alpine` with an unprivileged non-root user (`appuser`).
6. **Kubernetes Ready**: Complete manifests for Tier 1 (Frontend), Tier 2 (Backend), and Tier 3 (PostgreSQL StatefulSet) with ConfigMaps, Secrets, resource limits, and probes.
7. **Automated CI/CD**: GitHub Actions workflow covering Maven builds, unit testing, Trivy vulnerability scanning, and container delivery.

---

## 🛠️ REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Web UI (Presentation Tier) |
| `GET` | `/api/v1/products` | Retrieve all products (supports `?search=keyword`) |
| `GET` | `/api/v1/products/{id}` | Retrieve single product by ID |
| `POST` | `/api/v1/products` | Create a new product |
| `PUT` | `/api/v1/products/{id}` | Update product details |
| `DELETE` | `/api/v1/products/{id}` | Delete product |
| `GET` | `/api/v1/products/ping` | Health ping probe |
| `GET` | `/actuator/health/liveness` | Kubernetes liveness probe |
| `GET` | `/actuator/health/readiness` | Kubernetes readiness probe |
| `GET` | `/actuator/prometheus` | Prometheus metric scrape endpoint |

---

## 💻 Quick Start & Testing

### Option 1: Run Full 3-Tier Stack with Docker Compose (Recommended)

Starts PostgreSQL, Spring Boot backend, and Nginx frontend together:

```bash
cd my-java-app
docker compose up --build
```

Access the application:
- **Frontend Web UI**: Open [http://localhost:3000](http://localhost:3000) in your browser.
- **Backend Direct UI / API**: Open [http://localhost:8080](http://localhost:8080).
- **Actuator Health**: [http://localhost:8080/actuator/health](http://localhost:8080/actuator/health).

---

### Option 2: Local Development with Maven

1. Start PostgreSQL:
   ```bash
   docker run -d --name local-pg -p 5432:5432 -e POSTGRES_DB=appdb -e POSTGRES_PASSWORD=postgres postgres:15-alpine
   ```
2. Run the application:
   ```bash
   cd my-java-app
   ./mvnw spring-boot:run
   ```
3. Open [http://localhost:8080](http://localhost:8080) to access the embedded Web UI.

---

## ☸️ Deploying to Kubernetes / Minikube

1. **Start Minikube**:
   ```bash
   minikube start
   ```

2. **Deploy PostgreSQL StatefulSet (Tier 3)**:
   ```bash
   kubectl apply -f k8s/postgres-statefulset.yaml
   kubectl rollout status statefulset/postgres
   ```

3. **Build & Deploy Java Backend (Tier 2)**:
   ```bash
   eval $(minikube docker-env)
   docker build -t my-java-app:latest .
   kubectl apply -f k8s/deployment.yaml
   kubectl rollout status deployment/java-app
   ```

4. **Build & Deploy Frontend UI (Tier 1)**:
   ```bash
   docker build -t my-frontend-app:latest ./frontend
   kubectl apply -f k8s/frontend-deployment.yaml
   kubectl rollout status deployment/frontend-app
   ```

5. **Access the Services**:
   ```bash
   # Open Frontend UI in browser
   minikube service frontend-service

   # (Optional) Open Backend API directly
   minikube service java-app-service
   ```
