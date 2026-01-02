import {YapockType} from '@/index'
import {HTTPError} from '@/lib/HTTPError'
import requiresAccount from '@/utils/identity/requires-account'
import {cleanupTempVideo, convertToAv1} from '@/utils/video-processor'
import {randomUUID} from 'crypto'
import {t} from 'elysia'
import {existsSync} from 'fs'
import {appendFile, mkdir, readFile, rename, stat, writeFile} from 'fs/promises'
import path from 'path'

const UPLOAD_ROOT = path.join(process.cwd(), 'temp', 'uploads', 'pending')

// Ensure upload root exists (lazy check in handler is safer for startup files, but we can try here)
// mkdir(UPLOAD_ROOT, { recursive: true }).catch(() => {})

export default (app: YapockType) =>
    app
        /**
         * INIT: Initiates the upload session
         */
        .post('/init', async ({body, set, user}) => {
            await requiresAccount({set, user})

            // @ts-ignore
            const {total_bytes, asset_type} = body

            // Check asset type
            const allowedTypes = ['image/*', 'video/*']
            if (!allowedTypes.some(type => asset_type.startsWith(type.replace('*', '')))) {
                throw HTTPError.badRequest({summary: 'Unsupported asset type'})
            }

            const asset_id = randomUUID()

            await mkdir(UPLOAD_ROOT, {recursive: true})

            const metadata = {
                id: asset_id,
                total_bytes,
                asset_type,
                user_id: user.sub,
                state: 'pending',
                created_at: Date.now(),
                expires: Date.now() + 5 * 60 * 1000, // 5 minutes from now
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
         */
        .post('/append', async ({body, set, user}) => {
            await requiresAccount({set, user})

            // @ts-ignore
            const {asset_id, asset, segment_index} = body

            const jsonPath = path.join(UPLOAD_ROOT, `${asset_id}.json`)
            const binPath = path.join(UPLOAD_ROOT, `${asset_id}.bin`)

            const meta = await existsMeta(jsonPath, user)
            if (meta.state !== 'pending') {
                throw HTTPError.badRequest({summary: 'Upload session is not in pending state'})
            }

            if (meta.user_id !== user.sub) {
                throw HTTPError.forbidden({summary: 'Unauthorized'})
            }

            // Validate segment ordering
            const expectedSegment = meta.segments_uploaded || 0
            if (Number(segment_index) !== expectedSegment) {
                throw HTTPError.badRequest({summary: `Expected segment ${expectedSegment}, got ${segment_index}`})
            }

            // Append chunk
            const buffer = Buffer.from(await asset.arrayBuffer())
            await appendFile(binPath, buffer)

            // Update segments count
            meta.segments_uploaded = expectedSegment + 1
            await writeFile(jsonPath, JSON.stringify(meta))

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
        .post('/finalize', async ({body, set, user}) => {
            await requiresAccount({set, user})

            // @ts-ignore
            const {asset_id} = body

            const jsonPath = path.join(UPLOAD_ROOT, `${asset_id}.json`)
            const binPath = path.join(UPLOAD_ROOT, `${asset_id}.bin`)

            const meta = await existsMeta(jsonPath, user)

            const stats = await stat(binPath)
            if (stats.size !== meta.total_bytes) {
                // Mark as failed? Or just error?
                // prompt: "state (pending -> in_progress -> [failed|succeeded]). If failed, an error object is available."
                meta.state = 'failed'
                meta.error = {message: 'Size mismatch'}
                await writeFile(jsonPath, JSON.stringify(meta))

                throw HTTPError.badRequest({summary: 'Uploaded size does not match total_bytes'})
            }

            // Video Conversion (AV1 WebM)
            if (meta.asset_type.startsWith('video/')) {
                let tempVideoPath: string | null = null
                try {
                    tempVideoPath = await convertToAv1(binPath)

                    // Replace the original binary with the converted one
                    await rename(tempVideoPath, binPath)

                    // Update metadata
                    const newStats = await stat(binPath)
                    meta.asset_type = 'video/webm'
                    meta.total_bytes = newStats.size
                } catch (e) {
                    console.error('Video conversion failed during finalize:', e)
                    meta.state = 'failed'
                    meta.error = {message: 'Video conversion failed'}
                    await writeFile(jsonPath, JSON.stringify(meta))

                    if (tempVideoPath) {
                        await cleanupTempVideo(tempVideoPath)
                    }

                    throw HTTPError.badRequest({summary: 'Video conversion failed'})
                }
            }

            meta.state = 'succeeded'
            // Update expiry to giving them time to post
            const expires = Date.now() + 5 * 60 * 1000 // 5 minutes to use it
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
        .get('/status', async ({query, set, user}) => {
            await requiresAccount({set, user})
            const {asset_id} = query

            if (!asset_id) {
                set.status = 400
                throw HTTPError.badRequest({summary: 'Missing asset_id'})
            }

            const jsonPath = path.join(UPLOAD_ROOT, `${asset_id}.json`)
            const binPath = path.join(UPLOAD_ROOT, `${asset_id}.bin`)

            const meta = await existsMeta(jsonPath, user)

            let currentSize: number
            try {
                const stats = await stat(binPath)
                currentSize = stats.size
            } catch (e) {
                currentSize = 0
            }

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

async function existsMeta(jsonPath: string, user: any) {

    if (!existsSync(jsonPath)) {
        throw HTTPError.notFound({summary: 'Upload session not found'})
    }

    const meta = JSON.parse(await readFile(jsonPath, 'utf-8'))

    // Check expiry first
    if (meta.expires && Date.now() > meta.expires) {
        throw HTTPError.badRequest({summary: 'Upload session has expired'})
    }

    if (meta.user_id !== user.sub) {
        throw HTTPError.forbidden({summary: 'Unauthorized'})
    }

    return meta
}