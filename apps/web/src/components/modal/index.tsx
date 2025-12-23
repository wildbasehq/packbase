import {cn} from '@/lib'
import useWindowSize from '@/lib/hooks/use-window-size'
import {AnimatePresence, motion} from 'motion/react'
import {ReactNode, useCallback, useEffect, useRef} from 'react'
import Leaflet from './leaflet'

export default function Modal({
                                  children,
                                  showModal,
                                  setShowModal,
                                  className,
                              }: {
    children: ReactNode
    showModal: boolean
    setShowModal: any
    maxWidth?: boolean
    className?: string
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
                            <motion.div
                                ref={desktopModalRef}
                                key="desktop-modal"
                                className="fixed inset-0 z-50 hidden min-h-screen items-center justify-center md:flex md:py-8"
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
                                    className={cn(className, `max-h-full overflow-auto bg-card shadow-xl md:rounded-2xl md:border`)}>
                                    {children}
                                </div>
                            </motion.div>
                            <motion.div
                                key="desktop-backdrop"
                                className="fixed inset-0 z-[45] bg-gray-100/10 backdrop-blur-sm"
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
