import Body from '@/components/layout/body'
import { Heading, Text } from '@/components/shared/text'
import Link from '@/components/shared/link'

const retentionOrder = [
    'Until ✱ID deletion',
    'Until resolved or ✱ID deletion',
    'Until profile deletion',
    'Until profile or page deletion',
    'Until profile or space deletion',
    'Until pack deletion',
    'Until pack or page deletion',
    'Until used or expired',
    'Until session expiration',
    '90 days',
    '30 days',
    'Until profile deletion or as required by law',
    'Never - Stored in browser, but sent to API & disposed of after processing',
]

const dataCollection = [
    { type: 'Email address', purpose: 'Account identification', retention: 'Until ✱ID deletion' },
    { type: 'Verified birth date', purpose: 'Account verification for 18+ feature-sets.', retention: 'Until ✱ID deletion' },
    { type: 'Username', purpose: 'Display name', retention: 'Until profile deletion' },
    { type: 'Slug', purpose: 'User space domain', retention: 'Until profile deletion' },
    { type: 'Custom Domain', purpose: 'User space domain', retention: 'Until profile deletion' },
    { type: 'Login timestamps', purpose: 'Security monitoring', retention: '90 days' },
    { type: 'IP address', purpose: 'Fraud prevention', retention: '30 days' },

    // Pack Information
    { type: 'Pack name', purpose: 'User interaction regarding groups', retention: 'Until pack deletion' },
    { type: 'Pack description', purpose: 'User interaction regarding groups', retention: 'Until pack deletion' },
    { type: 'Pack category', purpose: 'User interaction regarding groups', retention: 'Until pack deletion' },
    { type: 'Pack tags', purpose: 'User interaction regarding groups', retention: 'Until pack deletion' },
    { type: 'Pack visibility', purpose: 'User interaction regarding groups', retention: 'Until pack deletion' },
    { type: 'Pack creation date', purpose: 'User interaction regarding groups', retention: 'Until pack deletion' },
    { type: 'Pack custom pages', purpose: 'User interaction regarding groups', retention: 'Until pack or page deletion' },
    { type: 'Pack custom page HTML code', purpose: 'User interaction regarding groups', retention: 'Until pack or page deletion' },
    { type: 'Pack custom page CSS code', purpose: 'User interaction regarding groups', retention: 'Until pack or page deletion' },
    { type: 'Pack memberships', purpose: 'User interaction regarding groups', retention: 'Until profile deletion' },

    { type: 'Profile picture', purpose: 'User profile customization', retention: 'Until profile deletion' },
    { type: 'Header image', purpose: 'User profile customization', retention: 'Until profile deletion' },
    { type: 'Profile HTML code', purpose: 'User profile customization', retention: 'Until profile deletion' },
    { type: 'Profile CSS code', purpose: 'User profile customization', retention: 'Until profile deletion' },
    { type: 'Custom profile pages', purpose: 'User profile customization', retention: 'Until profile or page deletion' },
    { type: 'Custom profile page HTML code', purpose: 'User profile customization', retention: 'Until profile or page deletion' },
    { type: 'Custom profile page CSS code', purpose: 'User profile customization', retention: 'Until profile or page deletion' },
    { type: 'Space HTML code', purpose: 'User profile customization', retention: 'Until profile or space deletion' },
    { type: 'Space CSS code', purpose: 'User profile customization', retention: 'Until profile or space deletion' },
    { type: 'Space JS code', purpose: 'User profile customization', retention: 'Until profile or space deletion' },
    { type: 'Bio', purpose: 'User profile information', retention: 'Until profile deletion' },
    { type: 'Flair', purpose: 'User profile information', retention: 'Until profile deletion' },
    { type: 'Post content', purpose: 'User-generated content', retention: 'Until profile deletion' },
    { type: 'Comments', purpose: 'User interaction', retention: 'Until profile deletion' },
    { type: 'Likes', purpose: 'User interaction', retention: 'Until profile deletion' },
    { type: 'Followers', purpose: 'User interaction', retention: 'Until profile deletion' },
    { type: 'Following', purpose: 'User interaction', retention: 'Until profile deletion' },
    { type: 'Messages', purpose: 'User communication', retention: 'Until profile deletion' },
    { type: 'Invite codes', purpose: 'User invitation', retention: 'Until used or expired' },
    { type: 'Session tokens', purpose: 'User authentication', retention: 'Until session expiration' },
    { type: 'Device information', purpose: 'Security monitoring', retention: '90 days' },
    { type: 'Error logs', purpose: 'Debugging and troubleshooting', retention: '30 days' },
    { type: 'Activity logs', purpose: 'Fraud prevention', retention: '90 days' },
    { type: 'Payment information', purpose: 'Transaction processing', retention: 'Until profile deletion or as required by law' },
    { type: 'Subscription details', purpose: 'Service management', retention: 'Until profile deletion' },
    { type: 'Support tickets', purpose: 'Customer support', retention: 'Until resolved or ✱ID deletion' },
    { type: 'Preferences', purpose: 'User experience customization', retention: 'Until profile deletion' },
    { type: 'Notification settings', purpose: 'User experience customization', retention: 'Until profile deletion' },
    {
        type: 'Search history',
        purpose: 'User experience customization',
        retention: 'Never - Stored in browser, but sent to API & disposed of after processing',
    },
].sort((a, b) => {
    return retentionOrder.indexOf(a.retention) - retentionOrder.indexOf(b.retention)
})

