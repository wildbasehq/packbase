'use client'

import { ExternalToast, toast as SonnerToast } from 'sonner'

// const whichSound = 'donk'
// const filesMP3 = ['lizzo', 'voice_sans', 'WAAAAAAA']
// const fileType = filesMP3.includes(whichSound) ? 'mp3' : 'ogg'
// const audio = new Audio(`/audio/${whichSound}.${fileType}`)
//
// const warnPlay = (audio: HTMLAudioElement) => {
//     const audio2 = new Audio(`/audio/${whichSound}.ogg`)
//
//     setTimeout(() => {
//         audio2.play().then(() => {
//             audio2.remove()
//         })
//     }, 150)
// }

// const errorPlay = (audio: HTMLAudioElement) => {
//     if (audio.src.includes('.mp3')) return
//     const audio2 = new Audio(`/audio/${whichSound}.ogg`)
//
//     setTimeout(() => {
//         audio2.preservesPitch = false
//         audio2.playbackRate = 1.2
//         audio2.play().then(() => {
//             audio2.remove()
//
//             setTimeout(() => {
//                 const audio3 = new Audio(`/audio/${whichSound}.ogg`)
//                 audio3.preservesPitch = false
//                 audio3.playbackRate = 0.8
//                 audio3.play().then(() => {
//                     audio3.remove()
//                 })
//             }, 150)
//         })
//     }, 150)
// }

export const toast = {
    success(message: string | React.ReactNode, data?: ExternalToast) {
        // audio.play().then(() => {
        //     audio.remove()
        // })

        return SonnerToast.success(arguments)
    },

    error(message: string | React.ReactNode, data?: ExternalToast) {
        // audio.play().then(() => {
        //     audio.remove()
        // })
        // errorPlay(audio)

        return SonnerToast.success(arguments)
    },
}
