//TODO Re-add AI Capabilities using Kukiko instead
export const runtime = 'edge'

export async function POST(req: Request): Promise<Response> {
    return new Response("Kukiko Remote isn't available. If you're reading this, then an on-device model couldn't be made either.", {
        status: 400,
    })
}
