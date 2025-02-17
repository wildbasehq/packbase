import * as Headless from '@headlessui/react'
import NextLink, {type LinkProps} from 'next/link'
import {ComponentPropsWithoutRef, ForwardedRef, forwardRef} from 'react'
import clsx from 'clsx'

const Link = forwardRef(function Link(props: LinkProps & ComponentPropsWithoutRef<'a'>, ref: ForwardedRef<HTMLAnchorElement>) {
    return (
        <Headless.DataInteractive>
            <NextLink {...props} className={clsx('!text-primary', props.className)} ref={ref} />
        </Headless.DataInteractive>
    )
})

export default Link
