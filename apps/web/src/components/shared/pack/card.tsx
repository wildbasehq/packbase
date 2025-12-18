import Link from '@/components/shared/link'
import {Heading, Text} from '@/components/shared/text'

export default function PackCard({pack}) {
    return (
        <div>
            <div className="flex select-none flex-col rounded border bg-card highlight-white/5">
                {/* Banner */}
                <div
                    className="aspect-banner rounded bg-card"
                    style={{
                        background: `url(${pack?.images?.header || '/img/background/generic-generated.png'}) no-repeat center center/cover`,
                    }}
                ></div>

                <div className="items-center justify-between space-y-4">
                    <Link href={`/p/${pack?.slug}/`}
                          className="text-default flex flex-row space-x-2 px-4 pt-2 hover:no-underline">
                        <div
                            className="bg-box h-8 w-8 flex-none rounded-full"
                            style={{
                                background: `url(${pack?.images?.avatar || '/img/default-avatar.png'}) no-repeat center center/cover`,
                            }}
                        ></div>
                        <div className="flex flex-col">
                            <Heading size="lg">{pack?.display_name || pack?.slug}</Heading>
                            <Text>/p/{pack?.slug}</Text>
                        </div>
                    </Link>

                    <div className="flex flex-col space-y-4">
                        <Text className="px-4">{pack?.about?.bio}</Text>
                        <div className="flex grow flex-row items-center space-x-2 border-t">
                            <div className="flex flex-col px-4 py-2">
                                <p className="text-default text-sm">Members</p>
                                <p className="text-default-alt text-sm">{pack?.statistics?.members}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
