# Instrukcja wdrożenia projektu na VPS produkcyjny

**Środowisko:** OVH VPS · Ubuntu 24.x · Docker · Nginx Proxy Manager

---

## 1. Struktura katalogów na serwerze

```
~/docker/
  nginx-proxy-manager/     # osobny docker-compose dla NPM
  nazwa_projektu/          # katalog projektu
    docker-compose.prod.yml
    docker-compose.frontend.yml
    ...
```

Każdy projekt trzymaj w osobnym katalogu pod `~/docker/`.

---

## 2. Nginx Proxy Manager — sieć Docker

NPM tworzy własną sieć Docker o nazwie **`nginx-proxy-manager_default`**.

> **Kluczowa zasada:** każdy kontener, do którego NPM ma kierować ruch, musi być podłączony do tej sieci.

### Weryfikacja nazwy sieci NPM

```bash
docker inspect <nazwa_kontenera_NPM> | grep -A3 '"Networks"'
# Szukaj wpisu np. "nginx-proxy-manager_default"
```

### Dodanie sieci NPM do docker-compose projektu

W każdym pliku `docker-compose` dodaj do serwisów wystawianych przez NPM:

```yaml
services:
  backend:
    ...
    networks:
      - twoja_wewnetrzna_siec
      - npm_network

  frontend:
    ...
    networks:
      - npm_network

networks:
  twoja_wewnetrzna_siec:
    driver: bridge
  npm_network:
    external: true
    name: nginx-proxy-manager_default
```

### Podłączenie działającego kontenera bez restartu (jednorazowo)

```bash
docker network connect nginx-proxy-manager_default <nazwa_kontenera>
```

Trwałe połączenie zapewnia dopiero wpis w `docker-compose` (powyżej).

---

## 3. MySQL — konfiguracja healthcheck

Domyślny `interval` healthchecka to **30 sekund** — kontenery zależne czekają bardzo długo na start.

```yaml
mysql:
  image: mysql:8.0
  ...
  healthcheck:
    test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
    interval: 5s      # nie pomijaj - domyślne 30s bardzo spowalnia start
    timeout: 5s
    retries: 10
```

---

## 4. Backend Laravel — docker-compose

```yaml
services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: proj_backend_prod
    restart: always
    volumes:
      - ./backend:/app          # kod montowany jako volume
    ports:
      - "127.0.0.1:8001:8000"  # binduj tylko na localhost, nie 0.0.0.0
    depends_on:
      mysql:
        condition: service_healthy
    networks:
      - backend
      - npm_network

networks:
  backend:
    driver: bridge
  npm_network:
    external: true
    name: nginx-proxy-manager_default
```

**NPM config dla backendu:**
- Scheme: `http`
- Forward Hostname: `proj_backend_prod` (nazwa kontenera)
- Forward Port: `8000` (port **wewnętrzny** kontenera, nie port hosta)

---

## 5. Frontend Next.js (`output: standalone`) — docker-compose

Next.js z `output: 'standalone'` wymaga **Node.js**, nie nginx.

```yaml
services:
  frontend:
    image: node:20-alpine
    container_name: proj_frontend_prod
    restart: always
    working_dir: /app
    command: node server.js
    environment:
      PORT: 3000
      HOSTNAME: "0.0.0.0"
    ports:
      - "127.0.0.1:3000:3000"
    volumes:
      - ./frontend/.next/standalone:/app
      - ./frontend/.next/static:/app/.next/static:ro
      - ./frontend/public:/app/public:ro
    networks:
      - npm_network

networks:
  npm_network:
    external: true
    name: nginx-proxy-manager_default
```

**NPM config dla frontendu:**
- Scheme: `http`
- Forward Hostname: `proj_frontend_prod`
- Forward Port: `3000`

> **Uwaga:** Jeśli używasz `output: 'export'` (static export bez server actions) — możesz użyć `nginx:alpine` i serwować katalog `out/`. Sprawdź czy projekt nie używa `'use server'` — jeśli tak, wymagany jest standalone.

---

## 6. Nginx Proxy Manager — konfiguracja Proxy Host

Dla każdej domeny w NPM (Settings → Proxy Hosts → Add):

