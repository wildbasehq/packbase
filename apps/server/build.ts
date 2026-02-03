// @ts-ignore
import {$} from 'bun'
import fs from 'node:fs/promises'

console.log('+ Ensuring prisma is generated')
await $`bun run prisma:generate`
console.log()

// Clean up ./dist/voyage-schema from unwanted files and folders using glob
console.log('+ Cleaning up unwanted files and folders...')
const remove = ['./voyagesdk-export/utils', './voyagesdk-export/lib']
for (const path of remove) {
    console.log(`  - Removing ${path}`)
    await fs.rm(path, {recursive: true, force: true})
}