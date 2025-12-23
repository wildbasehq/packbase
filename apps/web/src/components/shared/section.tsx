import ContentRenderer from '@/components/layout/terms-content-renderer'
import {Heading} from '@/components/shared/text'
import {ContentBlock} from '@/src/types/terms'
import {FC} from 'react'

interface SectionProps {
    section: {
        id: string;
        title: string;
        level: number;
        content: ContentBlock[];
    };
    dataCollection?: Array<{ type: string; purpose: string; retention: string }>;
    retentionOrder?: string[];
}

const Section: FC<SectionProps> = ({section, dataCollection, retentionOrder}) => {
    return (
        <section id={section.id}>
            <Heading size="3xl" className="mb-6 font-bold">
                {section.level}. {section.title}
            </Heading>

            <div className="space-y-8">
                {section.content.map((block, index) => (
                    <div key={index}>
                        <ContentRenderer
                            block={block}
                            dataCollection={dataCollection}
                            retentionOrder={retentionOrder}
                        />
                    </div>
                ))}
            </div>
        </section>
    )
}

export default Section