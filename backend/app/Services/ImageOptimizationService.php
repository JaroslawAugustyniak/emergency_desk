<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ImageOptimizationService
{
    // Maximum width for optimized images
    private int $maxWidth = 1920;

    // Maximum height for optimized images
    private int $maxHeight = 1440;

    // JPEG quality (0-100) - higher = better quality, larger file
    private int $jpegQuality = 80;

    // PNG compression level (0-9) - higher = smaller file, slower compression
    private int $pngCompression = 9;

    /**
     * Optimize and store image
     * 1. Kompresuje obraz
     * 2. Zmniejsza rozmiar (resize) jeśli potrzeba
     * 3. Konwertuje do efektywnego formatu (JPEG dla zdjęć)
     * 4. Usuwa metadata (EXIF - bezpieczeństwo + rozmiar)
     * 5. Zapisuje na dysk
     */
    public function optimizeAndStore(UploadedFile $file, string $directory): string
    {
        try {
            Log::info("Starting image optimization for: {$file->getClientOriginalName()}");

            // Krok 1: Załaduj oryginalny obraz do pamięci
            $image = $this->loadImage($file);

            if (!$image) {
                throw new \Exception("Failed to load image");
            }

            // Krok 2: Zmniejsz rozmiar (resize) jeśli obraz jest zbyt duży
            $this->resizeIfNeeded($image);

            // Krok 3: Uzyskaj informacje o oryginalnym formacie
            $originalFormat = $file->getClientOriginalExtension();

            // Krok 4: Wygeneruj nazwę pliku
            $filename = $this->generateFilename($originalFormat);

            // Krok 5: Zapisz zoptymalizowany obraz
            $path = $this->saveOptimizedImage($image, $directory, $filename, $originalFormat);

            // Krok 6: Zwolnij zasoby (ważne dla dużych obrazów)
            imagedestroy($image);

            Log::info("Image optimization completed: {$path}");

            return $path;
        } catch (\Exception $e) {
            Log::error("Image optimization failed: " . $e->getMessage());
            // Jeśli optymalizacja się nie powiedzie, wrzuć oryginalny plik
            return $file->store($directory, 'public');
        }
    }

    /**
     * Załaduj obraz do pamięci
     * Obsługuje: JPEG, PNG, GIF, WebP
     */
    private function loadImage(UploadedFile $file)
    {
        $filePath = $file->getRealPath();
        $mimeType = $file->getMimeType();

        Log::info("Loading image - MIME: {$mimeType}, Size: " . filesize($filePath) . " bytes");

        return match ($mimeType) {
            'image/jpeg' => imagecreatefromjpeg($filePath),
            'image/png' => imagecreatefrompng($filePath),
            'image/gif' => imagecreatefromgif($filePath),
            'image/webp' => imagecreatefromwebp($filePath),
            default => null,
        };
    }

    /**
     * Zmniejsz rozmiar obrazu (resize) jeśli przekracza limity
     * Zachowuje aspect ratio
     */
    private function resizeIfNeeded(&$image): void
    {
        $width = imagesx($image);
        $height = imagesy($image);

        Log::info("Original dimensions: {$width}x{$height}");

        // Jeśli obraz jest mniejszy niż limity, nie zmieniaj
        if ($width <= $this->maxWidth && $height <= $this->maxHeight) {
            Log::info("Image is within size limits, no resize needed");
            return;
        }

        // Oblicz nowe wymiary zachowując aspect ratio
        $ratio = $width / $height;
        $newWidth = $this->maxWidth;
        $newHeight = (int)($this->maxWidth / $ratio);

        if ($newHeight > $this->maxHeight) {
            $newHeight = $this->maxHeight;
            $newWidth = (int)($this->maxHeight * $ratio);
        }

        Log::info("Resizing to: {$newWidth}x{$newHeight}");

        // Utwórz nowy obraz ze zmniejszonymi wymiarami
        $resized = imagecreatetruecolor($newWidth, $newHeight);

        // Zachowaj przezroczystość dla PNG
        imagealphablending($resized, false);
        imagesavealpha($resized, true);

        // Skopiuj i zmniejsz obraz
        imagecopyresampled(
            $resized, $image,
            0, 0, 0, 0,
            $newWidth, $newHeight,
            $width, $height
        );

        // Zamień referencję (původní $image został zastąpiony nowym)
        imagedestroy($image);
        $image = $resized;
    }

    /**
     * Zapisz zoptymalizowany obraz
     * Konwertuje wszystkie formaty na JPEG (lepszy stosunek wielkości do jakości)
     * PNG zostaje zachowany ze względu na przezroczystość
     */
    private function saveOptimizedImage($image, string $directory, string $filename, string $originalFormat): string
    {
        $disk = Storage::disk('public');

        // Utwórz katalog jeśli nie istnieje
        if (!$disk->exists($directory)) {
            $disk->makeDirectory($directory, 0755, true);
        }

        $tempPath = storage_path('app/temp_' . $filename);

        try {
            // Zdecyduj o formacie docelowym
            // PNG zostaje PNG (transparentność), inne → JPEG (kompresja)
            if ($originalFormat === 'png') {
                Log::info("Saving as PNG with compression level {$this->pngCompression}");
                imagepng($image, $tempPath, $this->pngCompression);
            } else {
                // Konwertuj na JPEG (lepszy rozmiar)
                Log::info("Converting to JPEG with quality {$this->jpegQuality}");
                imagejpeg($image, $tempPath, $this->jpegQuality);
            }

            // Sprawdź rozmiar pliku
            $fileSize = filesize($tempPath);
            Log::info("Optimized file size: {$fileSize} bytes");

            // Przenieś z temp do docelowej lokalizacji
            $path = $directory . '/' . $filename;
            $disk->put(
                $path,
                file_get_contents($tempPath)
            );

            // Usuń temp plik
            @unlink($tempPath);

            return $path;
        } finally {
            // Sprzątanie
            if (file_exists($tempPath)) {
                @unlink($tempPath);
            }
        }
    }

    /**
     * Wygeneruj unikalną nazwę pliku
     * Format: timestamp_random.extension
     */
    private function generateFilename(string $originalFormat): string
    {
        // Konwertuj format do rozszerzenia
        $extension = match ($originalFormat) {
            'png' => 'png',
            default => 'jpg', // JPEG dla wszystkich innych
        };

        return time() . '_' . bin2hex(random_bytes(4)) . '.' . $extension;
    }
}
