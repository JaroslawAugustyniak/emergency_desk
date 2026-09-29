# ⚡ Analiza Wydajności - Czas Zapełnienia Dysku

## Rozmiary PER ORDER (po optymalizacji)

| Komponent | Rozmiar |
|-----------|---------|
| Zdjęcia (5 × 500KB) | 2.5 MB |
| Podpis (PNG w storage) | 0.05 MB |
| Work report (DB) | 0.5 MB |
| DB records | 0.2 MB |
| **RAZEM** | **~3.25 MB** |

---

## Dostępna Pojemność

| Metryka | Wartość |
|---------|---------|
| Total disk | 100 GB |
| Overhead (10%) | 10 GB |
| **Dostępne** | **90 GB** |

---

## Scenariusze Zapełnienia

### 🔴 Pesymistyczne (300 orders/dzień)
```
90 GB ÷ 3.25 MB = 27,692 orders
27,692 ÷ 300 = 92 dni (~3 miesiące)
```
**Deadline**: Grudzień 2026

### 🟡 Średnie (100 orders/dzień)
```
90 GB ÷ 3.25 MB = 27,692 orders
27,692 ÷ 100 = 277 dni (~9 miesięcy)
```
**Deadline**: Czerwiec 2027

### 🟢 Optymistyczne (50 orders/dzień)
```
90 GB ÷ 3.25 MB = 27,692 orders
27,692 ÷ 50 = 554 dni (~18 miesięcy)
```
**Deadline**: Marzec 2028

---

## Wzrost Pojemności Po Optymalizacji

| Metryka | Przed | Po | Wzrost |
|---------|-------|-----|--------|
| Per order | 10.5 MB | 3.25 MB | +220% capacity |
| Max orders | 8,571 | 27,692 | +223% orders |
| Czas przy 100/dzień | 86 dni | 277 dni | +222% czas |

---

## Akcje Proaktywne

### ✅ Przy 70% kapacytości (63 GB)
- Archiwizacja orders starszych niż 12 miesięcy
- Czyszczenie tymczasowych zdjęć

### ✅ Przy 85% kapacytości (76.5 GB)
- Alert adminom
- Automatyczne backupy na S3
- Redukcja retention policy

### ✅ Przy 95% kapacytości (85.5 GB)
- Wyłączenie nowych uploadów
- Upgrade dysku w toku

---

## Monitoring

```bash
# Sprawdzenie rozmiaru
du -sh storage/

# Liczba zleceń
SELECT COUNT(*) FROM orders;

# Średni rozmiar per order
SELECT ROUND(AVG(size), 2) FROM (
  SELECT 
    id,
    (char_length(work_report) + char_length(technician_signature_path)) as size
  FROM orders
) t;
```

---

## Rekomendacja

**Trigger upgrade dysku**: ~20 GB wolnego miejsca
- Przy 100 orders/dzień → ~200 dni zanim trzeba upgrade
- Setup: S3 integration do arquiwalnych orders
