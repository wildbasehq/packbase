/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import { useRive } from '@rive-app/react-canvas'
import { useEffect, useState } from 'react'

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
    isTalking?: boolean
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
    isTalking = false,
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

    const [talking, setTalking] = useState(isTalking)
    const [currentExpression, setCurrentExpression] = useState(expression)

    // Update internal state when props change
    useEffect(() => {
        setTalking(isTalking)
    }, [isTalking])

    useEffect(() => {
        setCurrentExpression(expression)
    }, [expression])

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

    // Update Rive animation state
    useEffect(() => {
        rive?.stateMachineInputs(stateMachine)?.forEach(input => {
            const inputName = input.name
            switch (inputName) {
                case 'talk':
                    input.value = talking
                    break
                case 'expNUM':
                    input.value = currentExpression
                    break
                default:
                    break
            }
        })
    }, [rive, talking, currentExpression, stateMachine])

    return <RiveComponent className={className} />
}