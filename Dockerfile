FROM php:8.2-cli

# Install system dependencies
# libjpeg-turbo-progs dla JPEG support w GD library
RUN apt-get update && apt-get install -y \
    git \
    curl \
    unzip \
    netcat-openbsd \
    default-mysql-client \
    libzip-dev \
    zlib1g-dev \
    libpng-dev \
    libjpeg-dev \
    libjpeg-turbo-progs \
    && docker-php-ext-configure gd --with-jpeg \
    && docker-php-ext-install pdo pdo_mysql zip gd ftp

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Copy entrypoint
COPY entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["entrypoint.sh"]