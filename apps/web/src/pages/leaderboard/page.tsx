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
import {useEffect, useMemo} from 'react'
import {XPDisplay} from "@/components/icons/ranks/xp-display";
import {getAvatar} from "@/lib/api/users/avatar";

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
                <Tab title={`Packs (${packs.length})`}>
                    <div className="space-y-4">
                        {packsLoading && <Text alt>Loading pack leaderboard...</Text>}
                        {packsError && (
                            <Alert variant="destructive">
                                <AlertTitle>Failed to load packs</AlertTitle>
                                <AlertDescription>{packsError.message}</AlertDescription>
                            </Alert>
                        )}
                        {!packsLoading && !packsError && packs.length === 0 && (
                            <Text alt>No pack activity yet.</Text>
                        )}
                        {!packsLoading && !packsError && packs.length > 0 && (
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
                <Tab title={`Profiles (${profiles.length})`}>
                    <div className="space-y-4">
                        {profilesLoading && <Text alt>Loading profile leaderboard...</Text>}
                        {profilesError && (
                            <Alert variant="destructive">
                                <AlertTitle>Failed to load profiles</AlertTitle>
                                <AlertDescription>{profilesError.message}</AlertDescription>
                            </Alert>
                        )}
                        {!profilesLoading && !profilesError && profiles.length === 0 && (
                            <Text alt>No profiles ranked yet.</Text>
                        )}
                        {!profilesLoading && !profilesError && profiles.length > 0 && (
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
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <Avatar
                                                            src={getAvatar(profile.id)}
                                                            alt={name}
                                                            initials={initials}
                                                            className="size-9"
                                                        />
                                                        <div className="min-w-0">
                                                            <div className="font-medium truncate">
                                                                {handle ? (
                                                                    <Link
                                                                        className="text-foreground hover:text-indigo-500"
                                                                        href={`/@${profile.username}`}
                                                                    >
                                                                        {name}
                                                                    </Link>
                                                                ) : (
                                                                    name
                                                                )}
                                                            </div>
                                                            <Text alt size="xs" className="truncate">
                                                                {profile.about?.bio || handle || 'Unlisted profile'}
                                                            </Text>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="sm:w-48 font-medium">
                                                    <XPDisplay xp={entry.xp} />
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
