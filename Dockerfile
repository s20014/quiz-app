FROM php:8.4-apache

# Node.js 22.x をインストール
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get update && apt-get install -y nodejs

# 必要なPHP拡張のインストール
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libzip-dev \
    zip \
    libonig-dev \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    libicu-dev \
    xdg-utils \
    cron \
    vim \
    && docker-php-ext-install pdo pdo_mysql gd intl zip pcntl \
    && pecl install redis \
    && docker-php-ext-enable redis

# Composerインストール
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# ApacheのDocumentRoot設定
RUN sed -i 's|/var/www/html|/var/www/public|g' /etc/apache2/sites-available/000-default.conf
# Apacheの設定を反映
RUN a2enmod rewrite

# timezoneの設定
RUN ln -sf /usr/share/zoneinfo/Asia/Tokyo /etc/localtime

# php.ini
COPY php.ini /usr/local/etc/php/

# Laravel用のディレクトリ作成と権限設定
RUN mkdir -p /var/www/storage /var/www/bootstrap/cache
RUN chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache
RUN usermod -u 1000 www-data && groupmod -g 1000 www-data
