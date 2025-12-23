// Main Terms Page Component
import Body from '@/components/layout/body'
import Section from '@/components/shared/section'
import {Heading, Text} from '@/components/shared/text'
import {termsConfig} from '@/types/terms'

export default function DynamicTermsPage() {
    const {header, sections, dataCollection, retentionOrder} = termsConfig

    return (
        <Body className="max-w-7xl space-y-12">
            <header>
                <Heading size="3xl">{header.title}</Heading>
                <Text alt>Last Updated: {header.lastUpdated}</Text>
            </header>

            {sections.map((section) => (
                <Section
                    key={section.id}
                    section={section}
                    dataCollection={dataCollection}
                    retentionOrder={retentionOrder}
                />
            ))}
        </Body>
    )
}