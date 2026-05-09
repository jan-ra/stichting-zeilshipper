<?php
/**
 * 01-post-types.php
 *
 * Registers the seven custom post types.
 * All are exposed to the REST API (show_in_rest) and WPGraphQL.
 * Custom capability_type + map_meta_cap gives each type its own permission set
 * so the content_editor role can be scoped precisely in 04-roles.php.
 */

add_action( 'init', function () {

    // ── Ships ────────────────────────────────────────────────────────────────
    register_post_type( 'ship', [
        'labels'              => [
            'name'          => 'Ships',
            'singular_name' => 'Ship',
            'add_new_item'  => 'Add New Ship',
            'edit_item'     => 'Edit Ship',
            'all_items'     => 'All Ships',
        ],
        'public'              => true,
        'show_in_rest'        => true,
        'show_in_graphql'     => true,
        'graphql_single_name' => 'ship',
        'graphql_plural_name' => 'ships',
        'supports'            => [ 'title', 'thumbnail', 'editor' ],
        'capability_type'     => 'ship',
        'map_meta_cap'        => true,
        'menu_icon'           => 'dashicons-anchor',
        'has_archive'         => true,
        'rewrite'             => [ 'slug' => 'ships' ],
    ] );

    // ── Blog Posts ───────────────────────────────────────────────────────────
    register_post_type( 'blog_post', [
        'labels'              => [
            'name'          => 'Blog Posts',
            'singular_name' => 'Blog Post',
            'add_new_item'  => 'Add New Blog Post',
            'edit_item'     => 'Edit Blog Post',
            'all_items'     => 'All Blog Posts',
        ],
        'public'              => true,
        'show_in_rest'        => true,
        'show_in_graphql'     => true,
        'graphql_single_name' => 'blogPost',
        'graphql_plural_name' => 'blogPosts',
        'supports'            => [ 'title', 'thumbnail', 'editor', 'excerpt' ],
        'capability_type'     => [ 'blog_post', 'blog_posts' ],
        'map_meta_cap'        => true,
        'menu_icon'           => 'dashicons-edit',
        'has_archive'         => true,
        'rewrite'             => [ 'slug' => 'blog' ],
    ] );

    // ── UNESCO Steps ─────────────────────────────────────────────────────────
    register_post_type( 'unesco_step', [
        'labels'              => [
            'name'          => 'UNESCO Steps',
            'singular_name' => 'UNESCO Step',
            'add_new_item'  => 'Add New UNESCO Step',
            'edit_item'     => 'Edit UNESCO Step',
            'all_items'     => 'All UNESCO Steps',
        ],
        'public'              => true,
        'show_in_rest'        => true,
        'show_in_graphql'     => true,
        'graphql_single_name' => 'unescoStep',
        'graphql_plural_name' => 'unescoSteps',
        'supports'            => [ 'title', 'editor', 'thumbnail' ],
        'capability_type'     => [ 'unesco_step', 'unesco_steps' ],
        'map_meta_cap'        => true,
        'menu_icon'           => 'dashicons-location',
        'has_archive'         => true,
        'rewrite'             => [ 'slug' => 'unesco-steps' ],
    ] );

    // ── Custom Texts (internal snippets, not a public post type) ─────────────
    register_post_type( 'custom_text', [
        'labels'              => [
            'name'          => 'Custom Texts',
            'singular_name' => 'Custom Text',
            'add_new_item'  => 'Add New Custom Text',
            'edit_item'     => 'Edit Custom Text',
            'all_items'     => 'All Custom Texts',
        ],
        'public'              => false,
        'show_ui'             => true,
        'show_in_menu'        => true,
        'show_in_rest'        => true,
        'show_in_graphql'     => true,
        'graphql_single_name' => 'customText',
        'graphql_plural_name' => 'customTexts',
        'supports'            => [ 'title', 'editor' ],
        'capability_type'     => [ 'custom_text', 'custom_texts' ],
        'map_meta_cap'        => true,
        'menu_icon'           => 'dashicons-text',
        'has_archive'         => false,
    ] );

    // ── Info Boards ──────────────────────────────────────────────────────────
    register_post_type( 'info_board', [
        'labels'              => [
            'name'          => 'Info Boards',
            'singular_name' => 'Info Board',
            'add_new_item'  => 'Add New Info Board',
            'edit_item'     => 'Edit Info Board',
            'all_items'     => 'All Info Boards',
        ],
        'public'              => true,
        'show_in_rest'        => true,
        'show_in_graphql'     => true,
        'graphql_single_name' => 'infoBoard',
        'graphql_plural_name' => 'infoBoards',
        'supports'            => [ 'title', 'editor', 'thumbnail' ],
        'capability_type'     => [ 'info_board', 'info_boards' ],
        'map_meta_cap'        => true,
        'menu_icon'           => 'dashicons-clipboard',
        'has_archive'         => true,
        'rewrite'             => [ 'slug' => 'info-boards' ],
    ] );

    // ── Team Members ─────────────────────────────────────────────────────────
    register_post_type( 'team_member', [
        'labels'              => [
            'name'          => 'Team Members',
            'singular_name' => 'Team Member',
            'add_new_item'  => 'Add New Team Member',
            'edit_item'     => 'Edit Team Member',
            'all_items'     => 'All Team Members',
        ],
        'public'              => true,
        'show_in_rest'        => true,
        'show_in_graphql'     => true,
        'graphql_single_name' => 'teamMember',
        'graphql_plural_name' => 'teamMembers',
        'supports'            => [ 'title', 'thumbnail' ],
        'capability_type'     => [ 'team_member', 'team_members' ],
        'map_meta_cap'        => true,
        'menu_icon'           => 'dashicons-groups',
        'has_archive'         => true,
        'rewrite'             => [ 'slug' => 'team' ],
    ] );

    // ── Media Items ──────────────────────────────────────────────────────────
    register_post_type( 'media_item', [
        'labels'              => [
            'name'          => 'Media Items',
            'singular_name' => 'Media Item',
            'add_new_item'  => 'Add New Media Item',
            'edit_item'     => 'Edit Media Item',
            'all_items'     => 'All Media Items',
        ],
        'public'              => true,
        'show_in_rest'        => true,
        'show_in_graphql'     => true,
        'graphql_single_name' => 'mediaItem',
        'graphql_plural_name' => 'mediaItems',
        'supports'            => [ 'title', 'thumbnail' ],
        'capability_type'     => [ 'media_item', 'media_items' ],
        'map_meta_cap'        => true,
        'menu_icon'           => 'dashicons-format-video',
        'has_archive'         => true,
        'rewrite'             => [ 'slug' => 'media' ],
    ] );
} );
