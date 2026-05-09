<?php
/**
 * 03-admin-ui.php
 *
 * Strips the admin UI down to only what a content team needs:
 *  - Removes unnecessary top-level menu pages
 *  - Removes dashboard noise (welcome panel, news feed, etc.)
 *  - Removes the "Visit Site" admin-bar link
 *  - Scopes the media library so non-admins see only their own uploads
 */

// ── Admin menu: keep only Media and the custom post types ───────────────────
add_action( 'admin_menu', function () {
    remove_menu_page( 'edit.php' );                   // Posts (built-in)
    remove_menu_page( 'edit.php?post_type=page' );    // Pages (built-in, unused in headless)
    remove_menu_page( 'edit-comments.php' );          // Comments
    remove_menu_page( 'themes.php' );                 // Appearance
    remove_menu_page( 'plugins.php' );                // Plugins
    remove_menu_page( 'tools.php' );                  // Tools
    remove_menu_page( 'options-general.php' );        // Settings
}, 999 );

// ── Dashboard widgets ────────────────────────────────────────────────────────
add_action( 'wp_dashboard_setup', function () {
    remove_meta_box( 'dashboard_primary',     'dashboard', 'side'   ); // WordPress News
    remove_meta_box( 'dashboard_quick_press', 'dashboard', 'side'   ); // Quick Draft
    remove_meta_box( 'dashboard_right_now',   'dashboard', 'normal' ); // At a Glance
    remove_meta_box( 'dashboard_activity',    'dashboard', 'normal' ); // Activity
    remove_meta_box( 'dashboard_site_health', 'dashboard', 'normal' ); // Site Health
} );

// Hide the "Welcome to WordPress" panel for all users
add_action( 'admin_init', function () {
    remove_action( 'welcome_panel', 'wp_welcome_panel' );
} );

// ── Admin bar: remove "Visit Site" ──────────────────────────────────────────
add_action( 'admin_bar_menu', function ( WP_Admin_Bar $bar ) {
    $bar->remove_node( 'site-name' );
    $bar->remove_node( 'view-site' );
    $bar->remove_node( 'comments' );
}, 999 );

// ── Media library: non-admins see only their own uploads ────────────────────

// Media library grid view (AJAX)
add_filter( 'ajax_query_attachments_args', function ( array $query ) {
    if ( ! current_user_can( 'manage_options' ) ) {
        $query['author'] = get_current_user_id();
    }
    return $query;
} );

// Media library list view
add_action( 'pre_get_posts', function ( WP_Query $query ) {
    if (
        ! is_admin()
        || ! $query->is_main_query()
        || current_user_can( 'manage_options' )
    ) {
        return;
    }

    if ( 'attachment' === $query->get( 'post_type' ) ) {
        $query->set( 'author', get_current_user_id() );
    }
} );
