import {YapockType} from '@/index'
import {HTTPError} from '@/lib/class/HTTPError'
import validateThemeContent from '@/lib/themes/validateThemeContent'
import {t} from 'elysia'

// Define the validation response schema
const ValidationResponse = t.Object({
  isValid: t.Boolean(),
  html: t.String(),
  css: t.String(),
  htmlIssue: t.Optional(t.String()),
  cssIssue: t.Optional(t.String())
})

export default (app: YapockType) =>
  app
    .post(
      '',
      async ({ set, body, user }) => {
        if (!user) {
          set.status = 401
          throw HTTPError.unauthorized({
            summary: 'You must be logged in to validate theme content.',
          })
        }

        // Validate the theme content in dry run mode (no errors thrown)
          return validateThemeContent({
            html: body.html,
            css: body.css
        }, true)
      },
      {
        detail: {
          description: 'Validate theme content without saving it. Used for real-time validation in editors.',
          tags: ['Themes'],
        },
        body: t.Object({
          html: t.String(),
          css: t.String()
        }),
        response: {
          200: ValidationResponse,
          401: t.Undefined()
        }
      },
    )