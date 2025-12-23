import {FileManagerFiles} from './files'
import {FileManagerRoot} from './root'
import {FileManagerSidebar} from './sidebar'

export {FileManagerRoot as Root} from './root'
export {FileManagerSidebar as Sidebar} from './sidebar'
export {FileManagerFiles as Files} from './files'
export * from './types'

const FileManager = {
    Root: FileManagerRoot,
    Sidebar: FileManagerSidebar,
    Files: FileManagerFiles,
}

export default FileManager

