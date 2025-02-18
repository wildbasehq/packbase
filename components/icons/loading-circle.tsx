import ProcessWorkingSymbol from '@/public/img/symbolic/process-working.symbolic.png'
import cx from 'classnames'
import Image from 'next/image'

export default function LoadingCircle({ ...props }) {
    return <Image width={20} height={20} className={cx('h-5 w-5 animate-spin dark:invert', props.className)} src={ProcessWorkingSymbol} alt="Process working spinner" />
}
