/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import { useRive } from '@rive-app/react-canvas'
import { useEffect, useState } from 'react'
import { useTimeout } from 'usehooks-ts'

/**
 * Character expression constants
 */
export const Expressions = {
    DEFAULT: 0,
    NORMAL: 1,
    ANNOYED: 2,
    SOBBING: 3,
    WORRIED_STATIC: 4,
    UNIMPRESSED: 5,
    WORRIED: 6,
    AMAZED: 7,
    CONFUSED: 8,
    MOTIVATED: 9,
}

export interface AnimatedCharacterProps {
    /**
     * Path to the Rive animation file
     */
    src?: string
    /**
     * Name of the state machine to use
     */
    stateMachine?: string
    /**
     * Current expression to display
     */
    expression?: number
    /**
     * Whether the character is currently talking
     */
    talkingState?: [boolean, React.Dispatch<React.SetStateAction<boolean>>]
    /**
     * How long the character should talk before stopping (in ms)
     */
    talkingDuration?: number
    /**
     * Additional class names to apply to the component
     */
    className?: string
    /**
     * Callback when talking stops
     */
    onTalkingComplete?: () => void
    /**
     * Auto-play the animation
     */
    autoplay?: boolean
}

export function AnimatedCharacter({
    src = '/img/rive/mascat-placeholder-please-replace.riv',
    stateMachine = 'State Machine 1',
    expression = Expressions.AMAZED,
    talkingState = useState(false),
    talkingDuration = 2000,
    className = '',
    onTalkingComplete,
    autoplay = true,
}: AnimatedCharacterProps) {
    const { rive, RiveComponent } = useRive({
        src,
        stateMachines: stateMachine,
        autoplay,
    })

    const [talking, setTalking] = talkingState

    // Update internal state when props change
    useEffect(() => {
        updateRiveInput('talk', talking)
    }, [talking])

    useEffect(() => {
        updateRiveInput('expNUM', expression)
    }, [expression])

    useTimeout(() => {
        updateRiveInput('expNUM', expression)
    }, 1000)

    // Handle talking timer
    useEffect(() => {
        let timer: NodeJS.Timeout
        if (talking) {
            timer = setTimeout(() => {
                setTalking(false)
                onTalkingComplete?.()
            }, talkingDuration)
        }
        return () => {
            if (timer) clearTimeout(timer)
        }
    }, [talking, talkingDuration, onTalkingComplete])

    const updateRiveInput = (inputName: string, value: boolean | number) => {
        console.log('Updating Rive input', inputName, value)
        rive?.stateMachineInputs(stateMachine)?.forEach(input => {
            if (input.name === inputName) {
                input.value = value
            }
        })
    }

    return <RiveComponent className={className} />
}
