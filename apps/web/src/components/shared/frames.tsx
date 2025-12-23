import {ReactNode, useLayoutEffect} from 'react'
import Frame, {useFrame} from 'react-frame-component'

export function SafeFrame({children, ...props}: { children: ReactNode; [_: string]: any }) {
    return (
        <Frame {...props}>
            <InnerCSS>{children}</InnerCSS>
        </Frame>
    )
}

function InnerCSS({children}: { children: ReactNode }) {
    const {document: doc} = useFrame()

    useLayoutEffect(() => {
        const selectors = ['style', 'link[as="style"]', 'link[rel="stylesheet"]']
        selectors.forEach(selector => {
            document.head.querySelectorAll(selector).forEach(element => {
                doc?.head.append(element.cloneNode(true))
            })
        })

        const isDarkMode = document.documentElement.classList.contains('dark')
        if (isDarkMode) {
            doc?.documentElement.classList.add('dark')
        } else if (doc?.documentElement.classList.contains('dark')) {
            doc?.documentElement.classList.remove('dark')
        }

        doc?.body.classList.add('bg-white', 'dark:bg-n-8')
    }, [doc])

    return children
}
