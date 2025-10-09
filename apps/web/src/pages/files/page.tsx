import FileManager from '@/components/ui/file-manager'
import type {FileSystemNode, FolderNode} from '@/components/ui/file-manager/types'

function sampleTree(): FolderNode[] {
    return [
        {
            id: 'root', name: 'Root', kind: 'folder', path: '/', children: [
                {id: 'docs', name: 'Documents', kind: 'folder', path: '/documents'},
                {id: 'pics', name: 'Pictures', kind: 'folder', path: '/pictures'},
            ]
        },
    ]
}

async function sampleList(path: string): Promise<FileSystemNode[]> {
    switch ((path || '/').replace(/\/$/, '')) {
        case '':
        case '/':
            return [
                {id: 'docs', name: 'Documents', kind: 'folder', path: '/documents'},
                {id: 'pics', name: 'Pictures', kind: 'folder', path: '/pictures'},
                {id: 'readme', name: 'README.txt', kind: 'file', path: '/README.txt', sizeBytes: 1024},
            ]
        case '/documents':
            return [
                {id: 'spec', name: 'Spec.pdf', kind: 'file', path: '/documents/Spec.pdf', sizeBytes: 532000},
                {id: 'notes', name: 'Notes.md', kind: 'file', path: '/documents/Notes.md', sizeBytes: 8000},
            ]
        case '/pictures':
            return [
                {id: 'cat', name: 'Cat.png', kind: 'file', path: '/pictures/Cat.png', sizeBytes: 1200000},
                {id: 'dog', name: 'Dog.jpg', kind: 'file', path: '/pictures/Dog.jpg', sizeBytes: 2200000},
            ]
        default:
            return []
    }
}

export default function FilesPage() {
    return (
        <div className="flex h-full select-none">
            <FileManager.Root baseHref="/files" content={sampleList} tree={sampleTree}>
                <FileManager.Sidebar/>
                <FileManager.Files/>
            </FileManager.Root>
        </div>
    )
}



