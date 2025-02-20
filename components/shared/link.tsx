import * as Headless from '@headlessui/react'
import {ComponentPropsWithoutRef, ForwardedRef, forwardRef} from 'react'
import clsx from 'clsx'
import {Link as RouterLink} from 'wouter'

const Link = forwardRef(function Link(props: Omit<ComponentPropsWithoutRef<'a'>, 'href'> & {
    to?: string
    href?: string
}, ref: ForwardedRef<HTMLAnchorElement>) {
    const shallowProps = {...props}
    const href = shallowProps.href || shallowProps.to
    delete shallowProps.href
    delete shallowProps.to

    return (
        <Headless.DataInteractive>
            {/* @ts-ignore */}
            <RouterLink {...shallowProps}
                        to={`~${href}`}
                        className={clsx('text-primary', props.className)}
                        ref={ref}/>
        </Headless.DataInteractive>
    )
})

export default Link
