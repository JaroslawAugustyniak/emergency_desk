#!/bin/bash

# Wait for MySQL to be ready
echo "Waiting for MySQL to be ready..."
for i in {1..30}; do
  if nc -z mysql 3306 2>/dev/null; then
    echo "MySQL is ready!"
    break
  fi
  echo "MySQL not ready, waiting... ($i/30)"
  sleep 1
done

# Install dependencies
echo "Installing Composer dependencies..."
composer install

# Generate APP_KEY if empty
if [ -z "$(grep '^APP_KEY=' .env | cut -d= -f2)" ] || [ "$(grep '^APP_KEY=' .env | cut -d= -f2)" = "" ]; then
    echo "Generating APP_KEY..."
    php artisan key:generate
fi

# Clear caches
echo "Clearing caches..."
php artisan config:clear
php artisan route:clear
php artisan cache:clear

# Run migrations (only for web/backend, not for queue worker)
if [ "$CONTAINER_TYPE" != "queue-worker" ]; then
  echo "Running migrations..."
  php artisan migrate --force
fi

# Execute based on container type
if [ "$CONTAINER_TYPE" = "queue-worker" ]; then
  echo "Starting queue worker..."
  exec php artisan queue:work --delay=3 --max-jobs=1000 --max-time=3600
elif [ $# -gt 0 ]; then
  echo "Executing command: $@"
  exec "$@"
else
  echo "Starting Laravel development server..."
  php artisan serve --host=0.0.0.0 --port=8000
fi