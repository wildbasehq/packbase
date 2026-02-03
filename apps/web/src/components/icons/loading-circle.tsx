import {cn} from '@/lib'
import {LoadingSpinner} from '@/src/components'

export default function LoadingCircle({...props}) {
    return <div className={cn('h-5 w-5', props.className)}>
        <LoadingSpinner/>
    </div>
}
