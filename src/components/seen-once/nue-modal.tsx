/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import Modal from '@/components/modal'
import { Heading } from '@/components/shared/text.tsx'
import { useEffect, useState } from 'react'
import { Button } from '@/components/shared/experimental-button-rework'
import Markdown from '@/components/shared/markdown.tsx'
import { AnimatedCharacter, Expressions } from '@/components/shared/animated-character'

/**
 * Character Text Box Modal for user guidance and onboarding
 */

const TALKING_DELAY = 2000

export interface DialogueStep {
    id: string
    title: string
    content: string[]
    expression?: number
    buttons?: {
        text: string
        action: () => void
        variant?: 'primary' | 'secondary' | 'danger'
    }[]
    onShow?: () => void
    onComplete?: () => void
}

export interface CharacterTextBoxConfig {
    steps: DialogueStep[]
    mascotSrc?: string
    stateMachine?: string
    onComplete?: () => void
    onCancel?: () => void
    showModal?: boolean
    allowSkip?: boolean
}

interface CharacterTextBoxProps {
    config?: CharacterTextBoxConfig
}

export default function NUEModal({ config }: CharacterTextBoxProps) {
    const {
        steps,
        mascotSrc = '/img/rive/mascat-placeholder-please-replace.riv',
        stateMachine = 'State Machine 1',
        onComplete,
        onCancel,
        showModal = true,
        allowSkip = true,
    } = config || createDebugNUEFlow()

    const [currentStepIndex, setCurrentStepIndex] = useState(0)
    const [talking, setTalking] = useState(true)
    const [expression, setExpression] = useState(Expressions.AMAZED)

    const currentStep = steps[currentStepIndex]

    useEffect(() => {
        if (currentStep) {
            setExpression(currentStep.expression ?? Expressions.AMAZED)
            setTalking(true)
            currentStep.onShow?.()
        }
    }, [currentStepIndex])

    const handleNext = () => {
        if (currentStepIndex < steps.length - 1) {
            currentStep.onComplete?.()
            setCurrentStepIndex(currentStepIndex + 1)
        } else {
            currentStep.onComplete?.()
            onComplete?.()
        }
    }

    const handlePrevious = () => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex(currentStepIndex - 1)
        }
    }

    const handleSkip = () => {
        onCancel?.()
    }

    const handleClose = () => {
        onCancel?.()
    }

    if (!currentStep) {
        return null
    }

    return (
        <Modal showModal={showModal} setShowModal={handleClose} className="relative !bg-muted w-1/2 overflow-visible">
            {/* Character mascot */}
            <div className="absolute -top-6/7 md:-left-1/8 md:!-top-33 pointer-events-none w-1/2">
                <AnimatedCharacter
                    src={mascotSrc}
                    stateMachine={stateMachine}
                    expression={expression}
                    isTalking={talking}
                    talkingDuration={TALKING_DELAY}
                    className="h-96"
                />
            </div>

            <div className="m-1 mt-3 md:ml-60 overflow-visible mb-32 xl:ml-72 md:mb-1">
                {/* Header with progress and skip option */}
                <div className="mx-2 my-2 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Heading size="xs">
                            Step {currentStepIndex + 1} of {steps.length}
                        </Heading>
                        <div className="flex gap-1">
                            {steps.map((_, index) => (
                                <div
                                    key={index}
                                    className={`w-2 h-2 rounded-full ${index <= currentStepIndex ? 'bg-primary' : 'bg-n-5'}`}
                                />
                            ))}
                        </div>
                    </div>
                    {allowSkip && (
                        <button onClick={handleSkip} className="text-sm text-muted-foreground hover:opacity-50 underline">
                            Skip
                        </button>
                    )}
                </div>

                {/* Main content area */}
                <div className="bg-white dark:bg-n-8 p-4 h-52 rounded gap-4 justify-center items-center">
                    {/* Text content */}
                    <div className="space-y-4">
                        <Heading size="xl">{currentStep.title}</Heading>
                        <div className="space-y-2">
                            <Markdown>{currentStep.content.join('  \n')}</Markdown>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2 mt-4">
                            {currentStep.buttons ? (
                                currentStep.buttons.map((button, index) => (
                                    <Button
                                        key={index}
                                        onClick={button.action}
                                        // @ts-ignore
                                        color={button.variant ?? 'indigo'}
                                    >
                                        {button.text}
                                    </Button>
                                ))
                            ) : (
                                <>
                                    {currentStepIndex > 0 && <Button onClick={handlePrevious}>Previous</Button>}
                                    <Button onClick={handleNext} color="indigo">
                                        {currentStepIndex < steps.length - 1 ? 'Next' : 'Complete'}
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    )
}

export function createDebugNUEFlow(): CharacterTextBoxConfig {
    return {
        steps: [
            {
                id: 'welcome',
                title: `This is a title!`,
                content: ['Woa...!!!', "Let's go and *render* **some** __markdown__!.", 'I feel so [sigma](https://ifeelsosigma.com)!'],
                expression: Expressions.AMAZED,
            },
            {
                id: 'exp1',
                title: 'im so normal rn',
                content: [`Expressions.NORMAL ${Expressions.NORMAL}`],
                expression: Expressions.NORMAL,
            },
            {
                id: 'exp2',
                title: 'im so annoyed rn',
                content: [`Expressions.ANNOYED ${Expressions.ANNOYED}`],
                expression: Expressions.ANNOYED,
            },
            {
                id: 'exp3',
                title: 'im rlly sad :(',
                content: [`Expressions.WORRIED ${Expressions.SOBBING}`],
                expression: Expressions.SOBBING,
            },
            {
                id: 'exp4',
                title: 'im so worried rn',
                content: [`Expressions.WORRIED_STATIC ${Expressions.WORRIED_STATIC}`],
                expression: Expressions.WORRIED_STATIC,
            },
            {
                id: 'exp5',
                title: 'im so unimpressed rn',
                content: [`Expressions.UNIMPRESSED ${Expressions.UNIMPRESSED}`],
                expression: Expressions.UNIMPRESSED,
            },
            {
                id: 'exp6',
                title: 'im so worried rn',
                content: [`Expressions.WORRIED ${Expressions.WORRIED}`],
                expression: Expressions.WORRIED,
            },
            {
                id: 'exp7',
                title: 'im so amazed rn',
                content: [`Expressions.AMAZED ${Expressions.AMAZED}`],
                expression: Expressions.AMAZED,
            },
            {
                id: 'exp8',
                title: 'im so confused rn',
                content: [`Expressions.CONFUSED ${Expressions.CONFUSED}`],
                expression: Expressions.CONFUSED,
            },
            {
                id: 'exp9',
                title: 'im so motivated rn',
                content: [`Expressions.MOTIVATED ${Expressions.MOTIVATED}`],
                expression: Expressions.MOTIVATED,
            },
        ],
        allowSkip: true,
    }
}
