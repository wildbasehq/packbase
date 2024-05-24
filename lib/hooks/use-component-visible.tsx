import {useEffect, useRef, useState} from 'react'
import {PlayFunction} from 'use-sound/dist/types'

export default function useComponentVisible(opts?: {
    soundOnClose?: PlayFunction;
}) {
    const [isComponentVisible, setIsComponentVisible] = useState(false);
    const ref = useRef<any>(null);

    const handleClickOutside = (event: { target: any }) => {
        if (ref.current && !ref.current.contains(event.target) && isComponentVisible) {
            setIsComponentVisible(false);
            if (opts?.soundOnClose) {
                opts.soundOnClose()
            }
        }
    };

    useEffect(() => {
        document.addEventListener('click', handleClickOutside, true);
        return () => {
            document.removeEventListener('click', handleClickOutside, true);
        };
    }, [isComponentVisible]);

    return { ref, isComponentVisible, setIsComponentVisible };
}