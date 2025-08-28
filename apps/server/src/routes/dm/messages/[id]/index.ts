import { t } from 'elysia'
import { YapockType } from '@/index'
import prisma from '@/db/prisma'
import { HTTPError } from '@/lib/class/HTTPError'

export default (app: YapockType) =>
  app
    // PATCH /dm/messages/:id
    .patch('', async ({ set, user, params, body }) => {
      if (!user?.sub) {
        set.status = 401
        throw HTTPError.unauthorized({ summary: 'Unauthorized' })
      }

      const { id } = params as { id: string }
      const { content } = body as { content?: string }
      if (!content || !content.trim()) {
        set.status = 400
        throw HTTPError.badRequest({ summary: 'content is required' })
      }

      const msg = await prisma.dm_messages.findUnique({ where: { id } })
      if (!msg) {
        set.status = 404
        throw HTTPError.notFound({ summary: 'Message not found' })
      }

      if (msg.author_id !== user.sub) {
        set.status = 403
        throw HTTPError.forbidden({ summary: 'Cannot edit others\' messages' })
      }

      const updated = await prisma.dm_messages.update({ where: { id }, data: { content: content.trim(), edited_at: new Date() } })
      return updated
    }, {
      detail: { description: 'Edit a DM message by id', tags: ['DM'] },
      body: t.Object({ content: t.String() }),
      response: { 200: t.Any() }
    })
    // DELETE /dm/messages/:id (soft delete)
    .delete('', async ({ set, user, params }) => {
      if (!user?.sub) {
        set.status = 401
        throw HTTPError.unauthorized({ summary: 'Unauthorized' })
      }

      const { id } = params as { id: string }

      const msg = await prisma.dm_messages.findUnique({ where: { id } })
      if (!msg) {
        set.status = 404
        throw HTTPError.notFound({ summary: 'Message not found' })
      }

      if (msg.author_id !== user.sub) {
        set.status = 403
        throw HTTPError.forbidden({ summary: 'Cannot delete others\' messages' })
      }

      const updated = await prisma.dm_messages.update({ where: { id }, data: { deleted_at: new Date() } })
      return updated
    }, {
      detail: { description: 'Delete (soft) a DM message by id', tags: ['DM'] },
      response: { 200: t.Any() }
    })
