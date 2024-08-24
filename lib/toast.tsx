import { ExternalToast, toast as SonnerToast } from 'sonner'

export const toast = {
    success(message: string | React.ReactNode, data?: ExternalToast) {
        return SonnerToast.success(arguments)
    },

    error(message: string | React.ReactNode, data?: ExternalToast) {
        return SonnerToast.success(arguments)
    },
}
