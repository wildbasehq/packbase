import {defineNitroConfig} from "nitropack/config"

export default defineNitroConfig({
    compatibilityDate: "2024-09-19",
    preset: "cloudflare_module",
    srcDir: "server",
    imports: false,
    cloudflare: {
        deployConfig: true,
        nodeCompat: true
    }
})

