# 🚀 EmergencyDesk - Production Deployment

## Architektura produkcyjna

```
┌─────────────────────────────────────────────────┐
│         Nginx (Host)                            │
│    emergencydesk.augustyniak.xyz               │
├──────────────────────────────────────────────────┤
│                                                 │
│  / ────────────────> Frontend (Static)         │
│                      (_next/static + public)    │
│                                                 │
│  /api/* ──────────> Proxy to Docker Backend   │
│                     (127.0.0.1:8000)           │
└──────────────────────────────────────────────────┘
                       │
        ┌──────────────▼──────────────┐
        │ Docker Compose              │
        ├────────────────────────────┤
        │ ├─ Laravel Backend (8000)  │
        │ │                          │
        │ ├─ MySQL Database          │
        │ │                          │
        │ └─ Queue Worker            │
        └────────────────────────────┘
```

---

## Krok 1: Przygotowanie serwera

### 1.1 SSH na serwer
```bash
ssh user@your-server-ip
```

### 1.2 Instalacja zależności
```bash
# Aktualizacja systemu
sudo apt update && sudo apt upgrade -y

# Instalacja Docker (jeśli jeszcze nie ma)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Instalacja docker-compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Instalacja Git
sudo apt install git -y

# Instalacja Nginx (dla frontendu)
sudo apt install nginx -y
```

### 1.3 Konfiguracja Docker do nginx-proxy
```bash
# Stwórz sieć dla nginx-proxy
docker network create nginx-proxy-network

# (Jeśli masz już nginx-proxy z innego projektu, pomiń ten krok)
```

---

## Krok 2: Klonowanie repo

```bash
# Klonowanie repozytorium
cd /home
git clone https://github.com/TWÓJ_GITHUB/emergency_desk.git
cd emergency_desk

# Ustawienie uprawnień
sudo chown -R $(whoami):$(whoami) .
```

---

## Krok 3: Konfiguracja Backend

### 3.1 Stwórz `.env.production`
```bash
# Skopiuj template
cp .env.production.example .env.production

# Edytuj zmienne
nano .env.production
```

**Ważne zmienne do zmiany:**
```
DB_DATABASE=emergency_desk_prod
DB_USERNAME=ed_prod_user
DB_PASSWORD=ZMIEŃ_NA_SILNE_HASŁO
MYSQL_ROOT_PASSWORD=ZMIEŃ_NA_SILNE_HASŁO
APP_KEY=base64:WYGENERUJ_NOWY_KLUCZ
```

### 3.2 Wygeneruj APP_KEY
```bash
docker-compose -f docker-compose.prod.yml run --rm backend php artisan key:generate --show
# Skopiuj wyjście i wstaw do .env.production
```

### 3.3 Stwórz `.env` w backend/
```bash
cp .env.production backend/.env
# Lub skopiuj manualne zmienne z .env.production do backend/.env
```

### 3.4 Uruchom Docker
```bash
docker-compose -f docker-compose.prod.yml up -d

# Sprawdź status
docker-compose -f docker-compose.prod.yml ps
```

### 3.5 Uruchom migracje i seed
```bash
docker-compose -f docker-compose.prod.yml exec backend php artisan migrate --seed
```

---

## Krok 4: Konfiguracja Frontend (Static)

### 4.1 Stwórz katalog frontend public
```bash
mkdir -p /home/emergency_desk/frontend/.next/static
mkdir -p /home/emergency_desk/frontend/public
```

### 4.2 Skonfiguruj Nginx
```bash
# Skopiuj config do Nginx
sudo cp nginx.conf /etc/nginx/sites-available/emergencydesk.augustyniak.xyz

# Włącz site
sudo ln -s /etc/nginx/sites-available/emergencydesk.augustyniak.xyz \
           /etc/nginx/sites-enabled/

# Testuj konfigurację
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### 4.3 GitHub Secrets - Setup Actions
Idź do: `Settings -> Secrets and variables -> Actions`

Dodaj sekrety:
```
DEPLOY_HOST=your-server-ip
DEPLOY_USER=your-user
DEPLOY_SSH_KEY=<zawartość private key>
```

**Note:** `NEXT_PUBLIC_API_URL` jest już ustawiony w workflow na `https://emergencydesk.augustyniak.xyz/api`

### 4.4 Jak wygenerować SSH key na serwerze
```bash
# Na serwerze generuj klucz
ssh-keygen -t ed25519 -f ~/.ssh/github_deploy -N ""

# Wyświetl klucz
cat ~/.ssh/github_deploy

# Skopiuj zawartość do GitHub Secrets jako DEPLOY_SSH_KEY
```

