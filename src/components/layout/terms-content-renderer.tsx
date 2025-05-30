import React from 'react'
import { ContentBlock } from '@/types/terms'
import { Heading, Text } from '@/components/shared/text'

interface ContentRendererProps {
    block: ContentBlock
    dataCollection?: Array<{ type: string; purpose: string; retention: string }>
    retentionOrder?: string[]
}

const ContentRenderer: React.FC<ContentRendererProps> = ({ block, dataCollection = [], retentionOrder = [] }) => {
    const renderContent = () => {
        switch (block.type) {
            case 'heading':
                const HeadingSize = block.level === 1 ? '3xl' : block.level === 2 ? '2xl' : 'xl'
                return (
                    <Heading size={HeadingSize} className={`mb-4 font-semibold ${block.className || ''}`}>
                        {block.content as string}
                    </Heading>
                )

            case 'text':
                return <Text className={`leading-relaxed ${block.className || ''}`}>{block.content as string}</Text>

            case 'list':
                const ListComponent = block.listType === 'ordered' ? 'ol' : 'ul'
                const listClass = block.listType === 'ordered' ? 'list-decimal space-y-2 pl-6' : 'list-disc space-y-2 pl-6'

                return (
                    <ListComponent className={`text-default ${listClass} ${block.className || ''}`}>
                        {block.items?.map((item, index) => (
                            <li key={index}>
                                <Text>{item}</Text>
                            </li>
                        ))}
                    </ListComponent>
                )

            case 'table':
                if (block.tableData?.rows === 'dataCollection') {
                    // Sort data collection by retention order
                    const sortedData = [...dataCollection].sort(
                        (a, b) => retentionOrder.indexOf(a.retention) - retentionOrder.indexOf(b.retention)
                    )

                    return (
                        <div className="overflow-x-auto rounded border">
                            <table className="min-w-full">
                                <thead className="bg-card">
                                    <tr>
                                        {block.tableData.headers.map((header, index) => (
                                            <th key={index} className="p-4 text-left">
                                                <Text>{header}</Text>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedData.map((row, index) => (
                                        <tr key={index} className="odd:bg-white/50 even:bg-white dark:odd:bg-transparent dark:even:bg-n-7">
                                            <td className="p-4">
                                                <Text>{row.type}</Text>
                                            </td>
                                            <td className="p-4">
                                                <Text>{row.purpose}</Text>
                                            </td>
                                            <td className="p-4">
                                                <Text>{row.retention}</Text>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                }
                break

            case 'card':
                const cardStyles = {
                    default: 'rounded-lg border p-6',
                    dark: 'rounded-lg border border-gray-700 bg-gray-900 p-6',
                    info: 'rounded-lg border border-blue-200 bg-blue-500/10 p-6 dark:border-blue-500/50',
                    warning: 'rounded-lg border border-orange-200 bg-orange-500/10 p-6 dark:border-orange-500/50',
                }

                const textStyles = {
                    dark: 'text-white! [&>*>*]:!text-white *:text-white!',
                    default: '',
                    info: '',
                    warning: '',
                }

                return (
                    <div className={cardStyles[block.style || 'default']}>
                        {block.title && (
                            <Heading size="xl" className={`mb-4 font-medium ${block.style === 'dark' ? 'text-white!' : ''}`}>
                                {block.title}
                            </Heading>
                        )}
                        <div className={textStyles[block.style || 'default']}>
                            {Array.isArray(block.content) ? (
                                block.content.map((subBlock, index) => (
                                    <div key={index} className="mb-4 last:mb-0">
                                        <ContentRenderer
                                            // @ts-ignore
                                            block={subBlock}
                                            dataCollection={dataCollection}
                                            retentionOrder={retentionOrder}
                                        />
                                    </div>
                                ))
                            ) : (
                                <Text>{block.content}</Text>
                            )}
                        </div>
                    </div>
                )

            default:
                return null
        }
    }

    return <>{renderContent()}</>
}

export default ContentRenderer
