import localFont from 'next/font/local'
import {Inter, Tomorrow} from 'next/font/google'

export const lexend = localFont({
    src: './lexend.ttf',
    variable: '--font-lexend',
})

export const inter = Inter({
    variable: '--font-inter',
    subsets: ['latin'],
})

export const tomorrow = Tomorrow({
    variable: '--font-tomorrow',
    weight: ['400', '500', '700'],
    subsets: ['latin'],
})