export default function TermsPage() {
    return (
        <Body className="max-w-7xl space-y-12">
            <header>
                <Heading size="3xl">Packbase Usage Policy and Data Handling</Heading>
                <Text alt>Last Updated: February 17, 2025</Text>
            </header>

            <section>
                <Heading size="3xl" className="mb-6 font-bold">
                    1. Usage Policy
                </Heading>

                <div className="space-y-8">
                    <div>
                        <Heading className="mb-4 text-2xl font-semibold">1.1 Agreement to Terms</Heading>
                        <Text className="leading-relaxed">
                            By accessing or using Packbase, you agree to be bound by these Usage Policy. If you disagree with any part of
                            these terms, you may not access Packbase.
                        </Text>
                    </div>

                    <div>
                        <Heading className="mb-4 text-2xl font-semibold">1.2 Changes to Terms</Heading>
                        <Text className="leading-relaxed">
                            We reserve the right to modify these terms at any time. We will notify you of any changes by posting the new
                            terms on Packbase. Your continued use of Packbase constitutes acceptance of the modified terms.
                        </Text>
                    </div>

                    <div>
                        <Heading className="mb-4 text-2xl font-semibold">1.3 User Responsibilities</Heading>
                        <ul className="text-default list-disc space-y-2 pl-6">
                            <li>
                                <Text>You must be at least 16 years old to use Packbase</Text>
                            </li>
                            <li>
                                <Text>You are responsible for maintaining the confidentiality of your account</Text>
                            </li>
                            <li>
                                <Text>You agree not to use Packbase for any unlawful purposes</Text>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <Heading className="mb-4 text-2xl font-semibold">1.4 Termination</Heading>
                        <Text className="leading-relaxed">
                            We may terminate or suspend your account at any time, without prior notice, for any reason.
                        </Text>
                    </div>

                    <div>
                        <Heading className="mb-4 font-semibold">1.4 Account Types and Content Guidelines</Heading>

                        <div className="space-y-6">
                            <div className="rounded-lg border p-6">
                                <Heading size="xl" className="mb-4 font-medium">
                                    Standard Account Guidelines
                                </Heading>
                                <Text className="mb-4">
                                    Standard accounts must maintain PG-13 appropriate content. The following are prohibited:
                                </Text>
                                <ul className="text-default list-disc space-y-2 pl-6">
                                    <li>
                                        <Text>Adult or sexually explicit content outside of an Afterdark Account</Text>
                                    </li>
                                    <li>
                                        <Text>Extreme violence or gore</Text>
                                    </li>
                                    <li>
                                        <Text>Hate speech or discriminatory content</Text>
                                    </li>
                                    <li>
                                        <Text>Harassment or bullying</Text>
                                    </li>
                                    <li>
                                        <Text>Condoning, advocating, or displaying the use of illegal substances or activities</Text>
                                    </li>
                                    <li>
                                        <Text>Personal information 5without consent</Text>
                                    </li>
                                    <li>
                                        <Text>Spam or unauthorized advertising</Text>
                                    </li>
                                    <li>
                                        <Text>Impersonation of others</Text>
                                    </li>
                                    <li>
                                        <Text>Content promoting self-harm</Text>
                                    </li>
                                    <li>
                                        <Text>Manipulation of platform metrics</Text>
                                    </li>
                                    <li>
                                        <Text>Real-life sexually explicit content</Text>
                                    </li>
                                    <li>
                                        <Text>
                                            Any suggestive content depicting underage characters or people, whether fictional or not.
                                        </Text>
                                    </li>
                                    <li>
                                        <Text>Non-consensual content</Text>
                                    </li>
                                    <li>
                                        <Text>Extreme violence or gore</Text>
                                    </li>
                                    <li>
                                        <Text>Hate speech or harassment</Text>
                                    </li>
                                    <li>
                                        <Text>Illegal activities</Text>
                                    </li>
                                    <li>
                                        <Text>Exploitation or trafficking</Text>
                                    </li>
                                </ul>
                            </div>

                            <div className="rounded-lg border border-gray-700 bg-gray-900 p-6">
                                <Heading size="xl" className="mb-4 font-medium text-white!">
                                    Afterdark Account Guidelines
                                </Heading>
                                <Text className="mb-2 text-white!">
                                    Afterdark accounts allow mature content with the following requirements:
                                </Text>

                                <div className="space-y-4">
                                    <div>
                                        <Heading size="lg" className="mb-2 text-white!">
                                            Age Verification
                                        </Heading>
                                        <ul className="list-disc space-y-2 pl-6 [&>*>*]:!text-white *:text-white!">
                                            <li>
                                                <Text>Users must be 18+ and verify their age</Text>
                                            </li>
                                            <li>
                                                <Text>Valid government ID required for verification</Text>
                                            </li>
                                            <li>
                                                <Text>Annual verification renewal required</Text>
                                            </li>
                                        </ul>
                                    </div>

                                    <div>
                                        <Heading size="lg" className="mb-2 text-white!">
                                            Permitted Content
                                        </Heading>
                                        <ul className="list-disc space-y-2 pl-6 [&>*>*]:!text-white *:text-white!">
                                            <li>
                                                <Text>Adult content must be properly tagged</Text>
                                            </li>
                                            <li>
                                                <Text>
                                                    Content must be only be illustrated works. Real-life sexually explicit content is not
                                                    allowed.
                                                </Text>
                                            </li>
                                            <li>
                                                <Text>Clear content warnings required</Text>
                                            </li>
                                            <li>
                                                <Text>Must respect community guidelines</Text>
                                            </li>
                                            <li>
                                                <Text>All other aforementioned prohibited content is still prohibited</Text>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-lg border bg-card p-6">
                                <Heading size="xl" className="mb-4">
                                    Content Moderation and Enforcement
                                </Heading>
                                <ul className="text-default list-disc space-y-2 pl-6">
                                    <li>
                                        <Text>Content is monitored by automated systems and human moderators</Text>
                                    </li>
                                    <li>
                                        <Text>Violations result in content removal and possible account suspension</Text>
                                    </li>
                                    <li>
                                        <Text>Repeated violations lead to permanent account termination</Text>
                                    </li>
                                    <li>
                                        <Text>Illegal content will be reported to authorities</Text>
                                    </li>
                                    <li>
                                        <Text>Appeals can be submitted within 30 days</Text>
                                    </li>
                                </ul>
                            </div>

                            <div className="rounded-lg border border-blue-200 bg-blue-500/10 p-6 dark:border-blue-500/50">
                                <Heading size="xl" className="mb-4">
                                    Content Visibility and Discovery
                                </Heading>
                                <ul className="text-default list-disc space-y-2 pl-6">
                                    <li>
                                        <Text>Afterdark content is hidden from standard searches</Text>
                                    </li>
                                    <li>
                                        <Text>Only other Afterdark accounts can view Afterdark content</Text>
                                    </li>
                                    <li>
                                        <Text>Content warnings cannot be disabled</Text>
                                    </li>
                                    <li>
                                        <Text>Cross-posting between account types is prohibited</Text>
                                    </li>
                                    <li>
                                        <Text>Geographic restrictions may apply based on local laws</Text>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section>
                <Heading size="3xl" className="mb-6 font-bold">
                    2. Privacy Policy
                </Heading>

                <div className="space-y-8">
                    <div className="mb-8">
                        <Heading className="mb-4">2.1 Compliance and Security</Heading>

                        <div className="space-y-6">
                            <div>
                                <Heading className="mb-2">Wildbase Security T2</Heading>
                                <Text>We maintain compliance with Wildbase Security T2, which means:</Text>
                                <ul className="mt-2 list-disc space-y-2 pl-6">
                                    <li>
                                        <Text>Annual third-party audits of our security controls</Text>
                                    </li>
                                    <li>
                                        <Text>Continuous monitoring and logging of system activity</Text>
                                    </li>
                                    <li>
                                        <Text>Regular assessment of security, availability, and confidentiality controls</Text>
                                    </li>
                                    <li>
                                        <Text>Documented change management procedures</Text>
                                    </li>
                                    <li>
                                        <Text>Rigorous access control and authentication measures</Text>
                                    </li>
                                </ul>
                                <Text className="mt-4">
                                    Wildbase Security T2 an in-house security standard that ensures the confidentiality, integrity, and
                                    availability of our systems and data from transit to rest.
                                </Text>
                            </div>

                            <div>
                                <Heading className="mb-2">Additional Security Measures</Heading>
                                <ul className="list-disc space-y-2 pl-6">
                                    <li>
                                        <Text>Regular penetration testing and vulnerability assessments</Text>
                                    </li>
                                    <li>
                                        <Text>24/7 security monitoring and incident response</Text>
                                    </li>
                                    <li>
                                        <Text>Data encryption at rest and in transit</Text>
                                    </li>
                                    <li>
                                        <Text>Regular security updates and patch management</Text>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div>
                        <Heading className="mb-4">2.2 Data Collection</Heading>
                        <Text className="mb-4">
                            We collect the following data to provide and improve Packbase. By using Packbase, you agree to the collection
                            and use of information in accordance with this policy. 2 types of data pools exist; A WildID ("✱ID") and a
                            Packbase Account ("Account", "Profile"). When you create a Packbase Account, you are also creating a ✱ID.
                            Sensitive data is only stored in ✱ID.
                        </Text>
                        <div className="overflow-x-auto rounded border">
                            <table className="min-w-full">
                                <thead className="bg-card">
                                    <tr>
                                        <th className="p-4 text-left">
                                            <Text>Data Type</Text>
                                        </th>
                                        <th className="p-4 text-left">
                                            <Text>Purpose</Text>
                                        </th>
                                        <th className="p-4 text-left">
                                            <Text>Retention Period</Text>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dataCollection.map(data => (
                                        <tr
                                            key={data.type}
                                            className="odd:bg-white/50 even:bg-white dark:odd:bg-transparent dark:even:bg-n-7"
                                        >
                                            <td className="p-4">
                                                <Text>{data.type}</Text>
                                            </td>
                                            <td className="p-4">
                                                <Text>{data.purpose}</Text>
                                            </td>
                                            <td className="p-4">
                                                <Text>{data.retention}</Text>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div>
                        <Heading className="mb-4 text-2xl font-semibold">2.2 GDPR Compliance</Heading>
                        <Text className="mb-4">Under the General Data Protection Regulation (GDPR), you have the following rights:</Text>
                        <ul className="text-default list-disc space-y-2 pl-6">
                            <li>
                                <Text>Right to access your personal data</Text>
                            </li>
                            <li>
                                <Text>Right to rectification of inaccurate data</Text>
                            </li>
                            <li>
                                <Text>Right to erasure ("right to be forgotten")</Text>
                            </li>
                            <li>
                                <Text>Right to restrict processing</Text>
                            </li>
                            <li>
                                <Text>Right to data portability</Text>
                            </li>
                            <li>
                                <Text>Right to object to processing</Text>
                            </li>
                        </ul>
                        <Text className="mt-4">
                            To exercise these rights, go to your profile settings then "Data Access", or email support@packbase.app.
                        </Text>
                    </div>

                    <div>
                        <Heading className="mb-4 text-2xl font-semibold">2.3 Children's Privacy (COPPA Compliance)</Heading>
                        <ul className="text-default list-disc space-y-2 pl-6">
                            <li>
                                <Text>We do not knowingly collect personal information from children under 13</Text>
                            </li>
                            <li>
                                <Text>
                                    If we learn we have collected personal information from a child under 13, we will delete that
                                    information
                                </Text>
                            </li>
                            <li>
                                <Text>Parents can review, delete, or refuse further collection of their child's information</Text>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <Heading className="mb-4 text-2xl font-semibold">2.4 Data Security</Heading>
                        <Text className="mb-4">
                            We implement appropriate technical and organizational measures to protect your data, including:
                        </Text>
                        <ul className="text-default list-disc space-y-2 pl-6">
                            <li>
                                <Text>Encryption of data in transit and at rest</Text>
                            </li>
                            <li>
                                <Text>Regular security assessments</Text>
                            </li>
                            <li>
                                <Text>Access controls and authentication</Text>
                            </li>
                            <li>
                                <Text>Regular backups</Text>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <Heading className="mb-4 text-2xl font-semibold">2.5 Third-Party Services</Heading>
                        <Text className="mb-4">We do not share your personal data with third parties except:</Text>
                        <ul className="text-default list-disc space-y-2 pl-6">
                            <li>
                                <Text>When required by law</Text>
                            </li>
                            <li>
                                <Text>With your explicit consent</Text>
                            </li>
                            <li>
                                <Text>To protect our legal rights</Text>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <Heading className="mb-4 text-2xl font-semibold">2.6 Data Subject Requests</Heading>
                        <Text className="mb-4">To request access, modification, or deletion of your personal data:</Text>
                        <ol className="text-default list-decimal space-y-2 pl-6">
                            <li>
                                <Text>Login to the specified account</Text>
                            </li>
                            <li>
                                <Text>Verify your identity</Text>
                            </li>
                            <li>
                                <Text>Go to your account settings</Text>
                            </li>
                            <li>
                                <Text>Go to "Data Access"</Text>
                            </li>
                            <li>
                                <Text>Choose the corresponding option that suits the request</Text>
                            </li>
                        </ol>
                        <Text className="mt-4">We will respond to all requests within 30 days.</Text>
                    </div>

                    <div>
                        <Heading className="mb-4 text-2xl font-semibold">2.7 Contact Information</Heading>
                        <Text className="mb-4">
                            For any questions about these terms or our privacy practices, email support@packbase.app OR contact us on our
                            official <Link href="https://discord.gg/wildbase">Discord support channel</Link>.
                        </Text>
                    </div>
                </div>
            </section>

            <section>
                <Heading size="3xl" className="mb-6 font-bold">
                    3. Governing Law
                </Heading>
                <Text>
                    These terms shall be governed by and construed in accordance with the laws of Victoria, Australia, without regard to its
                    conflict of law provisions.
                </Text>
            </section>
        </Body>
    )
}
