import {Heading} from '@/components/shared/text'

export default function ProfileHeader({...props}: any) {
    const profile = props.user
    const header = profile.header || props.defaults?.header

    return (
        <div
            className="relative">
            <div>
                <img
                    className="rounded-bl rounded-br aspect-banner object-cover w-full pointer-events-none"
                    src={profile.images?.header || '/img/background/generic-generated.png'}
                    alt="Profile cover"/>
            </div>
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="-mt-12 sm:-mt-16 sm:flex sm:items-end sm:space-x-5">
                    <div className="flex">
                        <img className="bg-default h-24 w-24 rounded-lg pointer-events-none sm:h-32 sm:w-32"
                             src={profile.images?.avatar || '/img/default-avatar.png'}
                             alt=""/>
                    </div>
                    <div
                        className="mt-6 sm:flex-1 sm:min-w-0 sm:flex sm:items-center sm:justify-end sm:space-x-6 sm:pb-1">
                        <div className="sm:hidden md:block mt-6 min-w-0 flex-1">
                            <Heading>
                                {profile.displayName || profile.username}
                            </Heading>
                            {/* Small @username */}
                            <div className="flex items-center">
                                <p className="text-sm font-medium text-alt-2 truncate">
                                    @{profile.username}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="hidden sm:block md:hidden mt-6 min-w-0 flex-1">
                    <Heading>
                        {profile.displayName || profile.username}
                    </Heading>
                </div>
                <div className="block min-w-0 flex-1 text-default">
                    <div className="mt-6 text-sm whitespace-pre-line">
                        {profile.about}
                    </div>
                </div>
            </div>
        </div>
    )
}
