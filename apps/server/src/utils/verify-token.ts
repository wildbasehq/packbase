import {jwtVerify} from 'jose'
import clerkClient from '@/db/auth'

export default async function verifyToken(req: any) {
    let user
    try {
        const authReq = await clerkClient.authenticateRequest(req, {
            authorizedParties: ['https://packbase.app', 'http://localhost:5173', 'http://localhost:8000'],
        })

        if (authReq.isSignedIn) {
            user = authReq.toAuth()
            if (!user.userId) return

            const userID = await prisma.profiles.findFirst({
                where: {
                    owner_id: user.userId
                }
            })

            user.sub = userID?.id

            if (!user.sub) {
                console.log('URGENT: Creating new user profile for ', user.userId)
                const newProfile = await prisma.profiles.create({
                    data: {
                        // UUID
                        owner_id: user.userId,
                        username: user.sessionClaims.nickname,
                    }
                })

                user.sub = newProfile.id
            }
        }
    } catch (e) {
        console.log(e)
    }
    return user
}