1. **Domain Names:** `domena.pl`
2. **Scheme:** `http`
3. **Forward Hostname:** nazwa kontenera Docker (np. `proj_frontend_prod`)
4. **Forward Port:** wewnętrzny port kontenera (`80` dla nginx, `3000` dla node, `8000` dla Laravel)
5. **Block Common Exploits:** ✓
6. **Websocket Support:** ✓ (jeśli potrzebne)
7. **SSL tab:** wygeneruj certyfikat Let's Encrypt, Force SSL ✓

> **Częsty błąd:** wpisanie portu hosta (np. `3000`) zamiast portu wewnętrznego kontenera. NPM komunikuje się z kontenerem przez sieć Docker, z pominięciem mapowania portów hosta.

---

## 7. GitHub Actions — CI/CD

### Wymagane secrets (Settings → Secrets → Actions)

| Secret | Wartość |
|---|---|
| `DEPLOY_HOST` | IP lub hostname VPS |
| `DEPLOY_USER` | `ubuntu` |
| `DEPLOY_SSH_KEY` | prywatny klucz SSH (zawartość `~/.ssh/id_rsa`) |
| `NEXT_PUBLIC_API_URL` | URL API frontendu |

### Deploy key na GitHub (dla `git pull` na serwerze)

```bash
# Na serwerze — wygeneruj dedykowany klucz
ssh-keygen -t ed25519 -C "vps-deploy" -f ~/.ssh/github_deploy -N ""
cat ~/.ssh/github_deploy.pub
```

Skopiuj klucz publiczny do GitHub: **repo → Settings → Deploy keys → Add deploy key**.

Skonfiguruj SSH na serwerze (`~/.ssh/config`):

```
Host github.com
  IdentityFile ~/.ssh/github_deploy
```

### Workflow — deploy frontendu (`.github/workflows/deploy-frontend.yml`)

```yaml
name: Deploy Frontend

on:
  push:
    branches: [main]
    paths:
      - 'frontend/**'
      - 'docker-compose.frontend.yml'
      - '.github/workflows/deploy-frontend.yml'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: 'frontend/package-lock.json'

      - name: Install dependencies
        working-directory: ./frontend
        run: npm ci

      - name: Build
        working-directory: ./frontend
        env:
          NEXT_PUBLIC_API_URL: ${{ secrets.NEXT_PUBLIC_API_URL }}
        run: npm run build

      - name: Setup SSH
        uses: webfactory/ssh-agent@v0.9.0
        with:
          ssh-private-key: ${{ secrets.DEPLOY_SSH_KEY }}

      - name: Add server to known hosts
        run: ssh-keyscan -H ${{ secrets.DEPLOY_HOST }} >> ~/.ssh/known_hosts

      - name: Fix permissions on server
        run: |
          ssh ${{ secrets.DEPLOY_USER }}@${{ secrets.DEPLOY_HOST }} \
            "sudo chown -R ${{ secrets.DEPLOY_USER }}:${{ secrets.DEPLOY_USER }} \
            ~/docker/nazwa_projektu/frontend/.next/ \
            ~/docker/nazwa_projektu/frontend/public/ 2>/dev/null || true"

      - name: Sync build to server
        run: |
          rsync -az --delete frontend/.next/standalone/ \
            ${{ secrets.DEPLOY_USER }}@${{ secrets.DEPLOY_HOST }}:~/docker/nazwa_projektu/frontend/.next/standalone/
          rsync -az --delete frontend/.next/static/ \
            ${{ secrets.DEPLOY_USER }}@${{ secrets.DEPLOY_HOST }}:~/docker/nazwa_projektu/frontend/.next/static/
          rsync -az --delete frontend/public/ \
            ${{ secrets.DEPLOY_USER }}@${{ secrets.DEPLOY_HOST }}:~/docker/nazwa_projektu/frontend/public/

      - name: Restart frontend container
        run: |
          ssh ${{ secrets.DEPLOY_USER }}@${{ secrets.DEPLOY_HOST }} \
            "docker restart proj_frontend_prod"
```

### Workflow — deploy backendu (`.github/workflows/deploy-backend.yml`)

