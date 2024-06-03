import React from 'react'
import Image from 'next/image'
import LionLogo from '@/public/img/logo.png'
import {cn} from '@/lib/utils'

export const Logo = ({...props}) => {
    const noColorTheme = props.noColorTheme
    delete props.noColorTheme

    props.className = cn(props.className, !noColorTheme && 'bg-[#F5F6FC] dark:bg-primary', 'ring-1 ring-inset ring-n-7/25 rounded-md w-8 h-8 flex justify-center items-center p-1.5')

    // == For Yipnyap ==
    // @ts-ignore
    // const color500 = colors['blue']['400']
    // @ts-ignore
    // const color600 = colors['blue']['500']
    return (
        // <svg width="27" viewBox="0 0 27 22" aria-hidden="true" {...props}>
        //     <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        //         <stop offset="0%" stopColor={color500} />
        //         <stop offset="100%" stopColor={color600} />
        //     </linearGradient>
        //     <path fill="url(#logoGrad)" d="M19.72,1.99c.05-.12,0-.2-.14-.16l-3.99,1.04c-.13,.04-.31,.15-.4,.25l-3.01,3.42c-.09,.1-.05,.2,.08,.23l4.77,.78c.13,.02,.29-.06,.34-.19l2.34-5.37Zm7.1,10.39c.13,.02,.21,.14,.17,.27l-.5,1.61c-.04,.13-.16,.3-.28,.37l-1.9,1.29c-.11,.08-.32,.15-.45,.16l-8.15,.7c-.14,.01-.32,.1-.41,.2l-4.57,4.97c-.09,.1-.21,.08-.26-.05l-1.75-4.29c-.05-.13-.2-.22-.34-.21l-6.62,.57c-.14,.01-.22-.09-.18-.22l1.46-5.13c.04-.13-.03-.28-.16-.34L.1,11.05c-.12-.06-.13-.16-.02-.24l4.18-2.96c.11-.08,.2-.14,.2-.14,0,0,.05-.1,.12-.22L7.28,2.63c.07-.12,.22-.27,.34-.33L12.12,.02c.12-.06,.2,0,.17,.13l-1.41,6.99c-.03,.13,.06,.26,.2,.28l7.43,1.2c.13,.02,.3,.13,.37,.25l1.5,2.4c.07,.12,.24,.22,.37,.25l6.05,.86Z"/>
        //     <path className="fill-white" d="M14.45,9.91c-.09-.1-.05-.17,.08-.15l3.16,.45c.13,.02,.3,.13,.37,.25l.25,.4c.07,.12,.04,.27-.07,.35l-.63,.43c-.11,.08-.32,.15-.45,.16l-.77,.06c-.14,.01-.32-.06-.41-.17l-1.53-1.78Z"/>
        // </svg>
        <div {...props}>
            <Image src={LionLogo} alt="Lion logo" className={cn(!noColorTheme && 'dark:invert', 'h-fit')}/>
        </div>

    )
}