---

## Krok 5: DNS & SSL

### 5.1 DNS Records
```
Type    Name       Value
A       @          your-server-ip
A       www        your-server-ip
```

**Note:** Backend API jest na tej samej domenie pod ścieżką `/api/`

### 5.2 SSL (Let's Encrypt)
```bash
# Instalacja certbot
sudo apt install certbot python3-certbot-nginx -y

# Wygenerowanie certyfikatu
sudo certbot certonly --nginx -d emergencydesk.augustyniak.xyz \
                              -d api.emergencydesk.augustyniak.xyz

# Auto-renew (powinno być już skonfigurowane)
sudo systemctl enable certbot.timer
```

### 5.3 Zaktualizuj Nginx na HTTPS
```bash
# Edytuj Nginx config
sudo nano /etc/nginx/sites-available/emergencydesk.augustyniak.xyz

# Dodaj SSL (Certbot powinien to zrobić automatycznie)
sudo nginx -t && sudo systemctl restart nginx
```

---

## Krok 6: Deployment Frontend

### Automatyczne (via GitHub Actions)

1. Push do `main` będzie triggerować workflow
2. Frontend zbuduje się automatycznie
3. Deploy na serwer poprzez SSH

### Ręczne (jeśli GitHub Actions nie działa)

```bash
# Na lokalnej maszynie
cd frontend
npm run build

# Skopiuj .next/static na serwer
scp -r .next/static user@server:/home/emergency_desk/frontend/.next/

# Skopiuj public folder
scp -r public user@server:/home/emergency_desk/frontend/
```

---

## Krok 7: Monitorowanie

### Logowanie
```bash
# Backend logs
docker-compose -f docker-compose.prod.yml logs -f backend

# MySQL logs
docker-compose -f docker-compose.prod.yml logs -f mysql

# Queue worker
docker-compose -f docker-compose.prod.yml logs -f queue-worker
```

### Health Check
```bash
# Frontend
curl https://emergencydesk.augustyniak.xyz/

# Backend API
curl https://emergencydesk.augustyniak.xyz/api/

# Login test
curl -X POST https://emergencydesk.augustyniak.xyz/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@emergencydesk.ai","password":"Password"}'
```

---

## Krok 8: Backup & Maintenance

### Backup bazy danych
```bash
# Ręczny backup
docker-compose -f docker-compose.prod.yml exec mysql \
  mysqldump -u${DB_USERNAME} -p${DB_PASSWORD} ${DB_DATABASE} \
  > /home/emergency_desk/backups/db_$(date +%Y%m%d_%H%M%S).sql

# Scheduled backup (crontab)
0 2 * * * cd /home/emergency_desk && docker-compose -f docker-compose.prod.yml exec -T mysql mysqldump -u$DB_USERNAME -p$DB_PASSWORD $DB_DATABASE > backups/db_$(date +\%Y\%m\%d).sql
```

### Update aplikacji
```bash
cd /home/emergency_desk

# Pull latest code
git pull origin main

# Restart containers
docker-compose -f docker-compose.prod.yml restart backend queue-worker

# Run migrations (jeśli są)
docker-compose -f docker-compose.prod.yml exec backend php artisan migrate
```

---

## Troubleshooting

### Backend się nie łączy z MySQL
```bash
# Sprawdź czy MySQL jest healthy
docker-compose -f docker-compose.prod.yml ps

# Sprawdzij logi
docker-compose -f docker-compose.prod.yml logs mysql
```

### Frontend nie wczytuje API
```bash
# Sprawdź NEXT_PUBLIC_API_URL w GitHub Secrets
# Sprawdzij czy .env.production ma prawidłowy APP_KEY
```

### 502 Bad Gateway
```bash
# Sprawdź czy backend słucha
docker-compose -f docker-compose.prod.yml logs backend

# Sprawdź nginx logs
sudo tail -f /var/log/nginx/error.log
```

---

## Security Checklist

- [ ] Zmienić wszystkie hasła w `.env.production`
- [ ] Wygenerować silny APP_KEY
- [ ] Skonfigurować SSL (HTTPS)
- [ ] Setup backups bazy danych
- [ ] Skonfigurować firewall (ufw)
- [ ] Monitorowanie logów
- [ ] Setup alertów

```bash
# Podstawowa konfiguracja firewall
sudo ufw enable
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
```

---

## Kontakt & Support

W razie problemów sprawdź:
1. Logi Docker
2. Status containerów
3. Nginx error logs
4. MySQL connectivity