```yaml
name: Deploy Backend

on:
  push:
    branches: [main]
    paths:
      - 'backend/**'
      - 'Dockerfile'
      - 'entrypoint.sh'
      - 'docker-compose.prod.yml'
      - '.github/workflows/deploy-backend.yml'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to server
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.DEPLOY_HOST }}
          username: ${{ secrets.DEPLOY_USER }}
          key: ${{ secrets.DEPLOY_SSH_KEY }}
          script: |
            cd ~/docker/nazwa_projektu
            git pull origin main
            docker compose -f docker-compose.prod.yml up -d --build backend
```

> `entrypoint.sh` automatycznie uruchamia:
> - `composer install` — instalacja zależności PHP
> - `php artisan migrate --force` — uruchomienie migracji bazy danych
> - `php artisan storage:link` — tworzenie symbolic link dla przechowywania plików
> - `php artisan config:clear` i `php artisan route:clear` — czyszczenie cache
> 
> przy każdym starcie kontenera.

---

## 8. Konfiguracja backupu bazy danych i plików

Projekt zawiera zautomatyzowany system tworzenia kopii bezpieczeństwa (backupy) bazy danych i plików.

### Architektura backupu

Backup obejmuje:
- **Dump bazy danych MySQL** (`database.sql`)
- **Pliki aplikacji** z katalogu `backend/storage/app/public` (obrazki, protokoły, itp.)
- **Archiwum** w formacie `tar.gz` z kompresją
- **Automatyczne czyszczenie** starych backupów (domyślnie starsze niż 30 dni)
- **Upload na serwer FTP** (opcjonalnie)

### Komponenty backupu

```
Kernel.php                          → Scheduler (uruchamia się co minutę)
  ↓
backup:create (Laravel Command)     → Koordynuje proces backupu
  ↓
BackupService (app/Services/)       → Obsługuje:
  ├─ mysqldump (export bazy)
  ├─ tar.gz (kompresja plików)
  ├─ FTP upload (jeśli skonfigurowany)
  └─ cleanup (usunięcie starych backupów)
```

### Serwis Docker — `schedule-worker`

W `docker-compose.prod.yml` znajduje się dedykowany kontener do schedulingu:

```yaml
schedule-worker:
  build:
    context: .
    dockerfile: Dockerfile
  container_name: ed_schedule_worker
  command: php artisan schedule:work
  # ... pozostała konfiguracja
```

**Zadania:**
- Uruchamia `php artisan schedule:work` (wewnątrz kontenera na nieskończoność)
- Monitoruje plan harmonogramu
- Wykonuje `backup:create` każdego dnia o ustalonej porze

### Konfiguracja zmiennych środowiskowych

Dodaj do pliku `.env` na serwerze:

```env
# =========================
# BACKUP Configuration
# =========================

# Pora wykonania backupu (format HH:mm, domyślnie 02:00)
BACKUP_SCHEDULE_TIME=02:00

# FTP — jeśli chcesz wysyłać backupy na zewnętrzny serwer
BACKUP_FTP_HOST=ftp.example.com
BACKUP_FTP_USERNAME=username
BACKUP_FTP_PASSWORD=password
BACKUP_FTP_DIRECTORY=/backups/

# Ile dni przechowywać stare backupy na dysku (domyślnie 30)
BACKUP_RETENTION_DAYS=30
```

### Ścieżka przechowywania backupów

Backupy znajdują się w:
```
./storage/backups/backup_YYYY-MM-DD_HH-mm-ss.tar.gz
```

Na serwerze, jeśli montowany jest volume:
```
~/docker/nazwa_projektu/storage/backups/
```

### Testowanie backupu

#### Ręcznie:
```bash
# Wejdź do katalogu projektu
cd ~/docker/nazwa_projektu

# Uruchom backup ręcznie
docker exec ed_backend php artisan backup:create
```

#### Sprawdzenie logów:
```bash
# Logi schedule-worker (scheduler)
docker logs ed_schedule_worker -f

# Logi backend (gdzie wykonuje się backup)
docker logs ed_backend -f | grep -i backup

# Logi Laravel
tail -f ./storage/logs/laravel.log | grep -i backup
```

#### Lista backupów:
```bash
ls -lh ./storage/backups/
```

### Upload na serwer FTP

Jeśli skonfigurowany jest FTP, backupy będą automatycznie wgrywane na zewnętrzny serwer po utworzeniu.

