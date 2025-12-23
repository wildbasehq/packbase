import {ReactNode} from 'react'

export type FileKind = 'file' | 'folder'

export interface BaseNode {
    id: string
    name: string
    kind: FileKind
    path: string
}

export interface FileNode extends BaseNode {
    kind: 'file'
    sizeBytes?: number
    mimeType?: string
    modifiedAt?: string | number | Date
    thumbnailUrl?: string
}

export interface FolderNode extends BaseNode {
    kind: 'folder'
    children?: Array<FolderNode | FileNode>
}

export type FileSystemNode = FileNode | FolderNode

export type ListContentLoader = (path: string) => Promise<FileSystemNode[]> | FileSystemNode[]
export type TreeLoader = () => Promise<FolderNode[]> | FolderNode[]

export interface FileManagerRootProps {
    content: FileSystemNode[] | ListContentLoader
    tree?: FolderNode[] | TreeLoader
    onUpload?: (files: File[], path: string) => Promise<void> | void
    onChange?: (selected: FileSystemNode[]) => void
    onOpenFile?: (file: FileNode) => void
    baseHref?: string
    children?: ReactNode
}

export interface FileManagerContextValue {
    baseHref: string
    currentPath: string
    setCurrentPath: (next: string) => void
    list: ListContentLoader
    tree?: TreeLoader
    items: FileSystemNode[]
    setItems: (next: FileSystemNode[]) => void
    loading: boolean
    setLoading: (v: boolean) => void
    selectedIds: Set<string>
    setSelectedIds: (next: Set<string> | ((prev: Set<string>) => Set<string>)) => void
    onUpload?: (files: File[], path: string) => Promise<void> | void
    onChange?: (selected: FileSystemNode[]) => void
    onOpenFile?: (file: FileNode) => void
}



