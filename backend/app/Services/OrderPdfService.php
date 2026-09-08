<?php

namespace App\Services;

use App\Models\Order;
use Mpdf\Mpdf;
use Mpdf\Output\Destination;

class OrderPdfService
{
    private Mpdf $mpdf;
    private string $storagePath;

    public function __construct()
    {
        $this->storagePath = storage_path('app/public/order-protocols');
        $this->ensureStorageDirectory();
    }

    public function generateProtocol(Order $order): string
    {
        $this->mpdf = new Mpdf([
            'mode' => 'utf-8',
            'format' => 'A4',
            'margin_left' => 15,
            'margin_right' => 15,
            'margin_top' => 20,
            'margin_bottom' => 15,
        ]);

        $html = $this->buildProtocolHtml($order);
        $this->mpdf->WriteHTML($html);

        $fileName = $this->getFileName($order);
        $filePath = $this->storagePath . '/' . $fileName;

        $this->mpdf->Output($filePath, Destination::FILE);

        return $fileName;
    }

    public function getFileName(Order $order): string
    {
        $orderId = str_pad($order->id, 8, '0', STR_PAD_LEFT);
        return sprintf('order-%s-%s.pdf', $orderId, date('Ymd'));
    }

    public function getFilePath(Order $order): string
    {
        return $this->storagePath . '/' . $this->getFileName($order);
    }

    public function protocolExists(Order $order): bool
    {
        return file_exists($this->getFilePath($order));
    }

    public function deleteExistingProtocol(Order $order): void
    {
        $filePath = $this->getFilePath($order);
        if (file_exists($filePath)) {
            unlink($filePath);
        }
    }

