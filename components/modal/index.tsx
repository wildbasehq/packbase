'use client'

import {useCallback, useEffect, useRef} from 'react'
import FocusTrap from 'focus-trap-react'
import {AnimatePresence, motion} from 'framer-motion'
import Leaflet from './leaflet'
import useWindowSize from '@/lib/hooks/use-window-size'

export default function Modal({children, showModal, setShowModal, maxWidth,}: {
    children: React.ReactNode;
    showModal: boolean;
    setShowModal: any;
    maxWidth?: boolean;
}) {
    const desktopModalRef = useRef(null)

    const onKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setShowModal(false)
            }
        },
        [setShowModal],
    )

    useEffect(() => {
        document.addEventListener('keydown', onKeyDown)
        return () => document.removeEventListener('keydown', onKeyDown)
    }, [onKeyDown])

    const {isMobile, isDesktop} = useWindowSize()

    return (
        <AnimatePresence>
            {showModal && (
                <>
                    {isMobile && <Leaflet setShow={setShowModal}>{children}</Leaflet>}
                    {isDesktop && (
                        <>
                            <FocusTrap focusTrapOptions={{initialFocus: false}}>
                                <motion.div
                                    ref={desktopModalRef}
                                    key="desktop-modal"
                                    className="fixed inset-0 z-50 hidden min-h-screen items-center justify-center md:py-8 md:flex"
                                    initial={{opacity: 0, scale: 0.95, translateY: 10}}
                                    animate={{opacity: 1, scale: 1, rotate: 0, translateY: 0}}
                                    exit={{opacity: 0, scale: 0.95, rotate: -1}}
                                    onMouseDown={(e) => {
                                        if (desktopModalRef.current === e.target) {
                                            setShowModal(false)
                                        }
                                    }}
                                >
                                    <div
                                        className={`overflow-hidden shadow-xl bg-card ${maxWidth ? '' : 'w-full md:max-w-md'} md:rounded-2xl md:border border-default`}>
                                        {children}
                                    </div>
                                </motion.div>
                            </FocusTrap>
                            <motion.div
                                key="desktop-backdrop"
                                className="fixed inset-0 z-40 bg-gray-100 bg-opacity-10 backdrop-blur"
                                initial={{opacity: 0}}
                                animate={{opacity: 1}}
                                exit={{opacity: 0}}
                                onClick={() => setShowModal(false)}
                            />
                        </>
                    )}
                </>
            )}
        </AnimatePresence>
    )
}