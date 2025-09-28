import { SVGProps } from 'react'

export function Camera(props: SVGProps<SVGSVGElement>) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 48 48" {...props}>
            {/* Icon from Plump free icons by Streamline - https://creativecommons.org/licenses/by/4.0/ */}
            <path
                fillRule="evenodd"
                d="M19.136 3.675A65 65 0 0 1 24 3.5c1.973 0 3.618.08 4.864.175c2.207.166 4.032 1.554 4.954 3.453l1.067 2.199c1.8.067 3.339.145 4.615.222c3.45.208 6.193 2.855 6.5 6.307c.251 2.816.5 6.695.5 11.008s-.249 8.192-.5 11.007c-.307 3.452-3.05 6.099-6.5 6.307c-3.354.203-8.516.413-15.5.413s-12.146-.21-15.5-.413c-3.45-.208-6.194-2.855-6.5-6.307c-.251-2.815-.5-6.695-.5-11.007s.249-8.192.5-11.008c.306-3.451 3.05-6.099 6.5-6.307c1.276-.077 2.815-.155 4.615-.223l1.067-2.198c.922-1.899 2.747-3.287 4.954-3.453M14.5 26a9.5 9.5 0 1 1 19 0a9.5 9.5 0 0 1-19 0"
                clipRule="evenodd"
            />
        </svg>
    )
}
