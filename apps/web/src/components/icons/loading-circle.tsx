import {cn} from '@/lib'
import ProcessWorkingSymbol from '@/src/images/symbolic/process-working.symbolic.png'

export default function LoadingCircle({...props}) {
    return <img className={cn('h-5 w-5 animate-spin dark:invert', props.className)} src={ProcessWorkingSymbol} alt="Process working spinner"/>
}
