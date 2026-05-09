FROM wordpress:6.7.2

# System utilities needed by WP-CLI and plugin download
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        less \
        default-mysql-client \
        unzip \
        curl \
    && rm -rf /var/lib/apt/lists/*

# WP-CLI
RUN curl -sS -o /usr/local/bin/wp https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar \
    && chmod +x /usr/local/bin/wp

# Download plugins at build time so the image is self-contained.
# Activation happens at runtime (needs a live DB).
RUN mkdir -p /usr/src/wordpress/wp-content/plugins \
    && curl -sS -Lo /tmp/acf.zip \
        https://downloads.wordpress.org/plugin/advanced-custom-fields.latest-stable.zip \
    && unzip -q /tmp/acf.zip -d /usr/src/wordpress/wp-content/plugins/ \
    && rm /tmp/acf.zip \
    && curl -sS -Lo /tmp/wpgraphql.zip \
        https://downloads.wordpress.org/plugin/wp-graphql.latest-stable.zip \
    && unzip -q /tmp/wpgraphql.zip -d /usr/src/wordpress/wp-content/plugins/ \
    && rm /tmp/wpgraphql.zip \
    && curl -sS -Lo /tmp/wpgraphql-acf.zip \
        https://downloads.wordpress.org/plugin/wpgraphql-acf.latest-stable.zip \
    && unzip -q /tmp/wpgraphql-acf.zip -d /usr/src/wordpress/wp-content/plugins/ \
    && rm /tmp/wpgraphql-acf.zip

# Store mu-plugins in a canonical source location separate from the
# WordPress webroot so the official entrypoint's rsync cannot touch them.
# docker-setup.sh copies from here on every container start.
COPY mu-plugins/ /usr/local/mu-plugins/

# Also seed into /usr/src/wordpress so the first-install rsync picks them up.
RUN cp -r /usr/local/mu-plugins/. /usr/src/wordpress/wp-content/mu-plugins/

COPY docker-setup.sh /usr/local/bin/docker-setup.sh
RUN chmod +x /usr/local/bin/docker-setup.sh

ENTRYPOINT ["docker-setup.sh"]
CMD ["apache2-foreground"]
