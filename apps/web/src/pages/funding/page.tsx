import Body from '@/components/layout/body'
import {ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent} from '@/components/ui/chart'
import {Alert, AlertDescription, AlertTitle, Divider, Heading, Text, useContentFrame} from '@/src/components'
import {BriefcaseIcon, CurrencyDollarIcon, HeartIcon, MegaphoneIcon} from '@heroicons/react/24/solid'
import {Bar, BarChart, CartesianGrid, XAxis} from 'recharts'

type FundingDataType = {
    summary: {
        mrr: number,
        avgIncome: number,
        totalDonators: number,
        totalVolunteers: number,
        totalPartners: number,
        isProfitable: boolean,
        isRamen: boolean,
    },
    chart: {
        month: string,
        income: number,
        spend: number,
    }[]
}

export default function FundingPage() {
    const {
        data: fundingData,
        isLoading
    }: {
        data: FundingDataType,
        isLoading: boolean
    } = useContentFrame('get', 'funding')

    return (
        <>
            {isLoading && (
                <Heading>
                    Hold on...
                </Heading>
            )}

            {!isLoading && (
                <Body className="gap-4 flex flex-col max-w-4xl">
                    <div className="flex flex-col gap-2">
                        <Heading size="xl">
                            <HeartIcon className="w-6 h-6 inline-flex"/> We're funded by you.
                        </Heading>
                        <Text>
                            Funding for Packbase is 100% you, <i>and Rek's pockets</i>. We do not have any investors, we don't raise venture capital, we don't sell or
                            trade any data, and we don't bend to anyone's will - we're an 100% volunteer team. We have some partners that are graciously giving us cheaper
                            services for nothing, but running costs are still a huge drain.
                        </Text>
                    </div>

                    <Divider/>

                    {/* Summary Card */}
                    {fundingData && (
                        <div className="flex flex-col gap-2">
                            <Heading size="xl">
                                <CurrencyDollarIcon className="w-6 h-6 inline-flex"/> Our current financial status.
                            </Heading>
                            <Text>
                                Packbase is making USD${fundingData?.summary?.avgIncome?.toLocaleString()} per month,
                                with {fundingData?.summary?.totalDonators?.toLocaleString()} donators
                                and {fundingData?.summary?.totalVolunteers?.toLocaleString()} volunteers.
                            </Text>
                            <Text>
                                About {fundingData?.summary?.totalPartners?.toLocaleString()} external partners are assisting with lower service fees, or are directly
                                involved with Packbase without wanting anything in return.<sup>*1</sup>
                            </Text>
                            <Text>
                                Revenue is published at the end of each calendar month. Includes one-off payments or donations made by or directed to Wildbase.
                            </Text>

                            <div className="mt-2">
                                {fundingData?.summary?.isProfitable
                                    ? <Text className="text-green-500">✅ Packbase is paying for itself!</Text>
                                    : <Text className="text-red-500">
                                        ❌ Founder is paying ${fundingData?.summary?.mrr?.toLocaleString().replace('-', '')} out of pocket.
                                    </Text>
                                }
                                {fundingData?.summary?.isRamen
                                    ? <Text className="text-green-500">✅ Ramen profitable!</Text>
                                    : <Text className="text-red-500">❌ Founder is covering additional costs - not ramen profitable.</Text>
                                }
                            </div>

                            {/* Chart */}
                            <div className="flex flex-col gap-2">
                                <Heading size="sm">Monthly Revenue</Heading>
                                <ChartContainer config={{
                                    income: {
                                        label: 'Income',
                                        color: 'var(--color-primary-light)',
                                    },
                                    spend: {
                                        label: 'Spend',
                                        color: 'var(--color-accent-1)',
                                    }
                                }} className="min-h-[200px] w-full">
                                    <BarChart accessibilityLayer data={fundingData.chart}>
                                        <CartesianGrid vertical={false}/>
                                        <XAxis
                                            dataKey="month"
                                            tickLine={false}
                                            tickMargin={10}
                                            axisLine={false}
                                            tickFormatter={(value) => value.slice(0, 3)}
                                        />
                                        <ChartTooltip content={<ChartTooltipContent/>}/>
                                        <ChartLegend content={<ChartLegendContent/>}/>
                                        <Bar dataKey="income" fill="var(--color-income)" radius={8}/>
                                        <Bar dataKey="spend" fill="var(--color-spend)" radius={8}/>
                                    </BarChart>
                                </ChartContainer>
                            </div>

                            <Divider/>
                        </div>
                    )}

                    <Alert>
                        <AlertTitle>
                            <CurrencyDollarIcon className="w-6 h-6 inline-flex mr-1"/>
                            I want to financially support Packbase!
                        </AlertTitle>
                        <AlertDescription>
                            Due to some - <i>ahem</i> - recent events beyond our current control, financial support via a supporter tier is not
                            available right now. We do not accept rewards via Patreon.
                            <br/><br/>
                            You'll need to keep an eye on this space - or the blog - to know when it's available again.
                            {/*:O :D*/}
                            {/*<br/><br/>*/}
                            {/*Every dollar counts, and we're grateful for your support! To support us financially, you can become a supporter via Packbase DX. To subscribe:*/}
                            {/*<ol className="list-decimal list-inside">*/}
                            {/*    <li>Click / Tap on your Avatar on the top-right</li>*/}
                            {/*    <li>Click the "Billing" tab</li>*/}
                            {/*    <li>Click "Switch Plans"</li>*/}
                            {/*    <li>Choose the plan titled "Packbase DX"</li>*/}
                            {/*    <li>Checkout by following the prompts on screen - they differ based on your payment method and country.</li>*/}
                            {/*    <li>That's it!</li>*/}
                            {/*</ol>*/}
                        </AlertDescription>
                    </Alert>

                    <Alert>
                        <AlertTitle>
                            <MegaphoneIcon className="w-6 h-6 inline-flex mr-1"/>
                            I'm not in a position to donate to Packbase, but I want to show my support!
                        </AlertTitle>
                        <AlertDescription>
                            Me too!
                            <br/><br/>
                            Just spreading the word helps us a great amount, arguably more than financial support! You can do so by sharing Packbase with your friends,
                            your
                            social media, or by bringing your community over onto Packbase to use often.
                        </AlertDescription>
                    </Alert>

                    <Alert>
                        <AlertTitle>
                            <BriefcaseIcon className="w-6 h-6 inline-flex mr-1"/>
                            I don't have an online presence, is there anything I can do?
                        </AlertTitle>
                        <AlertDescription>
                            On top of just using Packbase often, joining our team and contributing your talent would be extremely valuable. If you have the spare time and
                            don't
                            mind about volunteer work, we'd love to have you on board! <a className="underline" href="mailto:rek@wildhq.org">Contact Rek (email)</a> to
                            discuss.
                        </AlertDescription>
                    </Alert>

                    <Divider/>

                    <Text size="xs">
                        *1: We do not disclose our external partners as per our agreements with them, if we fail, they'd be in the cross-fire. These external partners
                        help with providing us with cheaper service costs, providing their services free of charge, or otherwise provides professional guidance on how we
                        should operate. None of them have a controlling influence on Packbase or Wildbase at all and we hold every right to cut ties with them or
                        disregard their advice at any time, nor do they expect (or may even receive) anything in return.
                    </Text>
                </Body>
            )}
        </>
    )
}