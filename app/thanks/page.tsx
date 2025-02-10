'use client'
import { Heading, Text } from '@/components/shared/text'
import Body from '@/components/layout/body'

export default function ThankYouFriends() {
    return (
        <Body className="max-w-2xl">
            <Heading size="2xl">
                From the bottom of my <s>failing</s> heart, thank you for sticking by me.
            </Heading>
            <Text className="mt-4">
                Even when I went AWOL, even when I was a piece of shit, you stood by me with patience and kindness that pulled me back to reality - thanks for believing
                in me when I struggled to believe in myself. All of your encouragements have made a profound difference in my life, and I am eternally in debt to you.
                <br />
                <br />
                The people who this message is made for know who they are. Here's to Packbase CBT1! Shall we meet IRL, lets get fucking shitfaced 'til the next morning.
            </Text>
        </Body>
    )
}
