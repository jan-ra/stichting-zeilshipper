#!/bin/bash
# Custom entrypoint: wraps the official WordPress entrypoint to add
# WP-CLI setup (core install, plugin activation) after the DB is ready.
set -euo pipefail

# Force the baked-in mu-plugins into the webroot on every container start.
# This ensures admins cannot permanently modify them through the volume.
_sync_mu_plugins() {
    mkdir -p /var/www/html/wp-content/mu-plugins
    cp -rf /usr/local/mu-plugins/. /var/www/html/wp-content/mu-plugins/
    chown -R www-data:www-data /var/www/html/wp-content/mu-plugins/
    # Directories need the execute bit so PHP can open them; files do not.
    find /var/www/html/wp-content/mu-plugins -type d -exec chmod 755 {} +
    find /var/www/html/wp-content/mu-plugins -type f -exec chmod 644 {} +
}

_sync_mu_plugins

# Start the official WordPress entrypoint (creates wp-config.php) and Apache in
# the background. exec inside docker-entrypoint.sh replaces the subshell with
# Apache, so MAIN_PID ends up pointing to the Apache process.
/usr/local/bin/docker-entrypoint.sh "$@" &
MAIN_PID=$!

# Wait for the original entrypoint to write wp-config.php before we do anything
echo "[setup] Waiting for wp-config.php..."
until [ -f /var/www/html/wp-config.php ]; do sleep 1; done

# Re-sync after the WP entrypoint's rsync may have overwritten our files
_sync_mu_plugins

# Wait for MariaDB to accept connections
DB_HOST="${WORDPRESS_DB_HOST:-db}"
DB_HOST="${DB_HOST%%:*}"  # strip port if present
echo "[setup] Waiting for database at ${DB_HOST}..."
until mysqladmin ping -h "$DB_HOST" \
        -u "${WORDPRESS_DB_USER:-wordpress}" \
        -p"${WORDPRESS_DB_PASSWORD:-wordpress}" \
        --silent 2>/dev/null; do
    sleep 2
done

WP="wp --allow-root --path=/var/www/html"

# Install WordPress core on a fresh database
if ! $WP core is-installed 2>/dev/null; then
    echo "[setup] Installing WordPress core..."
    $WP core install \
        --url="http://localhost:8080" \
        --title="${WP_TITLE:-Stichting Zeilshipper}" \
        --admin_user="${WP_ADMIN_USER:-admin}" \
        --admin_password="${WP_ADMIN_PASSWORD:-changeme}" \
        --admin_email="${WP_ADMIN_EMAIL:-admin@localhost}" \
        --skip-email
fi

# Activate plugins (idempotent — safe to call on every restart)
echo "[setup] Activating plugins..."
$WP plugin activate \
    advanced-custom-fields \
    wp-graphql \
    wpgraphql-acf \
    --quiet 2>/dev/null || true

echo "[setup] WordPress is ready at http://localhost:8080"

# Keep the container alive by waiting on Apache
wait "$MAIN_PID"
