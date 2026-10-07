import * as migration_20260717_205802_initial from './20260717_205802_initial';
import * as migration_20260806_181125_youtube_videos from './20260806_181125_youtube_videos';
import * as migration_20260927_200000_content_youtube_videos from './20260927_200000_content_youtube_videos';
import * as migration_20261007_201332_ship_crew_website from './20261007_201332_ship_crew_website';
import * as migration_20261007_201941_ship_area from './20261007_201941_ship_area';

export const migrations = [
  {
    up: migration_20260717_205802_initial.up,
    down: migration_20260717_205802_initial.down,
    name: '20260717_205802_initial',
  },
  {
    up: migration_20260806_181125_youtube_videos.up,
    down: migration_20260806_181125_youtube_videos.down,
    name: '20260806_181125_youtube_videos',
  },
  {
    up: migration_20260927_200000_content_youtube_videos.up,
    down: migration_20260927_200000_content_youtube_videos.down,
    name: '20260927_200000_content_youtube_videos',
  },
  {
    up: migration_20261007_201332_ship_crew_website.up,
    down: migration_20261007_201332_ship_crew_website.down,
    name: '20261007_201332_ship_crew_website',
  },
  {
    up: migration_20261007_201941_ship_area.up,
    down: migration_20261007_201941_ship_area.down,
    name: '20261007_201941_ship_area'
  },
];
