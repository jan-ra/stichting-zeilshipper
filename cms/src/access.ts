import type { Access } from 'payload'

export const isAdmin: Access = ({ req }) => req.user?.role === 'admin'

export const isAdminOrEditor: Access = ({ req }) =>
  req.user?.role === 'admin' || req.user?.role === 'editor'
