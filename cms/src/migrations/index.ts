import * as migration_20260717_205802_initial from './20260717_205802_initial';

export const migrations = [
  {
    up: migration_20260717_205802_initial.up,
    down: migration_20260717_205802_initial.down,
    name: '20260717_205802_initial'
  },
];
