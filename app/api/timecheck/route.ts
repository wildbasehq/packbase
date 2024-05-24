export const runtime = 'edge'

const HealthCheckURLs: {
    [key: string]: {
        url: string
        status: number
    }
} | {
    [key: string]: () => Promise<void>
} = {
    download: {
        url: 'http://res.suzu.lol',
        status: 200,
    },
    rr: {
        url: 'http://rhythmrock.suzu.lol',
        status: 200,
    },
    artemis: {
        url: 'http://suzu.lol:9001',
        status: 200,
    },
    billing: {
        url: 'http://suzu.lol:8443/request',
        status: 400,
    },
    // aime: await (async () => {
    //     try {
    //         await new Promise((resolve, reject) => {
    //             const socket = new WebSocket('ws://suzu.lol:22345')
    //             socket.onopen = () => {
    //                 socket.close()
    //                 resolve(null)
    //             }
    //             socket.onerror = () => {
    //                 socket.close()
    //                 reject(null)
    //             }
    //         })
    //         return true
    //     } catch {
    //         return false
    //     }
    // })(),
}

export async function GET(req: Request): Promise<Response> {
    let health: {
        [key: string]: boolean | Promise<void>
    } = {}
    for (let [key, value] of Object.entries(HealthCheckURLs)) {
        try {
            if (typeof value === 'function') {
                // @ts-ignore
                value().then(() => {
                    health[key] = true
                }).catch(() => {
                    health[key] = false
                })
            } else {
                const response = await fetch(value.url)
                health[key] = response.status === value.status
            }
        } catch (e) {
            health[key] = false
        }
    }

    // Convert health object to bitfield
    let healthBitfield = 0
    Object.keys(health).forEach((key, index) => {
        // @ts-ignore
        if (health[key] === true) healthBitfield |= 1 << index
    })

    // Do something for 3 seconds
    await new Promise((resolve) => setTimeout(resolve, 3000))

    // Return the bitfield as a response
    return new Response(healthBitfield.toString(), {
        headers: {
            'content-type': 'text/plain',
        },
    })
}
