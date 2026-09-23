<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Photo;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class PhotoService
{
    /**
     * Move temporary photos to order-specific folder
     */
    public function moveTemporaryPhotosToOrder(Order $order): void
    {
        // Get all temporary photos for this order
        $photos = $order->photos()
            ->where('type', '!=', 'temporary')
            ->get();

        foreach ($photos as $photo) {
            try {
                $this->movePhotoFile($photo, $order);
            } catch (\Exception $e) {
                Log::error("Failed to move photo {$photo->id}: " . $e->getMessage());
                // Continue with next photo, don't fail the whole process
            }
        }
    }

    /**
     * Move a single photo file from temporary to order folder
     */
    private function movePhotoFile(Photo $photo, Order $order): void
    {
        // Parse the URL to get the actual path
        // URL format: /storage/temporary/1/image.jpg or /storage/orders/5/image.jpg
        $urlPath = str_replace('/storage/', '', $photo->url);

        // Check if already in orders folder
        if (str_starts_with($urlPath, 'orders/')) {
            return; // Already in correct location
        }

        // Check if in temporary folder
        if (!str_starts_with($urlPath, 'temporary/')) {
            Log::warning("Photo {$photo->id} is in unexpected location: {$urlPath}");
            return;
        }

        // Extract filename from path
        $filename = basename($urlPath);
        $newPath = "orders/{$order->id}/{$filename}";

        // Move file in storage
        if (Storage::disk('public')->exists($urlPath)) {
            // Create orders/{order_id} directory if it doesn't exist
            if (!Storage::disk('public')->exists("orders/{$order->id}")) {
                Storage::disk('public')->makeDirectory("orders/{$order->id}");
            }

            // Move the file
            Storage::disk('public')->move($urlPath, $newPath);

            // Update photo URL in database
            $photo->update([
                'url' => '/storage/' . $newPath,
            ]);

            Log::info("Moved photo {$photo->id} from {$urlPath} to {$newPath}");
        } else {
            Log::warning("Photo file not found at: {$urlPath}");
        }
    }

    /**
     * Clean up abandoned temporary photos older than specified days
     */
    public function deleteAbandonedTemporaryPhotos($userId, int $daysOld = 7): void
    {
        $cutoffDate = now()->subDays($daysOld);

        $photos = Photo::where('user_id', $userId)
            ->whereNull('order_id')
            ->where('type', 'temporary')
            ->where('created_at', '<', $cutoffDate)
            ->get();

        foreach ($photos as $photo) {
            try {
                $this->deletePhotoFile($photo);
            } catch (\Exception $e) {
                Log::error("Failed to delete photo {$photo->id}: " . $e->getMessage());
            }
        }
    }

    /**
     * Delete a photo file and database record
     */
    public function deletePhotoFile(Photo $photo): void
    {
        $urlPath = str_replace('/storage/', '', $photo->url);

        // Delete file from storage
        if (Storage::disk('public')->exists($urlPath)) {
            Storage::disk('public')->delete($urlPath);
        }

        // Delete from database
        $photo->delete();

        Log::info("Deleted photo {$photo->id} from {$urlPath}");
    }
}
