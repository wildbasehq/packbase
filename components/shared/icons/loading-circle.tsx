import cx from 'classnames'

export default function LoadingCircle({...props}) {
    return (
        <img width={20}
             height={20}
             className={cx('h-5 w-5 animate-spin dark:invert', props.className)}
             src="/img/symbolic/process-working.symbolic.png"
             alt="Process working spinner"
        />
    )
}
