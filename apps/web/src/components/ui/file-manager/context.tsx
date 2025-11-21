import {createContext, useContext} from 'react'
import type {FileManagerContextValue} from './types'

export const FileManagerContext = createContext<FileManagerContextValue | null>(null)

export function useFileManager() {
    const ctx = useContext(FileManagerContext)
    if (!ctx) throw new Error('useFileManager must be used within <FileManager.Root>')
    return ctx
}



