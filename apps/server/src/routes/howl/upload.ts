
import { YapockType } from '@/index'
import { t } from 'elysia'
import { randomUUID } from 'crypto'
import { mkdir, writeFile, appendFile, stat, readFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { HTTPError } from '@/lib/HTTPError'
import requiresAccount from '@/utils/identity/requires-account'

const UPLOAD_ROOT = path.join(process.cwd(), 'uploads', 'pending')

// Ensure upload root exists (lazy check in handler is safer for startup files, but we can try here)
// mkdir(UPLOAD_ROOT, { recursive: true }).catch(() => {})

export default (app: YapockType) =>
    app.group('/howl/upload', (app) =>
        app
            /**
             * INIT: Initiates the upload session
             */
            .post('/init', async ({ body, set, user }) => {
                await requiresAccount({ set, user })

                // @ts-ignore
                const { total_bytes, asset_type } = body
                const asset_id = randomUUID()

                await mkdir(UPLOAD_ROOT, { recursive: true })

                const metadata = {
                    id: asset_id,
                    total_bytes,
                    asset_type,
                    user_id: user.sub,
                    state: 'pending',
                    created_at: Date.now(),
                    expires: Date.now() + 60000 // default expiry
                }

                const jsonPath = path.join(UPLOAD_ROOT, `${asset_id}.json`)
                const binPath = path.join(UPLOAD_ROOT, `${asset_id}.bin`)

                // Initialize files
                await writeFile(jsonPath, JSON.stringify(metadata))
                await writeFile(binPath, Buffer.alloc(0)) // Create empty file

                return {
                    asset_id,
                    expires: metadata.expires // optional
                }
            }, {
                body: t.Object({
                    command: t.Literal('INIT'),
                    total_bytes: t.Number(),
                    asset_type: t.String(),
                })
            })

            /**
             * APPEND: Uploads file data in consecutive chunks
             * Note: In a real twitter-like flow, this is often multipart/form-data.
             * We use t.File() for the asset.
             */
            .post('/append', async ({ body, set, user }) => {
                await requiresAccount({ set, user })

                // @ts-ignore
                const { asset_id, asset, segment_index } = body

                const jsonPath = path.join(UPLOAD_ROOT, `${asset_id}.json`)
                const binPath = path.join(UPLOAD_ROOT, `${asset_id}.bin`)

                if (!existsSync(jsonPath)) {
                    set.status = 404
                    throw HTTPError.notFound({ summary: 'Upload session not found' })
                }

                // Verify ownership
                const meta = JSON.parse(await readFile(jsonPath, 'utf-8'))
                if (meta.user_id !== user.sub) {
                    set.status = 403
                    throw HTTPError.forbidden({ summary: 'Unauthorized' })
                }

                // Append chunk
                // asset is a Blob/File
                const buffer = Buffer.from(await asset.arrayBuffer())
                await appendFile(binPath, buffer)

                // Update state if needed (e.g. current size)
                // For now, we trust consecutive appends.

                return {
                    success: true
                }
            }, {
                body: t.Object({
                    command: t.Literal('APPEND'),
                    asset_id: t.String(),
                    segment_index: t.Any(), // t.Number() might fail if passed as string in form-data
                    asset: t.File(),
                })
            })

            /**
             * FINALIZE: Completes the upload process
             */
            .post('/finalize', async ({ body, set, user }) => {
                await requiresAccount({ set, user })

                // @ts-ignore
                const { asset_id } = body

                const jsonPath = path.join(UPLOAD_ROOT, `${asset_id}.json`)
                const binPath = path.join(UPLOAD_ROOT, `${asset_id}.bin`)

                if (!existsSync(jsonPath)) {
                    set.status = 404
                    throw HTTPError.notFound({ summary: 'Upload session not found' })
                }

                const meta = JSON.parse(await readFile(jsonPath, 'utf-8'))
                if (meta.user_id !== user.sub) {
                    set.status = 403
                    throw HTTPError.forbidden({ summary: 'Unauthorized' })
                }

                const stats = await stat(binPath)
                if (stats.size !== meta.total_bytes) {
                    // Mark as failed? Or just error?
                    // prompt: "state (pending -> in_progress -> [failed|succeeded]). If failed, an error object is available."
                    meta.state = 'failed'
                    meta.error = { message: 'Size mismatch' }
                    await writeFile(jsonPath, JSON.stringify(meta))

                    set.status = 400
                    throw HTTPError.badRequest({ summary: 'Uploaded size does not match total_bytes' })
                }

                meta.state = 'succeeded'
                // Update expiry to giving them time to post
                const expires = Date.now() + 60000 // 1 minute to use it
                meta.expires = expires

                await writeFile(jsonPath, JSON.stringify(meta))

                return {
                    asset_id,
                    expires
                }
            }, {
                body: t.Object({
                    command: t.Literal('FINALIZE'),
                    asset_id: t.String(),
                })
            })

            /**
             * STATUS: Returns status of an upload
             */
            .get('/status', async ({ query, set, user }) => {
                await requiresAccount({ set, user })
                const { asset_id } = query

                if (!asset_id) {
                    set.status = 400
                    throw HTTPError.badRequest({ summary: 'Missing asset_id' })
                }

                const jsonPath = path.join(UPLOAD_ROOT, `${asset_id}.json`)
                const binPath = path.join(UPLOAD_ROOT, `${asset_id}.bin`)

                if (!existsSync(jsonPath)) {
                    set.status = 404
                    throw HTTPError.notFound({ summary: 'Upload session not found' })
                }

                const meta = JSON.parse(await readFile(jsonPath, 'utf-8'))
                if (meta.user_id !== user.sub) {
                    set.status = 403
                    throw HTTPError.forbidden({ summary: 'Unauthorized' })
                }

                let currentSize = 0
                try {
                    const stats = await stat(binPath)
                    currentSize = stats.size
                } catch (e) { }

                const percent = meta.total_bytes > 0 ? Math.round((currentSize / meta.total_bytes) * 100) : 0

                return {
                    state: meta.state,
                    file_percentage: percent,
                    check_after_secs: 1, // polling interval suggestion
                    error: meta.error
                }
            }, {
                query: t.Object({
                    asset_id: t.String(),
                    command: t.Optional(t.String()) // Optional command param if they send it
                })
            })
    )
