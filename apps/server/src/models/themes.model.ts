import {t} from 'elysia'

// Define the theme schema
export const Theme = t.Object({
    id: t.Optional(t.String()),
    name: t.String(),
    html: t.String(),
    css: t.String(),
    is_active: t.Optional(t.Boolean())
})

// Define the response schema for a list of themes
export const ThemesList = t.Array(Theme)