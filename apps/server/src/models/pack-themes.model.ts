import { t } from 'elysia'

// Define the pack theme schema
export const PackTheme = t.Object({
  id: t.Optional(t.String()),
  pack_id: t.String(),
  name: t.String(),
  html: t.String(),
  css: t.String(),
  is_active: t.Optional(t.Boolean()),
  created_at: t.Optional(t.String()),
  updated_at: t.Optional(t.String())
})

// Define the response schema for a list of pack themes
export const PackThemesList = t.Array(PackTheme)

// Define the create/update schema (without id and timestamps)
export const CreatePackTheme = t.Object({
  pack_id: t.String(),
  name: t.String(),
  html: t.String(),
  css: t.String(),
  is_active: t.Optional(t.Boolean())
})

// Define the update schema (without pack_id and timestamps)
export const UpdatePackTheme = t.Object({
  name: t.Optional(t.String()),
  html: t.Optional(t.String()),
  css: t.Optional(t.String()),
  is_active: t.Optional(t.Boolean())
})