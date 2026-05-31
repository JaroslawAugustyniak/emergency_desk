# 🚀 Git Repository Setup Guide

Instrukcja jak zainicjalizować git repozytorium dla projektu Starter.

---

## 📋 Przygotowanie

Upewnij się, że masz zainstalowanego Gita:

```bash
git --version
```

Skonfiguruj git (jeśli jeszcze nie zrobiłeś):

```bash
git config --global user.name "Twoje Imię"
git config --global user.email "twój.email@example.com"
```

---

## 🎯 Krok po kroku

### Krok 1: Przejdź do katalogu projektu

```bash
cd /home/jarek/projects/Starter
```

### Krok 2: Zainicjalizuj repozytorium

```bash
git init
```

Pozwoli Ci to na śledzenie zmian w kodzie.

### Krok 3: Dodaj wszystkie pliki (z .gitignore)

```bash
git add .
```

Komenda doda wszystkie pliki poza tymi wymienionymi w `.gitignore`:
- `.env` i zmienne środowiskowe
- `node_modules/` i `vendor/`
- Logi, cache, build artifacts
- IDE i OS pliki

### Krok 4: Sprawdź status

```bash
git status
```

Powinieneś zobaczyć listę plików do commitu. **Ważne**: Upewnij się, że nie ma tam:
- `.env` plików
- `node_modules/` lub `vendor/`
- `build/` lub `.next/`

### Krok 5: Stwórz pierwszy commit

```bash
git commit -m "Initial commit: Complete Starter project setup

- Authentication system with Laravel API and Sanctum
- Token-based authentication with localStorage
- User profile management
- Password reset functionality with email
- Email verification system
- Frontend with Next.js 16 and next-intl
- Backend with Laravel 10
- Cleaned up and removed next-auth dependency
- Removed unused code and dependencies"
```

### Krok 6: Dodaj zdalne repozytorium (jeśli masz GitHub/GitLab)

#### Dla GitHub:

```bash
git remote add origin https://github.com/YOUR_USERNAME/Starter.git
git branch -M main
git push -u origin main
```

#### Dla GitLab:

```bash
git remote add origin https://gitlab.com/YOUR_USERNAME/Starter.git
git branch -M main
git push -u origin main
```

---

## 📁 Struktura repozytorium

```
Starter/
├── backend/                 # Laravel API
│   ├── app/                # Controllers, Models, Services
│   ├── database/           # Migrations, Seeders, Factories
│   ├── routes/             # API routes
│   ├── .env.example        # Template dla .env (COMMIT)
│   └── composer.json       # PHP dependencies
├── frontend/               # Next.js aplikacja
│   ├── src/
│   │   ├── app/           # Strony i komponenty
│   │   ├── lib/           # Utilities i actions
│   │   └── i18n/          # Konfiguracja lingwistyki
│   ├── .env.example       # Template dla .env (COMMIT)
│   └── package.json       # JS dependencies
├── .gitignore             # Ignorowane pliki
├── .env.example           # Root env template (COMMIT)
└── README.md              # Dokumentacja projektu (COMMIT)
```

---

## 🔑 Co powinno być w .gitignore

✅ **Ignorowane (nie commituj):**
- `.env` - zmienne środowiskowe z secretami
- `node_modules/`, `vendor/` - zależności
- `storage/logs`, `bootstrap/cache` - generowane pliki
- `.next`, `build`, `dist` - build artifacts
- IDE pliki (`.vscode`, `.idea`)
- Logi (`*.log`)

✅ **Commituj:**
- `.env.example` - template bez secretów
- `package.json`, `composer.json` - definicje zależności
- Kod źródłowy
- Dokumentacja

---

## 📝 Pliki które powinieneś dodać

Stwórz `.env.example` pliki (bez secretów):

### backend/.env.example
```
APP_NAME=Starter
APP_ENV=production
APP_URL=http://localhost:8000

DB_CONNECTION=pgsql
DB_HOST=postgres
DB_PORT=5432
DB_DATABASE=starter_db
DB_USERNAME=postgres
DB_PASSWORD=your_password_here

MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=465

FRONTEND_URL=http://localhost:3000
```

### frontend/.env.example
```
NEXT_PUBLIC_API_URL=http://api.starter.localhost
```

---

## 🔍 Przydatne komendy

**Sprawdzenie zmian:**
```bash
git status        # Jaki jest status
git diff          # Jakie zmiany w plikach
git log          # Historia commitów
```

**Pracy z branchami:**
```bash
git branch -a           # Pokaż wszystkie branche
git branch feature-name # Stwórz nowy branch
git checkout branch     # Przełącz na branch
```

**Przywrócenie zmian:**
```bash
git reset HEAD file    # Unstage plik
git checkout -- file   # Porzuć zmiany w pliku
```

---

## ⚠️ Ważne uwagi

1. **Nigdy nie commituj `.env` plików** - zawierają sekrety
2. **Zawsze commituj `.env.example`** - dla dokumentacji
3. **Sprawdź `.gitignore`** przed pierwszym commitkiem
4. **Dodaj token dostepu** do `.gitignore` jeśli jest w plikach

---

## ✅ Checklist

- [ ] Zainstalowany Git
- [ ] Skonfigurowany Git (user.name, user.email)
- [ ] `git init` w katalogu Starter
- [ ] `.gitignore` poprawnie skonfigurowany
- [ ] `git add .` dodał odpowiednie pliki
- [ ] Stworzony pierwszy commit
- [ ] (Opcjonalnie) Dodane zdalne repozytorium
- [ ] `.env.example` pliki w repo

---

## 🎉 Gotowe!

Twoje repozytorium Git jest teraz gotowe. Możesz rozpocząć pracę z wersjonowaniem kodu!