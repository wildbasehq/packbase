import Markdown from '@/components/shared/markdown'
import {Heading} from '@/components/shared/text'
import {Button} from '@/components/shared/button'
import {vg} from '@/lib/api'
import {toast} from 'sonner'

export default function PackHeader({ ...props }: any) {
    const pack = props.pack

    return (
        <div className="relative">
            <div>
                <img
                    className="pointer-events-none aspect-banner w-full rounded-bl rounded-br object-cover"
                    src={pack.images?.header || '/img/background/generic-generated.png'}
                    alt="Profile cover"
                />
            </div>
            <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                <div className="-mt-12 sm:-mt-16 sm:flex sm:items-end sm:space-x-5">
                    <div className="flex">
                        <img
                            className="bg-default ring-default pointer-events-none h-24 w-24 rounded-lg ring-1 sm:h-32 sm:w-32"
                            src={pack.images?.avatar || '/img/default-avatar.png'}
                            alt=""
                        />
                    </div>
                    <div className="mt-6 sm:flex sm:min-w-0 sm:flex-1 sm:items-center sm:justify-end sm:space-x-6 sm:pb-1">
                        <div className="mt-6 min-w-0 flex-1 sm:hidden md:block">
                            <Heading>{pack.display_name || pack.slug}</Heading>
                            {/* Small @username */}
                            <div className="flex items-center">
                                <p className="text-alt-2 truncate text-sm font-medium">@{pack.slug}</p>
                            </div>
                        </div>
                    </div>
                    <div>
                        <PackMembershipButton pack={pack} />
                    </div>
                </div>
                <div className="mt-6 hidden min-w-0 flex-1 sm:block md:hidden">
                    <Heading>{pack.display_name || pack.slug}</Heading>
                </div>
                <div className="text-default block min-w-0 flex-1">
                    <div className="mt-6 whitespace-pre-line text-sm">
                        <Markdown>{pack.about?.bio}</Markdown>
                    </div>
                </div>
            </div>
        </div>
    )
}

function PackMembershipButton({ pack }: { pack: any }) {
    const packJoin = () => {
        vg.pack({ id: pack.id })
            .join.post()
            .then(({ error }) => {
                if (error) return toast.error(error.value ? `${error.status}: ${error.value.message}` : 'Something went wrong')
                window.location.reload()
            })
            .catch((e) => {
                console.error(e)
                return toast.error('Failed to join')
            })
    }

    const packLeave = () => {
        vg.pack({ id: pack.id })
            .join.delete()
            .then(() => {
                window.location.reload()
            })
            .catch((e) => {
                toast.error(e.message)
            })
    }

    if (!pack.membership) {
        return (
            <Button size="sm" onClick={packJoin}>
                + Join
            </Button>
        )
    }

    return (
        <Button size="sm" onClick={packLeave} disabled={(pack.membership?.permissions & 1) === 1}>
            - Leave
        </Button>
    )
}
