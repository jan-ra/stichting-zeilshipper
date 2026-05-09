<?php
/**
 * 02-acf-fields.php
 *
 * Defines all ACF field groups in PHP so they are version-controlled and
 * cannot be created, edited, or deleted through the ACF admin UI.
 *
 * Bilingual fields use a `_en` suffix on the English variant. The frontend
 * helper `tc(obj, 'field')` in src/context/LanguageContext.jsx looks up
 * `obj.field` (Dutch) and falls back to `obj.field_en` when the language is
 * English, so this naming convention is the contract.
 *
 * Every group sets `show_in_graphql` and `graphql_field_name` so WPGraphQL
 * ACF v2 surfaces the fields under a predictable key — the build-time loader
 * in scripts/load-content.mjs queries each CPT by that key.
 */

add_action( 'acf/init', function () {

    if ( ! function_exists( 'acf_add_local_field_group' ) ) {
        return;
    }

    // ── UNESCO Steps ─────────────────────────────────────────────────────────
    acf_add_local_field_group( [
        'key'                   => 'group_unesco_step',
        'title'                 => 'UNESCO Step Details',
        'show_in_graphql'       => 1,
        'graphql_field_name'    => 'unescoStepFields',
        'fields'                => [
            [
                'key'      => 'field_unesco_step_number',
                'label'    => 'Step Number',
                'name'     => 'step_number',
                'type'     => 'number',
                'required' => 1,
                'min'      => 1,
                'step'     => 1,
            ],
            [
                'key'      => 'field_unesco_location_name',
                'label'    => 'Location Name',
                'name'     => 'location_name',
                'type'     => 'text',
                'required' => 1,
            ],
            [
                'key'          => 'field_unesco_coordinates',
                'label'        => 'Coordinates',
                'name'         => 'coordinates',
                'type'         => 'text',
                'instructions' => 'Latitude and longitude as a comma-separated string, e.g. 52.3676,4.9041',
                'placeholder'  => '52.3676,4.9041',
            ],
            [
                'key'           => 'field_unesco_status',
                'label'         => 'Status',
                'name'          => 'status',
                'type'          => 'select',
                'required'      => 1,
                'choices'       => [
                    'upcoming'  => 'Upcoming',
                    'active'    => 'Active',
                    'completed' => 'Completed',
                ],
                'default_value' => 'upcoming',
                'return_format' => 'value',
            ],
        ],
        'location'              => [
            [ [ 'param' => 'post_type', 'operator' => '==', 'value' => 'unesco_step' ] ],
        ],
    ] );

    // ── Ships ────────────────────────────────────────────────────────────────
    acf_add_local_field_group( [
        'key'                => 'group_ship',
        'title'              => 'Ship Details',
        'show_in_graphql'    => 1,
        'graphql_field_name' => 'shipFields',
        'fields'             => [
            [ 'key' => 'field_ship_type',       'label' => 'Type',        'name' => 'type',       'type' => 'text' ],
            [ 'key' => 'field_ship_port',       'label' => 'Home Port',   'name' => 'port',       'type' => 'text' ],
            [
                'key'           => 'field_ship_region',
                'label'         => 'Region',
                'name'          => 'region',
                'type'          => 'select',
                'choices'       => [
                    'thuiswateren' => 'Thuiswateren',
                    'europa'       => 'Europa',
                    'wereld'       => 'Wereld',
                ],
                'default_value' => 'thuiswateren',
                'return_format' => 'value',
            ],
            [ 'key' => 'field_ship_lat',        'label' => 'Latitude',    'name' => 'lat',        'type' => 'number', 'step' => 'any' ],
            [ 'key' => 'field_ship_lng',        'label' => 'Longitude',   'name' => 'lng',        'type' => 'number', 'step' => 'any' ],
            [ 'key' => 'field_ship_speed',      'label' => 'Speed (kn)',  'name' => 'speed',      'type' => 'number', 'step' => 'any' ],
            [ 'key' => 'field_ship_year',       'label' => 'Year Built',  'name' => 'year_built', 'type' => 'number', 'step' => 1 ],
            [ 'key' => 'field_ship_passengers', 'label' => 'Passengers',  'name' => 'passengers', 'type' => 'number', 'step' => 1 ],
        ],
        'location'           => [
            [ [ 'param' => 'post_type', 'operator' => '==', 'value' => 'ship' ] ],
        ],
    ] );

    // ── Blog Posts ───────────────────────────────────────────────────────────
    acf_add_local_field_group( [
        'key'                => 'group_blog_post',
        'title'              => 'Blog Post Details',
        'show_in_graphql'    => 1,
        'graphql_field_name' => 'blogPostFields',
        'fields'             => [
            [ 'key' => 'field_blog_title_en',    'label' => 'Title (EN)',     'name' => 'title_en',    'type' => 'text' ],
            [ 'key' => 'field_blog_excerpt',     'label' => 'Excerpt',        'name' => 'excerpt',     'type' => 'textarea', 'rows' => 3 ],
            [ 'key' => 'field_blog_excerpt_en',  'label' => 'Excerpt (EN)',   'name' => 'excerpt_en',  'type' => 'textarea', 'rows' => 3 ],
            [
                'key'        => 'field_blog_body',
                'label'      => 'Body (paragraphs)',
                'name'       => 'body',
                'type'       => 'repeater',
                'layout'     => 'block',
                'button_label' => 'Add paragraph',
                'sub_fields' => [
                    [ 'key' => 'field_blog_body_text', 'label' => 'Paragraph', 'name' => 'text', 'type' => 'textarea', 'rows' => 4 ],
                ],
            ],
            [
                'key'        => 'field_blog_body_en',
                'label'      => 'Body (paragraphs, EN)',
                'name'       => 'body_en',
                'type'       => 'repeater',
                'layout'     => 'block',
                'button_label' => 'Add paragraph',
                'sub_fields' => [
                    [ 'key' => 'field_blog_body_en_text', 'label' => 'Paragraph', 'name' => 'text', 'type' => 'textarea', 'rows' => 4 ],
                ],
            ],
            [ 'key' => 'field_blog_category',    'label' => 'Category',       'name' => 'category',    'type' => 'text' ],
            [ 'key' => 'field_blog_category_en', 'label' => 'Category (EN)',  'name' => 'category_en', 'type' => 'text' ],
            [ 'key' => 'field_blog_author',      'label' => 'Author Name',    'name' => 'author_name', 'type' => 'text' ],
            [
                'key'           => 'field_blog_author_photo',
                'label'         => 'Author Photo',
                'name'          => 'author_photo',
                'type'          => 'image',
                'return_format' => 'array',
                'preview_size'  => 'thumbnail',
            ],
            [ 'key' => 'field_blog_read_time',   'label' => 'Read Time',      'name' => 'read_time',   'type' => 'text', 'instructions' => 'e.g. "5 min"' ],
            [
                'key'        => 'field_blog_body_images',
                'label'      => 'Body Images',
                'name'       => 'body_images',
                'type'       => 'repeater',
                'layout'     => 'block',
                'instructions' => 'Inline images. "After paragraph" = 1-based index of the paragraph the image appears below.',
                'button_label' => 'Add image',
                'sub_fields' => [
                    [ 'key' => 'field_blog_body_image_image', 'label' => 'Image', 'name' => 'image', 'type' => 'image', 'return_format' => 'array' ],
                    [ 'key' => 'field_blog_body_image_alt',   'label' => 'Alt',   'name' => 'alt',   'type' => 'text' ],
                    [ 'key' => 'field_blog_body_image_after', 'label' => 'After paragraph', 'name' => 'after_paragraph', 'type' => 'number', 'min' => 1, 'step' => 1 ],
                ],
            ],
        ],
        'location'           => [
            [ [ 'param' => 'post_type', 'operator' => '==', 'value' => 'blog_post' ] ],
        ],
    ] );

    // ── Info Boards (Harbours) ───────────────────────────────────────────────
    acf_add_local_field_group( [
        'key'                => 'group_info_board',
        'title'              => 'Info Board Details',
        'show_in_graphql'    => 1,
        'graphql_field_name' => 'infoBoardFields',
        'fields'             => [
            [ 'key' => 'field_ib_lat',     'label' => 'Latitude',        'name' => 'lat',     'type' => 'number', 'step' => 'any' ],
            [ 'key' => 'field_ib_lng',     'label' => 'Longitude',       'name' => 'lng',     'type' => 'number', 'step' => 'any' ],
            [
                'key'           => 'field_ib_status',
                'label'         => 'Status',
                'name'          => 'status',
                'type'          => 'select',
                'choices'       => [
                    'afgerond'  => 'Afgerond',
                    'ingediend' => 'Ingediend',
                    'kandidaat' => 'Kandidaat',
                ],
                'default_value' => 'kandidaat',
                'return_format' => 'value',
            ],
            [ 'key' => 'field_ib_ships',     'label' => 'Ship Count',  'name' => 'ships',      'type' => 'number', 'step' => 1 ],
            [ 'key' => 'field_ib_notes',     'label' => 'Notes',       'name' => 'notes',      'type' => 'textarea', 'rows' => 3 ],
            [ 'key' => 'field_ib_notes_en',  'label' => 'Notes (EN)',  'name' => 'notes_en',   'type' => 'textarea', 'rows' => 3 ],
            [ 'key' => 'field_ib_date',      'label' => 'Date Label',  'name' => 'date_label', 'type' => 'text', 'instructions' => 'e.g. "Afgerond 2023" or "Kandidaat"' ],
        ],
        'location'           => [
            [ [ 'param' => 'post_type', 'operator' => '==', 'value' => 'info_board' ] ],
        ],
    ] );

    // ── Team Members ─────────────────────────────────────────────────────────
    acf_add_local_field_group( [
        'key'                => 'group_team_member',
        'title'              => 'Team Member Details',
        'show_in_graphql'    => 1,
        'graphql_field_name' => 'teamMemberFields',
        'fields'             => [
            [ 'key' => 'field_team_role',         'label' => 'Role',            'name' => 'role',         'type' => 'text' ],
            [ 'key' => 'field_team_role_en',      'label' => 'Role (EN)',       'name' => 'role_en',      'type' => 'text' ],
            [ 'key' => 'field_team_location',     'label' => 'Location',        'name' => 'location',     'type' => 'text' ],
            [ 'key' => 'field_team_since',        'label' => 'Member Since',    'name' => 'since',        'type' => 'text', 'instructions' => 'e.g. "2021"' ],
            [ 'key' => 'field_team_bio',          'label' => 'Bio',             'name' => 'bio',          'type' => 'textarea', 'rows' => 6 ],
            [ 'key' => 'field_team_bio_en',       'label' => 'Bio (EN)',        'name' => 'bio_en',       'type' => 'textarea', 'rows' => 6 ],
            [ 'key' => 'field_team_expertise',    'label' => 'Expertise',       'name' => 'expertise',    'type' => 'text', 'instructions' => 'Comma-separated' ],
            [ 'key' => 'field_team_expertise_en', 'label' => 'Expertise (EN)',  'name' => 'expertise_en', 'type' => 'text', 'instructions' => 'Comma-separated' ],
        ],
        'location'           => [
            [ [ 'param' => 'post_type', 'operator' => '==', 'value' => 'team_member' ] ],
        ],
    ] );

    // ── Media Items ──────────────────────────────────────────────────────────
    acf_add_local_field_group( [
        'key'                => 'group_media_item',
        'title'              => 'Media Item Details',
        'show_in_graphql'    => 1,
        'graphql_field_name' => 'mediaItemFields',
        'fields'             => [
            [
                'key'           => 'field_media_type',
                'label'         => 'Media Type',
                'name'          => 'media_type',
                'type'          => 'select',
                'choices'       => [
                    'video'   => 'Video',
                    'photo'   => 'Photo',
                    'text'    => 'Text',
                    'podcast' => 'Podcast',
                    'project' => 'Project',
                ],
                'default_value' => 'video',
                'return_format' => 'value',
            ],
            [ 'key' => 'field_media_title_en',       'label' => 'Title (EN)',        'name' => 'title_en',       'type' => 'text' ],
            [ 'key' => 'field_media_description',    'label' => 'Description',       'name' => 'description',    'type' => 'textarea', 'rows' => 3 ],
            [ 'key' => 'field_media_description_en', 'label' => 'Description (EN)',  'name' => 'description_en', 'type' => 'textarea', 'rows' => 3 ],
            [ 'key' => 'field_media_category',       'label' => 'Category',          'name' => 'category',       'type' => 'text', 'instructions' => 'video, foto, tekst, project, podcast' ],
            [ 'key' => 'field_media_tag',            'label' => 'Tag',               'name' => 'tag',            'type' => 'text' ],
            [ 'key' => 'field_media_tag_en',         'label' => 'Tag (EN)',          'name' => 'tag_en',         'type' => 'text' ],
            [ 'key' => 'field_media_format',         'label' => 'File Format',       'name' => 'file_format',    'type' => 'text', 'instructions' => 'e.g. MP4, ZIP, PDF, MP3' ],
            [
                'key'           => 'field_media_file',
                'label'         => 'File',
                'name'          => 'file',
                'type'          => 'file',
                'return_format' => 'array',
                'instructions'  => 'Optional. Use this when the asset is uploaded to the Media Library.',
            ],
            [
                'key'   => 'field_media_external_url',
                'label' => 'External URL',
                'name'  => 'external_url',
                'type'  => 'url',
                'instructions' => 'Optional. Use this when the asset lives on an external host (e.g. Vimeo, Spotify, R2).',
            ],
        ],
        'location'           => [
            [ [ 'param' => 'post_type', 'operator' => '==', 'value' => 'media_item' ] ],
        ],
    ] );
} );
