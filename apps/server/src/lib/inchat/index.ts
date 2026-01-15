/**
 * Wildbase Inchat (ONCE Campfire) Bot Caller
 */

export class Inchat {
    private inchatURL: string = 'https://inchat.wildhq.org'
    private botToken: string

    constructor(botToken: string) {
        this.botToken = botToken
    }

    async sendMessage(message: {
        // What the bot will say
        body: string;
        // Path to attachment
        attachment?: string;
        // Channel ID
        channelID?: number;
    }) {
        const channelURL = this.getChannelURL(message.channelID ?? 1)

        const response = await fetch(channelURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain',
            },
            body: this.buildMessage(message),
        })

        if (!response.ok) {
            throw new Error('Failed to send message')
        }
    }

    public static async processAuditLog(auditLog: {
        user: {
            id: string,
            username: string
        },
        action: string,
        model_type: string,
        model_id: string,
        model_object: {
            [key: string]: any,
        }
    }) {
        if (process.env.INCHAT_ISSUES_BOT_TOKEN) {
            const {user, action, model_type, model_id, model_object} = auditLog
            const inchat = new Inchat(process.env.INCHAT_ISSUES_BOT_TOKEN)
            let username = 'unknown'
            try {
                switch (model_type) {
                    case 'profiles':
                        const {username: profileUsername} = await prisma.profiles.findUnique({
                            where: {
                                id: model_id,
                            },
                            select: {
                                username: true,
                            }
                        })

                        username = profileUsername || 'unknown'
                        break
                    case 'posts':
                        const {user} = await prisma.posts.findUnique({
                            where: {
                                id: model_id,
                            },
                            select: {
                                user: {
                                    select: {
                                        username: true,
                                    },
                                },
                            }
                        })

                        username = user?.username || 'unknown'
                }
            } catch (_) {
                username = 'unknown'
            }

            switch (action) {
                case 'HOWL_DELETED':
                    await inchat.sendMessage({
                        body: `Howl ${model_object.howl_id} (author @${username}) deleted by ${user.username}.\nReason: ${model_object.reason || 'NO REASON PROVIDED. WHY?'}`,
                        channelID: 2,
                    })
                    break
                case 'HOWL_WARNED':
                    await inchat.sendMessage({
                        body: `Howl ${model_object.howl_id} (author @${username}) warned by ${user.username}.\nReason: ${model_object.reason || 'NO REASON PROVIDED. WHY?'}`,
                        channelID: 2,
                    })
                    break
            }
        }
    }

    private getChannelURL(channelID: number) {
        return `${this.inchatURL}/rooms/${channelID}/${this.botToken}/messages`
    }

    private buildMessage(message: {
        body: string;
        attachment?: string;
    }) {
        const attachment = message.attachment ? `attachment=@${message.attachment}` : ''
        return `${message.body}${attachment}`
    }
}