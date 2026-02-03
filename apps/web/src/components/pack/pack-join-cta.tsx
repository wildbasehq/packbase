import {useResourceStore, vg} from '@/lib'
import {Button} from '@/src/components'
import {toast} from 'sonner'

export default function PackJoinCTA() {
    const {currentResource} = useResourceStore()
    const packJoin = () => {
        vg.pack({id: currentResource.id})
            .join.post()
            .then(({error}) => {
                if (error) toast.error(error.value ? `${error.status}: ${error.value.summary}` : 'Something went wrong')
                else window.location.reload()
            })
            .catch(e => {
                console.error(e)
                toast.error('Failed to join')
            })
    }

    return (
        <div
            className="flex flex-col justify-center rounded-lg border border-dashed border-border bg-primary-lime p-8 m-4">
            <h1 className="mb-2 text-3xl/12! font-bold! text-black!">
                Go on, join the others.
            </h1>
            <p className="mb-4 text-n-6">
                The wolves in {currentResource.display_name} are probably nice. Join the pack and say hey
                to find out for us, would 'ya?
            </p>
            <Button className="w-full md:w-1/4" onClick={packJoin}>
                Join {currentResource.display_name}
            </Button>
        </div>
    )
}