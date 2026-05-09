<?php
/**
 * 00-hardening.php
 *
 * Security hardening applied unconditionally on every request:
 *  - Headless mode: all PHP-rendered frontend pages return 404 JSON
 *  - REST API requires authentication
 *  - XML-RPC fully disabled
 *  - Comments and pings disabled globally
 *  - Posts and Comments removed from admin menu
 */

// ── Headless: block all PHP-rendered frontend pages ─────────────────────────
// WPGraphQL (/graphql), the REST API (/wp-json), wp-admin, wp-login.php, and
// WP-Cron are all resolved before template_redirect fires, so they are
// unaffected. Anything that reaches this hook is a classic theme template
// request — return a 404 JSON response instead of rendering PHP.
add_action( 'template_redirect', function () {
    // Safety valves: cron and AJAX run in contexts that should never reach
    // template_redirect, but guard anyway.
    if ( ( defined( 'DOING_CRON' ) && DOING_CRON ) ||
         ( defined( 'DOING_AJAX' ) && DOING_AJAX ) ) {
        return;
    }

    status_header( 404 );
    nocache_headers();
    header( 'Content-Type: application/json; charset=utf-8' );
    echo wp_json_encode( [
        'error'   => 'headless',
        'message' => 'This WordPress installation is headless. Fetch content via the GraphQL API at /graphql.',
    ] );
    exit;
}, 1 );

// ── XML-RPC ─────────────────────────────────────────────────────────────────
add_filter( 'xmlrpc_enabled', '__return_false' );

// ── REST API: require authentication ────────────────────────────────────────
add_filter( 'rest_authentication_errors', function ( $result ) {
    if ( ! empty( $result ) ) {
        return $result;
    }
    if ( ! is_user_logged_in() ) {
        return new WP_Error(
            'rest_not_logged_in',
            'You must be logged in to use the REST API.',
            [ 'status' => 401 ]
        );
    }
    return $result;
} );

// ── WPGraphQL: allow public read access and schema introspection ─────────────
// The REST API auth filter does not affect WPGraphQL — it uses its own
// permission layer. Published content is readable without authentication by
// default. We also enable public introspection so build-time tools such as
// graphql-codegen can fetch the schema without a WordPress login.
add_filter( 'graphql_jwt_auth_secret_key', '__return_empty_string' ); // no JWT needed
add_filter( 'graphql_public_introspection_enabled', '__return_true' );

// ── Comments and pings ───────────────────────────────────────────────────────
add_filter( 'comments_open',  '__return_false', 20, 2 );
add_filter( 'pings_open',     '__return_false', 20, 2 );
add_filter( 'comments_array', '__return_empty_array', 10, 2 );

add_action( 'init', function () {
    foreach ( get_post_types() as $type ) {
        remove_post_type_support( $type, 'comments' );
        remove_post_type_support( $type, 'trackbacks' );
    }
}, 100 );

// ── Admin menu cleanup ───────────────────────────────────────────────────────
add_action( 'admin_menu', function () {
    remove_menu_page( 'edit.php' );           // Posts
    remove_menu_page( 'edit-comments.php' );  // Comments
} );