    private function buildProtocolHtml(Order $order): string
    {
        $order->load(['client', 'technician', 'location', 'serviceCategory', 'photos', 'materials']);

        $clientData = $order->client?->user ? $order->client->user->fresh() : null;
        $technicianData = $order->technician;
        $location = $order->location;

        $logoPath = $this->getLogoBase64();

        $orderId = str_pad($order->id, 4, '0', STR_PAD_LEFT);
        $clientId = str_pad($order->client_id ?? 0, 3, '0', STR_PAD_LEFT);
        $locationId = str_pad($order->location_id ?? 0, 3, '0', STR_PAD_LEFT);
        $formattedOrderNumber = "C{$clientId}/P{$locationId}/O{$orderId}";
        $clientName = $order->client?->name ?? '—';
        $clientRefNo = $order->client_ref_no ?? '—';
        $statusLabel = $this->getStatusLabel($order->status);
        $statusClass = $order->status;
        $emergencyIcon = $order->is_emergency ? '<span style="font-size: 14px; font-weight: bold; color: #dc2626;">⚠️</span>' : '';
        $emergencyBadge = $order->is_emergency ? 'Awaryjne' : 'Standardowe';
        $orderDate = $order->order_date?->format('d.m.Y H:i') ?? '—';
        $categoryName = $order->serviceCategory?->name ?? '—';
        $locationName = $location?->name ?? '—';
        $locationAddress = $location ? $this->formatAddress($location) : '—';
        $locationNip = $location?->nip ?? '';
        $locationDescription = $location?->description ?? '';
        $clientEmail = $clientData?->email ?? '—';
        $clientPhone = $clientData?->phone ?? '';
        $technicianName = $technicianData ? $technicianData->first_name . ' ' . $technicianData->last_name : 'Nie przydzielony';
        $techEmail = $technicianData?->email ?? '—';
        $techPhone = $technicianData?->phone ?? '—';
        $startDate = $order->start_at?->format('d.m.Y H:i') ?? '—';
        $endDate = $order->end_at?->format('d.m.Y H:i') ?? '—';

        $materialsHtml = $this->buildMaterialsTable($order);
        $totalMaterials = $order->materials->sum('price') ?? 0;
        $priceTotal = $order->price_total ?? 0;
        $vatRate = $order->vat_rate ?? 0;
        $netPrice = $priceTotal > 0 ? $priceTotal / (1 + ($vatRate / 100)) : 0;
        $vatAmount = $priceTotal - $netPrice;
        $totalPrice = $priceTotal > 0 ? $priceTotal : $totalMaterials;
        $totalPriceFormatted = $this->formatPrice($totalPrice);
        $netPriceFormatted = $this->formatPrice($netPrice);
        $vatAmountFormatted = $this->formatPrice($vatAmount);
        $materialsPriceFormatted = $this->formatPrice($totalMaterials);

        $locationNipHtml = $locationNip ? '<div class="row"><div class="col col-label">NIP:</div><div class="col col-value">' . htmlspecialchars($locationNip, ENT_QUOTES, 'UTF-8') . '</div></div>' : '';
        $locationDescriptionHtml = $locationDescription ? '<div class="row"><div class="col col-label">Uwagi:</div><div class="col col-value"><div class="description-box">' . nl2br(htmlspecialchars($locationDescription, ENT_QUOTES, 'UTF-8')) . '</div></div></div>' : '';
        $clientContactHtml = $clientData ? '<div class="row"><div class="col col-label">Kontakt:</div><div class="col col-value">' . $clientEmail . ($clientPhone ? ' / ' . $clientPhone : '') . '</div></div>' : '';
        $techEmailHtml = $technicianData ? '<div class="row"><div class="col col-label">Email:</div><div class="col col-value">' . $techEmail . '</div></div>' : '';
        $techPhoneHtml = ($technicianData && $techPhone !== '—') ? '<div class="row"><div class="col col-label">Telefon:</div><div class="col col-value">' . $techPhone . '</div></div>' : '';
        $durationHtml = ($order->start_at && $order->end_at) ? '<div class="row"><div class="col col-label">Czas trwania:</div><div class="col col-value">' . $this->formatDuration($order->start_at, $order->end_at) . '</div></div>' : '';
        $workReportHtml = $order->work_report ? '<div class="section"><div class="section-title">Raport z pracy</div><div class="section-content"><div class="description-box">' . nl2br(htmlspecialchars($order->work_report, ENT_QUOTES, 'UTF-8')) . '</div></div></div>' : '';
        $vatHtml = $priceTotal > 0 ? '<div class="summary-row"><div class="summary-label">Stawka VAT:</div><div class="summary-value">' . number_format($vatRate, 2, ',', ' ') . '%</div></div><div class="summary-row"><div class="summary-label">VAT:</div><div class="summary-value">' . $vatAmountFormatted . '</div></div><div class="summary-row"><div class="summary-label">Cena netto:</div><div class="summary-value">' . $netPriceFormatted . '</div></div>' : '';
        $invoiceInfo = $order->invoice_no ? 'Faktura: ' . htmlspecialchars($order->invoice_no, ENT_QUOTES, 'UTF-8') : '';
        $generatedDate = date('d.m.Y H:i');

        $descriptionContent = $order->description ? nl2br(htmlspecialchars($order->description, ENT_QUOTES, 'UTF-8')) : 'Brak opisu';

        return <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 11px; color: #333; line-height: 1.4; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; border-bottom: 2px solid #1f2937; padding-bottom: 20px; }
        .logo { max-width: 120px; height: auto; }
        .company-info { text-align: right; flex: 1; }
        .company-name { font-size: 18px; font-weight: bold; color: #1f2937; margin-bottom: 5px; }
        .title { font-size: 16px; font-weight: bold; color: #374151; margin-bottom: 20px; text-align: center; }
        .order-id { font-size: 12px; font-weight: bold; margin-bottom: 20px; text-align: right; color: #1f2937; }
        .section { margin-bottom: 20px; page-break-inside: avoid; }
        .section-title { font-size: 12px; font-weight: bold; background-color: #e5e7eb; padding: 8px 10px; margin-bottom: 10px; border-left: 4px solid #1f2937; }
        .section-content { padding: 0 10px; }
        .row { display: table; width: 100%; margin-bottom: 8px; }
        .col { display: table-cell; padding-right: 20px; }
        .col-label { font-weight: bold; width: 30%; color: #4b5563; }
        .col-value { color: #1f2937; word-wrap: break-word; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { background-color: #f3f4f6; padding: 8px; text-align: left; font-weight: bold; border-bottom: 2px solid #d1d5db; font-size: 10px; }
        td { padding: 8px; border-bottom: 1px solid #e5e7eb; font-size: 10px; }
        .summary-box { background-color: #f9fafb; border: 1px solid #d1d5db; padding: 12px; margin-top: 15px; border-radius: 4px; }
        .summary-row { display: table; width: 100%; margin-bottom: 6px; }
        .summary-label { display: table-cell; width: 70%; font-weight: 500; color: #4b5563; }
        .summary-value { display: table-cell; text-align: right; font-weight: bold; color: #1f2937; }
        .summary-total { border-top: 2px solid #d1d5db; padding-top: 8px; margin-top: 8px; }
        .description-box { background-color: #fafbfc; border-left: 3px solid #3b82f6; padding: 10px; margin: 10px 0; line-height: 1.6; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #d1d5db; font-size: 10px; color: #6b7280; display: flex; justify-content: space-between; }
        .footer-section { flex: 1; }
        .signature-line { border-top: 1px solid #1f2937; width: 150px; margin-top: 30px; }
        .text-right { text-align: right; }
        .empty-materials { color: #9ca3af; font-style: italic; padding: 10px; }
        .status-badge { display: inline-block; padding: 4px 8px; border-radius: 3px; font-size: 10px; font-weight: bold; }
        .status-completed { background-color: #dbeafe; color: #0c4a6e; }
        .status-finished { background-color: #dcfce7; color: #166534; }
        .status-paused { background-color: #fed7aa; color: #92400e; }
        .status-in_progress { background-color: #fce7f3; color: #831843; }
        .status-invoiced { background-color: #c7d2fe; color: #312e81; }
    </style>
</head>
<body>
    <div class="header">
        <div>$logoPath</div>
        <div class="company-info">
            <div class="company-name">Emergency Desk</div>
            <div style="font-size: 10px; color: #6b7280;">System zarządzania zleceniami napraw</div>
        </div>
    </div>

    <div class="order-id">Zlecenie #$formattedOrderNumber</div>
    <div class="title">PROTOKÓŁ ZLECENIA</div>

    <div class="section">
        <div class="section-title">Informacje podstawowe</div>
        <div class="section-content">
            <div class="row">
                <div class="col col-label">Numer zlecenia:</div>
                <div class="col col-value">#$formattedOrderNumber</div>
                <div class="col col-label">Numer ref. klienta:</div>
                <div class="col col-value">$clientRefNo</div>
            </div>
            <div class="row">
                <div class="col col-label">Status:</div>
                <div class="col col-value"><span class="status-badge status-$statusClass">$statusLabel</span></div>
                <div class="col col-label">Typ zlecenia:</div>
                <div class="col col-value">$emergencyIcon $emergencyBadge</div>
            </div>
            <div class="row">
                <div class="col col-label">Data złożenia:</div>
                <div class="col col-value">$orderDate</div>
                <div class="col col-label">Kategoria usługi:</div>
                <div class="col col-value">$categoryName</div>
            </div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">Lokalizacja naprawy</div>
        <div class="section-content">
            <div class="row">
                <div class="col col-label">Nazwa lokacji:</div>
                <div class="col col-value">$locationName</div>
            </div>
            <div class="row">
                <div class="col col-label">Adres:</div>
                <div class="col col-value">$locationAddress</div>
            </div>
            $locationNipHtml
            $locationDescriptionHtml
        </div>
    </div>

    <div class="section">
        <div class="section-title">Dane klienta</div>
        <div class="section-content">
            <div class="row">
                <div class="col col-label">Klient:</div>
                <div class="col col-value">$clientName</div>
            </div>
            $clientContactHtml
        </div>
    </div>

    <div class="section">
        <div class="section-title">Dane technika</div>
        <div class="section-content">
            <div class="row">
                <div class="col col-label">Technik:</div>
                <div class="col col-value">$technicianName</div>
            </div>
            $techEmailHtml
            $techPhoneHtml
        </div>
    </div>

    <div class="section">
        <div class="section-title">Okresy pracy</div>
        <div class="section-content">
            <div class="row">
                <div class="col col-label">Rozpoczęcie:</div>
                <div class="col col-value">$startDate</div>
                <div class="col col-label">Zakończenie:</div>
                <div class="col col-value">$endDate</div>
            </div>
            $durationHtml
        </div>
    </div>

    <div class="section">
        <div class="section-title">Opis zlecenia</div>
        <div class="section-content">
            <div class="description-box">$descriptionContent</div>
        </div>
    </div>

    $workReportHtml

    <div class="section">
        <div class="section-title">Materiały i części</div>
        <div class="section-content">
            $materialsHtml
        </div>
    </div>

    <div class="section">
        <div class="section-title">Podsumowanie finansowe</div>
        <div class="section-content">
            <div class="summary-box">
                <div class="summary-row">
                    <div class="summary-label">Materiały:</div>
                    <div class="summary-value">$materialsPriceFormatted</div>
                </div>
                $vatHtml
                <div class="summary-row summary-total">
                    <div class="summary-label">RAZEM DO ZAPŁATY:</div>
                    <div class="summary-value">$totalPriceFormatted</div>
                </div>
            </div>
        </div>
    </div>

    <div class="footer">
        <div class="footer-section">
            <div style="margin-bottom: 20px;">Podpis technika:</div>
            <div class="signature-line"></div>
        </div>
        <div class="footer-section text-right">
            <div style="margin-bottom: 20px;">Podpis klienta:</div>
            <div class="signature-line"></div>
        </div>
        <div class="footer-section text-right">
            <div style="color: #9ca3af; font-size: 9px;">
                Wygenerowano: $generatedDate
                <br>
                $invoiceInfo
            </div>
        </div>
    </div>
</body>
</html>
HTML;
    }

    private function buildMaterialsTable(Order $order): string
    {
        if ($order->materials->isEmpty()) {
            return '<div class="empty-materials">Brak materiałów w zleceniu</div>';
        }

        $html = '<table>
            <thead>
                <tr>
                    <th>Lp.</th>
                    <th>Nazwa</th>
                    <th style="text-align: right;">Cena jednostkowa</th>
                </tr>
            </thead>
            <tbody>';

        foreach ($order->materials as $index => $material) {
            $price = $this->formatPrice($material->price);
            $name = htmlspecialchars($material->name, ENT_QUOTES, 'UTF-8');
            $html .= "<tr><td>" . ($index + 1) . "</td><td>$name</td><td style=\"text-align: right;\">$price</td></tr>";
        }

        $html .= '</tbody></table>';

        return $html;
    }

    private function formatPrice(float $price): string
    {
        return number_format($price, 2, ',', ' ') . ' zł';
    }

    private function formatDuration($startAt, $endAt): string
    {
        if (!$startAt || !$endAt) {
            return '—';
        }

        $start = \Carbon\Carbon::parse($startAt);
        $end = \Carbon\Carbon::parse($endAt);
        $diff = $end->diff($start);

        $hours = $diff->h + ($diff->days * 24);
        $minutes = $diff->i;

        return "{$hours}h {$minutes}m";
    }

    private function formatAddress($location): string
    {
        $parts = [];
        if ($location->address) $parts[] = htmlspecialchars($location->address, ENT_QUOTES, 'UTF-8');
        if ($location->number) $parts[] = htmlspecialchars($location->number, ENT_QUOTES, 'UTF-8');
        if ($location->zip) $parts[] = htmlspecialchars($location->zip, ENT_QUOTES, 'UTF-8');
        if ($location->city) $parts[] = htmlspecialchars($location->city, ENT_QUOTES, 'UTF-8');
        if ($location->country) $parts[] = htmlspecialchars($location->country, ENT_QUOTES, 'UTF-8');

        return implode(', ', $parts);
    }

    private function getStatusLabel(string $status): string
    {
        return match ($status) {
            'new' => 'Nowe',
            'assigned' => 'Przydzielone',
            'in_progress' => 'W trakcie',
            'paused' => 'Wstrzymane',
            'finished' => 'Zakończone',
            'completed' => 'Ukończone',
            'invoiced' => 'Sfakturowane',
            default => ucfirst($status),
        };
    }

    private function getLogoBase64(): string
    {
        $logoPath = public_path('images/logo-an-mar-big.png');

        if (!file_exists($logoPath)) {
            return '<div style="font-weight: bold; font-size: 14px;">Emergency Desk</div>';
        }

        $imageData = base64_encode(file_get_contents($logoPath));
        $mimeType = 'image/png';

        return '<img src="data:' . $mimeType . ';base64,' . $imageData . '" alt="Logo" class="logo" />';
    }

    private function ensureStorageDirectory(): void
    {
        if (!is_dir($this->storagePath)) {
            mkdir($this->storagePath, 0755, true);
        }
    }
}