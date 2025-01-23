import * as Headless from '@headlessui/react'
import NextLink, { type LinkProps } from 'next/link'
import { ComponentPropsWithoutRef, ForwardedRef, forwardRef } from 'react'

const Link = forwardRef(function Link(props: LinkProps & ComponentPropsWithoutRef<'a'>, ref: ForwardedRef<HTMLAnchorElement>) {
    return (
        <Headless.DataInteractive>
            <NextLink {...props} ref={ref} />
        </Headless.DataInteractive>
    )
})

export default Link
