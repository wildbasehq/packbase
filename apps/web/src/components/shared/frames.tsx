import Frame, { useFrame } from 'react-frame-component'
import { useLayoutEffect } from 'react'

export function SafeFrame({ children, ...props }: { children: React.ReactNode; [x: string]: any }) {
    return (
        <Frame {...props}>
            <InnerCSS>{children}</InnerCSS>
        </Frame>
    )
}

function InnerCSS({ children }: { children: React.ReactNode }) {
    const { document: doc } = useFrame()

    useLayoutEffect(() => {
        // this covers development case as well as part of production
        document.head.querySelectorAll('style').forEach(style => {
            const frameStyles = style.cloneNode(true)
            doc?.head.append(frameStyles)
        })

        // inject the production minified styles into the iframe
        // if (import.meta && import.meta.env.NODE_ENV === 'production') {
        document.head.querySelectorAll('link[as="style"]').forEach(ele => {
            doc?.head.append(ele.cloneNode(true))
        })
        document.head.querySelectorAll('link[rel="stylesheet"]').forEach(ele => {
            doc?.head.append(ele.cloneNode(true))
        })
        // }
    }, [doc])

    return children
}
