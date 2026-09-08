<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .content { margin-bottom: 20px; }
        .panel { background-color: #e8f4f8; padding: 15px; border-left: 4px solid #3b82f6; margin-bottom: 20px; }
        .footer { color: #666; font-size: 12px; border-top: 1px solid #ddd; padding-top: 20px; }
        strong { color: #1f2937; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Protokół Zlecenia</h2>
        </div>

        <div class="content">
            <p>Szanowni Państwo,</p>
            <p>Przesyłamy Państwu protokół wykonanego zlecenia serwisowego.</p>

            <div class="panel">
                <p><strong>Numer zlecenia:</strong> {{ $orderNumber }}</p>
                <p><strong>Lokalizacja:</strong> {{ $locationName }}</p>
                <p><strong>Data wysłania:</strong> {{ now()->format('d.m.Y H:i') }}</p>
            </div>

            <p>Protokół znajduje się w załączniku do niniejszej wiadomości.</p>
            <p>W razie pytań prosimy o kontakt.</p>
        </div>

        <div class="footer">
            <p>Pozdrawiamy,<br><strong>Zespół Emergency Desk</strong></p>
        </div>
    </div>
</body>
</html>
