import * as migration_20260717_205802_initial from './20260717_205802_initial';
import * as migration_20260806_181125_youtube_videos from './20260806_181125_youtube_videos';

export const migrations = [
  {
    up: migration_20260717_205802_initial.up,
    down: migration_20260717_205802_initial.down,
    name: '20260717_205802_initial',
  },
  {
    up: migration_20260806_181125_youtube_videos.up,
    down: migration_20260806_181125_youtube_videos.down,
    name: '20260806_181125_youtube_videos'
  },
];
