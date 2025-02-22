import {useUIStore} from '@/lib/states.ts'

const {setUpdateAvailable} = useUIStore.getState()

if (globalThis.check_update_cron) clearInterval(globalThis.check_update_cron)
globalThis.check_update_cron = setInterval(async () => {
    // Pull the latest version from the server and compare it with the current version (meta commit-sha)
    const currentVersion = import.meta.env.CF_PAGES_COMMIT_SHA
    const response = await fetch('https://packbase.app')
    const text = await response.text()
    // Get the commit-sha from the HTML meta
    const pulledDOM = new DOMParser().parseFromString(text, 'text/html')
    const pulledVersion = pulledDOM.querySelector('meta[name="commit-sha"]')?.getAttribute('content')
    if (currentVersion !== pulledVersion) {
        setUpdateAvailable(true)
    }
}, 30000)