**Wymagane pola w `.env`:**
- `BACKUP_FTP_HOST` — adres serwera FTP
- `BACKUP_FTP_USERNAME` — login FTP
- `BACKUP_FTP_PASSWORD` — hasło FTP
- `BACKUP_FTP_DIRECTORY` — katalog docelowy (domyślnie `/backups/`)

Jeśli którekolwiek z pól brakuje, upload na FTP będzie pominięty, a backup zostanie stworzony lokalnie.

### Monitoring backupu

Backupy logują się do:
- `storage/logs/laravel.log` — event logów aplikacji
- `docker logs ed_schedule_worker` — uruchomienie schedulera
- `docker logs ed_backend` — wykonanie backupu

**Przykładowe logi:**
```
[2026-09-23 02:00:00] local.INFO: Starting backup process...
[2026-09-23 02:00:15] local.INFO: Database dumped to /app/storage/backups/backup_2026-09-23_02-00-00_database.sql
[2026-09-23 02:00:45] local.INFO: Archive created at /app/storage/backups/backup_2026-09-23_02-00-00.tar.gz
[2026-09-23 02:01:00] local.INFO: Backup uploaded to FTP server
[2026-09-23 02:01:05] local.INFO: Backup process completed successfully
```

### Troubleshooting backupu

| Problem | Przyczyna | Rozwiązanie |
|---|---|---|
| Backup się nie uruchamia | `schedule-worker` nie działa | `docker ps \| grep schedule-worker` i `docker logs ed_schedule_worker` |
| "mysqldump: command not found" | Brak narzędzia w kontenerze | Sprawdź Dockerfile czy zawiera `mysql-client` |
| Błąd permisji na pliki | Pliki należą do innego użytkownika | `docker exec ed_backend chown -R www-data:www-data /app/storage` |
| FTP upload fails | Złe dane FTP lub firewall | Sprawdź konfigurację w `.env` i dostęp do serwera FTP |
| Brak backupów w katalogu | Katalog backupów nie istnieje | `docker exec ed_backend mkdir -p /app/storage/backups` |

---

## 9. Pierwsze uruchomienie projektu na serwerze

```bash
# 1. Sklonuj repo
cd ~/docker
git clone git@github.com:user/repo.git nazwa_projektu
cd nazwa_projektu

# 2. Stwórz plik .env
cp .env.example .env
nano .env   # uzupełnij wartości produkcyjne

# 3. Uruchom backend + bazę
docker compose -f docker-compose.prod.yml up -d

# 4. Zbuduj frontend lokalnie i wgraj (lub poczekaj na CI)
# Lokalnie:
cd frontend && npm ci && npm run build
rsync -az --delete .next/standalone/ ubuntu@VPS:~/docker/nazwa_projektu/frontend/.next/standalone/
rsync -az --delete .next/static/ ubuntu@VPS:~/docker/nazwa_projektu/frontend/.next/static/
rsync -az --delete public/ ubuntu@VPS:~/docker/nazwa_projektu/frontend/public/

# 5. Uruchom frontend
docker compose -f docker-compose.frontend.yml up -d

# 6. Skonfiguruj Proxy Hosts w NPM (patrz sekcja 6)
```

---

## 10. Troubleshooting

| Problem | Przyczyna | Rozwiązanie |
|---|---|---|
| 502 Bad Gateway | Kontener nie jest w sieci NPM | `docker network connect nginx-proxy-manager_default <kontener>` |
| 502 Bad Gateway | Zły port w NPM | Użyj portu **wewnętrznego** kontenera, nie portu hosta |
| Welcome to nginx / domyślna strona | Zły port lub zła konfiguracja nginx w kontenerze | Sprawdź czy port w NPM zgadza się z portem kontenera |
| Kontener nie pojawia się w sieci po restarcie | Brak wpisu `networks` w docker-compose | Dodaj sieć NPM do `docker-compose` (sekcja 2) |
| MySQL — wolny start (30s+) | Brak `interval` w healthcheck | Dodaj `interval: 5s` (sekcja 3) |
| rsync Permission denied | Pliki należą do root (stworzone przez kontener) | `sudo chown -R ubuntu:ubuntu ~/docker/projekt/frontend/.next/` |
| `git pull` fails na serwerze | Brak deploy key | Dodaj klucz publiczny serwera do GitHub Deploy keys |
