'use client'
import {useEffect, useState} from 'react'
import {Heading, Text} from '@/components/shared/text'
import IkikaiServing from '@/public/img/ikigai-serving.png'
import Image from 'next/image'

export default function Countdown() {
    // For countdown to 00:00 8th of April 2024 (AEDT)
    const [countdown, setCountdown] = useState<{ days: string; hours: string; minutes: string; seconds: string }>({
        days: '00',
        hours: '00',
        minutes: '00',
        seconds: '00',
    })

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date()
            const target = new Date('2025-02-20T00:00:00+1100')
            const distance = target.getTime() - now.getTime()
            const days = Math.floor(distance / (1000 * 60 * 60 * 24))
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
            const seconds = Math.floor((distance % (1000 * 60)) / 1000)

            if (distance <= 0) {
                setCountdown({
                    days: '00',
                    hours: '00',
                    minutes: '00',
                    seconds: '00',
                })
                clearInterval(interval)
                return
            }

            // pad with 0 if less than 10
            const pad = (n: number) => (n < 10 ? `0${n}` : n.toString())
            setCountdown({
                days: pad(days),
                hours: pad(hours),
                minutes: pad(minutes),
                seconds: pad(seconds),
            })
        }, 1000)

        return () => clearInterval(interval)
    }, [])

    return (
        <div className="mx-auto mb-12 grid max-w-7xl grid-cols-1 items-center justify-center gap-8 lg:grid-cols-2">
            <div className="flex flex-col space-y-4">
                <Heading size="3xl" className="font-bold! text-green-500!">
                    Packbase begins waitlist flow in {countdown.days}:{countdown.hours}:{countdown.minutes}:{countdown.seconds}
                </Heading>
                <div className="space-y-2">
                    <Text>
                        Well, we're meeting again.{' '}
                        <b>
                            <u>Packbase will start in an invite-only alpha</u>
                        </b>
                        , however people can invite as many people as they'd like.
                        <br />
                        <br />
                        If you're coming from Yipnyap, you'll need to start fresh on Packbase. At a later date, you can migrate your FurAffinity data onto Packbase either
                        to your profile or to a separate pack profile (alt).
                    </Text>
                </div>
            </div>
            <div className="flex items-end justify-end">
                <Image src={IkikaiServing} alt="shiba serving noodles to stray cats drawing" className="right-0 w-auto" />
            </div>
        </div>
    )
}
