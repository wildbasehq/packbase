import ProcessWorkingSymbol from '@/src/images/symbolic/process-working.symbolic.png'
import cx from 'classnames'

export default function LoadingCircle({...props}) {
    return <img className={cx('h-5 w-5 animate-spin dark:invert', props.className)} src={ProcessWorkingSymbol} alt="Process working spinner"/>
}
