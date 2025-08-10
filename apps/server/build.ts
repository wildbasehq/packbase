// @ts-ignore
import {$} from 'bun'
import fs from 'node:fs/promises'

console.log('+ Startup testing before type build')
// Runs bun start -- --close-on-success and gets the startup time from the console
let startupTime = await $`DEBUG=n bun start -- --close-on-success`.text()
// Buffer to string
startupTime = startupTime.trim()
// Round to 2 decimal places
startupTime = Math.round(parseFloat(startupTime) * 100) / 100
console.log(`  - Startup time: ${startupTime}ms`)
if (startupTime > 94) {
    console.error('  - (CI) Startup time is too long.')
}


console.log('+ Building Voyage Schema')
console.log('  - Trying to build routes')
await $`DEBUG=init,init:* bun start -- --build-sdk`
console.log('  - Building types')
await $`bun run build:voyagesdktypes`.text()

console.log()

// Clean up ./dist/voyage-schema from unwanted files and folders using glob
console.log('+ Cleaning up unwanted files and folders...')
const remove = ['./voyagesdk-export/utils', './voyagesdk-export/lib']
for (const path of remove) {
    console.log(`  - Removing ${path}`)
    await fs.rm(path, {recursive: true, force: true})
}