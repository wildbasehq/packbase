import {randomUUID} from 'crypto'
import ffmpegInstaller from 'ffmpeg-static'
import ffmpeg from 'fluent-ffmpeg'
import {existsSync} from 'fs'
import {mkdir, unlink} from 'fs/promises'
import path from 'path'

if (ffmpegInstaller) {
    ffmpeg.setFfmpegPath(ffmpegInstaller)
}

const TEMP_DIR = path.join(process.cwd(), 'temp', 'video-processing')

/**
 * Converts a video file to AV1 WebM format (tuned for speed).
 * @param inputPath Path to the input video file.
 * @returns Path to the converted WebM file.
 */
export async function convertToAv1(inputPath: string): Promise<string> {
    if (!existsSync(TEMP_DIR)) {
        await mkdir(TEMP_DIR, {recursive: true})
    }

    const outputPath = path.join(TEMP_DIR, `${randomUUID()}.webm`)

    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .outputOptions([
                // Video: AV1 (libaom) but faster
                '-c:v libaom-av1',
                '-crf 34', // raise a bit for speed/size tradeoff (optional)
                '-b:v 0',
                '-cpu-used 8', // 0=best/slowest, 8..10=faster/worse
                '-row-mt 1', // enable row multithreading (if supported by the build)
                '-threads 0', // let ffmpeg choose
                '-vf scale=-2:1080:force_original_aspect_ratio=decrease',

                // Audio
                '-c:a libopus',
                '-b:a 96k',
            ])
            .toFormat('webm')
            .on('start', (commandLine) => {
                console.log('Video conversion started:', commandLine)
            })
            .on('error', (err) => {
                console.error('Video conversion error:', err)
                reject(err)
            })
            .on('end', () => {
                console.log('Video conversion completed:', outputPath)
                resolve(outputPath)
            })
            .save(outputPath)
    })
}

export async function cleanupTempVideo(filePath: string) {
    try {
        console.log('Cleaning up temp video file:', filePath)
        if (existsSync(filePath)) {
            await unlink(filePath)
        }
    } catch (e) {
        console.error('Failed to cleanup temp video:', e)
    }
}
