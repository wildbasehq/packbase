export async function DiscordLog(body: any) {
    if (process.env.DISCORD_WEBHOOK_URL) {
        // @ts-ignore
        await fetch(process.env.DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        })
    }
}