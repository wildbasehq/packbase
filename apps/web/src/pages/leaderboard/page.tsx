import {XPDisplay} from '@/components/icons/ranks/xp-display'
import Body from '@/components/layout/body'
import {
    Alert,
    AlertDescription,
    AlertTitle,
    Avatar,
    Heading,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    TabsLayout,
    Text,
    useContentFrame,
} from '@/components/shared'
import Link from '@/components/shared/link'
import UserInfoCol from '@/components/shared/user/info-col'
import {formatRelativeTime} from '@/lib/utils/date'
import {ArrowDownIcon, ArrowUpIcon} from '@heroicons/react/20/solid'
import {useEffect, useMemo} from 'react'

type PackLeaderboardEntry = {
    activity: number
    pack: {
        id: string
        slug: string
        display_name: string
        created_at: string
        about?: {
            bio?: string
        }
        images?: {
            avatar?: string
        }
    }
}

type ProfileLeaderboardEntry = {
    xp: number
    since: string
    movement: 'gained' | 'lost' | 'new' | 'same'
    delta: number
    profile: {
        id?: string
        username?: string
        display_name?: string
        images?: {
            avatar?: string
        }
        about?: {
            bio?: string
        }
    }
}

const numberFormatter = new Intl.NumberFormat()

function MovementIndicator({movement, delta, since}: { movement: 'gained' | 'lost' | 'new' | 'same', delta: number, since: string }) {
    const date = new Date(since)
    const now = new Date()
    const hours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    const isPositive = movement === 'gained' || movement === 'new'
    const Arrow = isPositive ? ArrowUpIcon : ArrowDownIcon
    // gained, new = green
    // lost = red
    // same = gray
    const color = isPositive ? 'text-green-500' : movement === 'same' ? 'text-muted-foreground' : 'text-red-500'

    return (
        <div className={`flex items-center gap-1 text-xs ${color}`}>
            {movement !== 'same' && (
                <>
                    <Arrow className="w-4 h-4"/>
                    <span>{movement === 'new' ? 'NEW' : delta}</span>
                </>
            )}
            {hours > 1 && (
                <span className="text-muted-foreground">· held for {formatRelativeTime(since)}</span>
            )}
        </div>
    )
}

export default function LeaderboardPage() {
    const {
        data: packsData,
        isLoading: packsLoading,
        error: packsError,
    } = useContentFrame('get', 'leaderboard/packs', undefined, {
        id: 'leaderboard.packs',
        staleTime: 60 * 60,
        gcTime: 60 * 60,
    })
    const {
        data: profilesData,
        isLoading: profilesLoading,
        error: profilesError,
    } = useContentFrame('get', 'leaderboard/profiles', undefined, {
        id: 'leaderboard.profiles',
        staleTime: 60 * 60,
        gcTime: 60 * 60,
    })

    const packs = useMemo<PackLeaderboardEntry[]>(() => packsData?.packs || [], [packsData])
    const profiles = useMemo<ProfileLeaderboardEntry[]>(() => profilesData?.profiles || [], [profilesData])

    const noPackActivity = !packsLoading && !packsError && packs.length === 0
    const noProfileActivity = !profilesLoading && !profilesError && profiles.length === 0
    useEffect(() => {
        document.title = 'Packbase - Leaderboard'
    }, [])

    return (
        <Body className="max-w-6xl space-y-6">
            <header className="space-y-2">
                <Heading size="3xl">Leaderboard</Heading>
                <Text alt>See the most active packs and the top profiles by XP.</Text>
            </header>

            <TabsLayout
                defaultIndex={0}
                contentClassName="border rounded-2xl rounded-tl-none bg-card p-4"
                headerClassName="flex-wrap"
            >
                <Tab title="Packs">
                    <div className="space-y-4">
                        {packsLoading && <Text alt>Loading pack leaderboard...</Text>}

                        {packsError && (
                            <Alert variant="destructive">
                                <AlertTitle>Failed to load packs</AlertTitle>
                                <AlertDescription>{packsError.message}</AlertDescription>
                            </Alert>
                        )}

                        {noPackActivity && (
                            <Text alt>No pack activity yet.</Text>
                        )}

                        {!noPackActivity && (
                            <Table striped grid dense bleed className="ring-1 ring-default rounded shadow-xs">
                                <TableHead>
                                    <TableRow>
                                        <TableHeader className="w-16">Rank</TableHeader>
                                        <TableHeader>Pack</TableHeader>
                                        <TableHeader className="w-32 text-right">Heartbeat</TableHeader>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {packs.map((entry, index) => {
                                        const pack = entry.pack
                                        const name = pack.display_name || pack.slug
                                        const avatarSrc = pack.images?.avatar
                                        const initials = (name || '?').slice(0, 1)

                                        return (
                                            <TableRow key={pack.id}>
                                                <TableCell className="text-muted-foreground">#{index + 1}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <Avatar
                                                            src={avatarSrc}
                                                            alt={name}
                                                            initials={avatarSrc ? undefined : initials}
                                                            className="size-9"
                                                        />
                                                        <div className="min-w-0">
                                                            <div className="font-medium truncate">
                                                                <Link
                                                                    className="text-foreground hover:text-indigo-500"
                                                                    href={`/p/${pack.slug}`}
                                                                >
                                                                    {name}
                                                                </Link>
                                                            </div>
                                                            <Text alt size="xs" className="truncate">
                                                                {(pack.about?.bio || `/${pack.slug}`).slice(0, 80)}
                                                                {pack.about?.bio?.length > 80 ? '...' : ''}
                                                            </Text>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {numberFormatter.format(entry.activity)}
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        )}
                    </div>
                </Tab>

                <Tab title="Profiles">
                    <div className="space-y-4">
                        <Text alt>Profile leaderboard updates every server hour.</Text>
                        {profilesData?.update_in && (
                            <Text alt>Next update in {formatRelativeTime(profilesData?.update_in)}</Text>
                        )}

                        {profilesLoading && <Text alt>Loading profile leaderboard...</Text>}

                        {profilesError && (
                            <Alert variant="destructive">
                                <AlertTitle>Failed to load profiles</AlertTitle>
                                <AlertDescription>{profilesError.message}</AlertDescription>
                            </Alert>
                        )}

                        {noProfileActivity && (
                            <Text alt>No profiles ranked yet.</Text>
                        )}

                        {!noProfileActivity && (
                            <Table striped grid dense bleed className="ring-1 ring-default rounded shadow-xs">
                                <TableHead>
                                    <TableRow>
                                        <TableHeader className="w-16">Rank</TableHeader>
                                        <TableHeader>Profile</TableHeader>
                                        <TableHeader className="w-32 text-right">XP</TableHeader>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {profiles.map((entry, index) => {
                                        const profile = entry.profile
                                        const name = profile.display_name || profile.username || 'Anonymous'
                                        const initials = (name || '?').slice(0, 1)
                                        const handle = profile.username ? `@${profile.username}` : null

                                        return (
                                            <TableRow key={profile.id || `${name}-${index}`}>
                                                <TableCell className="text-muted-foreground">#{index + 1}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3 min-w-42">
                                                        <UserInfoCol user={profile}/>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="sm:w-48 font-medium">
                                                    <XPDisplay xp={entry.xp}/>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        )}
                    </div>
                </Tab>
            </TabsLayout>
        </Body>
    )
}
