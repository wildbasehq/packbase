/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

// types/terms.ts
export const BANNED_COUNTRIES = [
    'North Korea',
    'Israel',
    'Iran',
    'Syria',
    'Cuba',
    'Belarus',
    'Russia',
    'Sudan',
    'Venezuela',
    'Zimbabwe',
    'Myanmar',
].sort()

export interface ContentBlock {
    type: 'text' | 'list' | 'table' | 'card' | 'heading'
    content?:
        | string
        | (
              | {
                    type: string
                    content: string
                }
              | {
                    type: string
                    listType: string
                    items: string[]
                }
          )[]
    items?: string[]
    listType?: 'ordered' | 'unordered'
    level?: number
    className?: string
    style?: 'default' | 'dark' | 'info' | 'warning'
    title?: string
    tableData?: TableData
}

export interface TableData {
    headers: string[]
    rows: 'dataCollection' | Array<Record<string, string>>
}

export interface Section {
    id: string
    title: string
    level: number
    content: ContentBlock[]
}

export interface TermsConfig {
    header: {
        title: string
        lastUpdated: string
    }
    retentionOrder: string[]
    dataCollection: Array<{
        type: string
        purpose: string
        retention: string
    }>
    sections: Section[]
}

const RetentionOrders = {
    UNTIL_WID_DEL: 'Until ✱ID deletion',
    UNTIL_RESOLVED_OR_WID_DEL: 'Until resolved or ✱ID deletion',
    UNTIL_PROFILE_DEL: 'Until profile deletion',
    UNTIL_PROFILE_OR_PAGE_DEL: 'Until profile or page deletion',
    UNTIL_PROFILE_OR_SPACE_DEL: 'Until profile or space deletion',
    UNTIL_PACK_DEL: 'Until pack deletion',
    UNTIL_PACK_OR_PAGE_DEL: 'Until pack or page deletion',
    UNTIL_USED_OR_EXPIRED: 'Until used or expired',
    UNTIL_SESSION_EXPIRATION: 'Until session expiration',
    DAYS_90: '90 days',
    DAYS_30: '30 days',
    UNTIL_PROFILE_DEL_OR_LAW: 'Until profile deletion or as required by law',
    NEVER_BROWSER_ONLY: 'Never - Stored in browser',
}

export const termsConfig: TermsConfig = {
    header: {
        title: 'Packbase Usage Policy and Data Handling',
        lastUpdated: 'May 30, 2025',
    },
    retentionOrder: Object.values(RetentionOrders),
    dataCollection: [
        {
            type: 'Email address',
            purpose: 'Account identification and communication',
            retention: RetentionOrders.UNTIL_WID_DEL,
        },
        {
            type: 'Verified birth date',
            purpose: 'Account verification for 18+ feature-sets',
            retention: RetentionOrders.UNTIL_WID_DEL,
        },
        { type: 'Username', purpose: 'Display name and identification', retention: RetentionOrders.UNTIL_PROFILE_DEL },
        { type: 'Slug', purpose: 'User space domain for personalized URL', retention: RetentionOrders.UNTIL_PROFILE_DEL },
        {
            type: 'Custom Domain',
            purpose: 'User space domain for personalized URL',
            retention: RetentionOrders.UNTIL_PROFILE_DEL,
        },
        { type: 'Login timestamps', purpose: 'Security monitoring and fraud prevention', retention: RetentionOrders.DAYS_90 },
        { type: 'IP address', purpose: 'Fraud prevention and security', retention: RetentionOrders.DAYS_30 },
        { type: 'Role information', purpose: 'Access control and permissions', retention: RetentionOrders.UNTIL_WID_DEL },
        {
            type: 'Account type',
            purpose: 'Service provisioning and access control',
            retention: RetentionOrders.UNTIL_WID_DEL,
        },
        {
            type: 'Multi-factor authentication settings',
            purpose: 'Account security',
            retention: RetentionOrders.UNTIL_WID_DEL,
        },
        { type: 'Session tokens', purpose: 'User authentication', retention: RetentionOrders.UNTIL_SESSION_EXPIRATION },
        {
            type: 'Refresh tokens',
            purpose: 'Maintaining authenticated sessions',
            retention: RetentionOrders.UNTIL_SESSION_EXPIRATION,
        },
        {
            type: 'Identity provider information',
            purpose: 'Third-party authentication',
            retention: RetentionOrders.UNTIL_WID_DEL,
        },
        { type: 'Display name', purpose: 'User profile customization', retention: RetentionOrders.UNTIL_PROFILE_DEL },
        { type: 'Bio', purpose: 'User profile information', retention: RetentionOrders.UNTIL_PROFILE_DEL },
        { type: 'Profile picture', purpose: 'User profile customization', retention: RetentionOrders.UNTIL_PROFILE_DEL },
        { type: 'Header image', purpose: 'User profile customization', retention: RetentionOrders.UNTIL_PROFILE_DEL },
        { type: 'Profile HTML code', purpose: 'User profile customization', retention: RetentionOrders.UNTIL_PROFILE_DEL },
        { type: 'Profile CSS code', purpose: 'User profile customization', retention: RetentionOrders.UNTIL_PROFILE_DEL },
        {
            type: 'Space HTML code',
            purpose: 'User profile customization',
            retention: RetentionOrders.UNTIL_PROFILE_OR_SPACE_DEL,
        },
        {
            type: 'Space CSS code',
            purpose: 'User profile customization',
            retention: RetentionOrders.UNTIL_PROFILE_OR_SPACE_DEL,
        },
        {
            type: 'Space JS code',
            purpose: 'User profile customization',
            retention: RetentionOrders.UNTIL_PROFILE_OR_SPACE_DEL,
        },
        { type: 'Flair', purpose: 'User profile information', retention: RetentionOrders.UNTIL_PROFILE_DEL },
        {
            type: 'Custom profile pages',
            purpose: 'User profile customization',
            retention: RetentionOrders.UNTIL_PROFILE_OR_PAGE_DEL,
        },
        {
            type: 'Custom profile page HTML code',
            purpose: 'User profile customization',
            retention: RetentionOrders.UNTIL_PROFILE_OR_PAGE_DEL,
        },
        {
            type: 'Custom profile page CSS code',
            purpose: 'User profile customization',
            retention: RetentionOrders.UNTIL_PROFILE_OR_PAGE_DEL,
        },
        { type: 'Profile settings', purpose: 'User experience customization', retention: RetentionOrders.UNTIL_PROFILE_DEL },
        {
            type: 'Profile privacy settings',
            purpose: 'Content visibility control',
            retention: RetentionOrders.UNTIL_PROFILE_DEL,
        },
        {
            type: 'Space type settings',
            purpose: 'Profile customization options',
            retention: RetentionOrders.UNTIL_PROFILE_DEL,
        },
        { type: 'Post content', purpose: 'User-generated content', retention: RetentionOrders.UNTIL_PROFILE_DEL },
        {
            type: 'Post assets (images, etc.)',
            purpose: 'User-generated content',
            retention: RetentionOrders.UNTIL_PROFILE_DEL,
        },
        { type: 'Comments', purpose: 'User interaction', retention: RetentionOrders.UNTIL_PROFILE_DEL },
        { type: 'Reactions', purpose: 'User interaction', retention: RetentionOrders.UNTIL_PROFILE_DEL },
        {
            type: 'Followers',
            purpose: 'User interaction and social networking',
            retention: RetentionOrders.UNTIL_PROFILE_DEL,
        },
        {
            type: 'Following',
            purpose: 'User interaction and social networking',
            retention: RetentionOrders.UNTIL_PROFILE_DEL,
        },
        { type: 'Messages', purpose: 'User communication', retention: RetentionOrders.UNTIL_PROFILE_DEL },
        { type: 'Pack name', purpose: 'User interaction regarding groups', retention: RetentionOrders.UNTIL_PACK_DEL },
        { type: 'Pack description', purpose: 'User interaction regarding groups', retention: RetentionOrders.UNTIL_PACK_DEL },
        { type: 'Pack category', purpose: 'User interaction regarding groups', retention: RetentionOrders.UNTIL_PACK_DEL },
        { type: 'Pack tags', purpose: 'User interaction regarding groups', retention: RetentionOrders.UNTIL_PACK_DEL },
        { type: 'Pack visibility', purpose: 'User interaction regarding groups', retention: RetentionOrders.UNTIL_PACK_DEL },
        {
            type: 'Pack creation date',
            purpose: 'User interaction regarding groups',
            retention: RetentionOrders.UNTIL_PACK_DEL,
        },
        {
            type: 'Pack custom pages',
            purpose: 'User interaction regarding groups',
            retention: RetentionOrders.UNTIL_PACK_OR_PAGE_DEL,
        },
        {
            type: 'Pack custom page HTML code',
            purpose: 'User interaction regarding groups',
            retention: RetentionOrders.UNTIL_PACK_OR_PAGE_DEL,
        },
        {
            type: 'Pack custom page CSS code',
            purpose: 'User interaction regarding groups',
            retention: RetentionOrders.UNTIL_PACK_OR_PAGE_DEL,
        },
        {
            type: 'Pack memberships',
            purpose: 'User interaction regarding groups',
            retention: RetentionOrders.UNTIL_PROFILE_DEL,
        },
        {
            type: 'Device information',
            purpose: 'Security monitoring and user experience optimization',
            retention: RetentionOrders.DAYS_90,
        },
        {
            type: 'Browser information',
            purpose: 'Security monitoring and user experience optimization',
            retention: RetentionOrders.DAYS_90,
        },
        { type: 'Error logs', purpose: 'Debugging and troubleshooting', retention: RetentionOrders.DAYS_30 },
        { type: 'Activity logs', purpose: 'Fraud prevention and security', retention: RetentionOrders.DAYS_90 },
        {
            type: 'User presence data',
            purpose: 'Online status and activity tracking',
            retention: RetentionOrders.UNTIL_SESSION_EXPIRATION,
        },
        {
            type: 'Notification content',
            purpose: 'User alerts and communication',
            retention: RetentionOrders.UNTIL_PROFILE_DEL,
        },
        {
            type: 'Notification settings',
            purpose: 'User experience customization',
            retention: RetentionOrders.UNTIL_PROFILE_DEL,
        },
        {
            type: 'Payment information',
            purpose: 'Transaction processing (handled securely by Stripe; card details are not stored on our servers)',
            retention: RetentionOrders.UNTIL_PROFILE_DEL_OR_LAW,
        },
        { type: 'Subscription details', purpose: 'Service management', retention: RetentionOrders.UNTIL_PROFILE_DEL },
        { type: 'Support tickets', purpose: 'Customer support', retention: RetentionOrders.UNTIL_RESOLVED_OR_WID_DEL },
        { type: 'Invite codes', purpose: 'User invitation', retention: RetentionOrders.UNTIL_USED_OR_EXPIRED },
        {
            type: 'Collectibles/Badges',
            purpose: 'User achievements and customization',
            retention: RetentionOrders.UNTIL_PROFILE_DEL,
        },
        { type: 'User themes', purpose: 'User interface customization', retention: RetentionOrders.UNTIL_PROFILE_DEL },
        { type: 'Search history', purpose: 'User experience customization', retention: RetentionOrders.NEVER_BROWSER_ONLY },
        {
            type: 'Analytics data',
            purpose: 'Service improvement and user experience optimization',
            retention: RetentionOrders.DAYS_90,
        },
    ],
    sections: [
        {
            id: 'usage-policy',
            title: 'Usage Policy',
            level: 1,
            content: [
                {
                    type: 'heading',
                    content: 'Agreement to Terms',
                    level: 2,
                },
                {
                    type: 'text',
                    content:
                        'By accessing or using Packbase, you agree to be bound by these Usage Policy. If you disagree with any part of these terms, you may not access Packbase.',
                },
                {
                    type: 'heading',
                    content: 'Changes to Terms',
                    level: 2,
                },
                {
                    type: 'text',
                    content:
                        'We reserve the right to modify these terms at any time. We will notify you of any changes by posting the new terms on Packbase. Your continued use of Packbase constitutes acceptance of the modified terms.',
                },
                {
                    type: 'heading',
                    content: 'User Responsibilities',
                    level: 2,
                },
                {
                    type: 'list',
                    listType: 'unordered',
                    items: [
                        'You must be at least 16 years old (or 18 years old starting the 10th of December 2025) to use Packbase',
                        'You are responsible for maintaining the confidentiality of your account',
                        'You agree not to use Packbase for any unlawful purposes',
                    ],
                },
                {
                    type: 'heading',
                    content: 'Termination',
                    level: 2,
                },
                {
                    type: 'text',
                    content: 'We may terminate or suspend your account at any time, without prior notice, for any reason.',
                },
                {
                    type: 'heading',
                    content: 'Account Types and Content Guidelines',
                    level: 2,
                },
                {
                    type: 'card',
                    style: 'default',
                    title: 'Standard Account Guidelines',
                    content: [
                        {
                            type: 'text',
                            content: 'Standard accounts must maintain PG-13 appropriate content. The following are prohibited:',
                        },
                        {
                            type: 'list',
                            listType: 'unordered',
                            items: [
                                'Adult or sexually explicit content outside of an Afterdark Account',
                                'Extreme violence or gore',
                                'Hate speech or discriminatory content',
                                'Harassment or bullying',
                                'Condoning, advocating, or displaying the use of illegal substances or activities',
                                'Personal information without consent',
                                'Spam or unauthorized advertising',
                                'Impersonation of others',
                                'Content promoting self-harm',
                                'Manipulation of platform metrics',
                                'Real-life sexually explicit content',
                                'Any suggestive content depicting underage characters or people, whether fictional or not.',
                                'Non-consensual content',
                                'Hate speech, harassment, or discriminatory content',
                                'Illegal activities',
                                'Exploitation or trafficking',
                            ],
                        },
                    ],
                },
                {
                    type: 'card',
                    style: 'default',
                    title: 'Content Moderation and Enforcement',
                    content: [
                        {
                            type: 'list',
                            listType: 'unordered',
                            items: [
                                'Content is monitored by automated systems and human moderators',
                                'Violations result in content removal and possible account suspension',
                                'Repeated violations lead to permanent account termination',
                                'Illegal content will be reported to authorities',
                                'Appeals can be submitted within 30 days',
                                'A generalised summary of reports and the action we have taken will be public under the content. No one will be identified.',
                            ],
                        },
                    ],
                },
                {
                    type: 'card',
                    style: 'info',
                    title: 'Content Visibility and Discovery',
                    content: [
                        {
                            type: 'list',
                            listType: 'unordered',
                            items: [
                                'Afterdark content is hidden from standard searches',
                                'Only other Afterdark accounts can view Afterdark content',
                                'Content warnings cannot be disabled',
                                'Cross-posting between account types is prohibited',
                                'Geographic restrictions may apply based on local laws',
                            ],
                        },
                    ],
                },
            ],
        },
        {
            id: 'privacy-policy',
            title: 'Privacy Policy',
            level: 2,
            content: [
                {
                    type: 'heading',
                    content: 'Compliance and Security',
                    level: 2,
                },
                // {
                //     type: 'heading',
                //     content: 'Wildbase Security Tier 2',
                //     level: 3,
                // },
                // {
                //     type: 'text',
                //     content: 'We maintain compliance with Wildbase Security Tier 2, which means:',
                // },
                // {
                //     type: 'list',
                //     listType: 'unordered',
                //     items: [
                //         'Annual audits of our security controls',
                //         'Continuous monitoring and logging of system activity',
                //         'Regular assessment of security, availability, and confidentiality controls',
                //         'Documented change management procedures',
                //         'Data encryption at rest and in transit',
                //         'Regular security updates and patch management',
                //         '24/7 security monitoring and incident response',
                //     ],
                // },
                // {
                //     type: 'text',
                //     content:
                //         'Wildbase Security (1 - 4) an in-house security standard that ensures the confidentiality, integrity, and availability of our systems and data from transit to rest.',
                // },
                {
                    type: 'heading',
                    content: 'Data Collection and Processing',
                    level: 2,
                },
                {
                    type: 'text',
                    content:
                        'We collect the following data to provide and improve Packbase. By using Packbase, you agree to the collection and use of information in accordance with this policy. 2 types of data pools exist; A WildID ("✱ID") and a Packbase Account ("Account", "Profile"). When you create a Packbase Account, you are also creating a ✱ID. Sensitive data is only stored in ✱ID.',
                },
                {
                    type: 'text',
                    content:
                        'No analytical data about you is collected from the site. We may occasionally run math algorithms towards the database (hereinafter "Experiments", "Science") to improve our services, but no sensitive or private information is used in these calculations, and as such, we cannot identify you from these calculations. Whenever we run these, the results are publicly available and can be viewed by anyone.',
                },
                {
                    type: 'table',
                    tableData: {
                        headers: ['Data Type', 'Purpose', 'Retention Period'],
                        rows: 'dataCollection',
                    },
                },
                {
                    type: 'heading',
                    content: 'GDPR Compliance',
                    level: 2,
                },
                {
                    type: 'text',
                    content:
                        'Under the General Data Protection Regulation (GDPR), you have the following rights regardless of your region:',
                },
                {
                    type: 'list',
                    listType: 'unordered',
                    items: [
                        'Right to access your personal data',
                        'Right to rectification of inaccurate data',
                        'Right to erasure ("right to be forgotten")',
                        'Right to restrict processing',
                        'Right to data portability',
                        'Right to object to processing',
                    ],
                },
                {
                    type: 'text',
                    content:
                        'To exercise these rights, go to your profile settings then "Security", or email support@packbase.app. We will respond to your request and comply with GDPR regardless of your region, data privacy to us is a basic human right.',
                },
                {
                    type: 'heading',
                    content: 'Internal Data Processing Tools',
                    level: 2,
                },
                {
                    type: 'text',
                    content:
                        'In addition to our standard data processing practices, we utilize proprietary internal tools to maintain service quality, security, and compliance:',
                },
                {
                    type: 'list',
                    listType: 'unordered',
                    items: [
                        'Rheobase ("Rheo", "Scalebite"): Internal proprietary collaboration tool and moderation platform.',
                        'Project Guardian: In-development proprietary tool to help us monitor and manage our compliance with regulations.',
                    ],
                },
                {
                    type: 'text',
                    content:
                        'Data shared through these internal tools is subject to the same privacy protections, security measures, and retention policies outlined in this document. Access to these tools is strictly limited to authorized personnel with appropriate high-level security clearances and multiple signed authorizations.',
                },
                {
                    type: 'heading',
                    content: 'No Data Selling Policy',
                    level: 2,
                },
                {
                    type: 'text',
                    content:
                        'Packbase maintains a strict no-data-selling policy. We do not sell, rent, lease, or otherwise transfer your personal data to third parties for monetary or other valuable consideration under any circumstances. Additionally, we do not have any contracts, partnerships, or relationships with data brokers or data aggregation services. Your data is collected solely for the purpose of providing and improving our services as outlined in this privacy policy.',
                },
                {
                    type: 'heading',
                    content: 'Geographical Restrictions',
                    level: 2,
                },
                {
                    type: 'text',
                    content:
                        'Due to legal, regulatory, and security concerns, Packbase services are not available in certain countries. Users from the following countries are prohibited from accessing or using our services:',
                },
                {
                    type: 'list',
                    listType: 'unordered',
                    items: BANNED_COUNTRIES,
                },
                {
                    type: 'text',
                    content:
                        'We reserve the right to modify this list at any time without notice. Attempts to access our services from banned regions through proxies, VPNs, or other circumvention methods violate our terms of service and may result in immediate account termination.',
                },
                {
                    type: 'text',
                    content:
                        "A usage of a VPN is allowed, as long as it's not for circumventing these terms. We are not liable of any damages caused by you utilising any kind of VPN.",
                },
                {
                    type: 'heading',
                    content: "Children's Privacy (COPPA Compliance)",
                    level: 2,
                },
                {
                    type: 'list',
                    listType: 'unordered',
                    items: [
                        'We do not knowingly collect personal information from those under 16 (or 18 years old starting the 10th of December 2025), and as such, comply with COPPA.',
                        'If we learn we have collected personal information from a person under 16 (or 18 years old starting the 10th of December 2025), we will delete that information in accordance with our breach policy.',
                    ],
                },
                {
                    type: 'heading',
                    content: 'Data Security and Protection',
                    level: 2,
                },
                {
                    type: 'text',
                    content: 'We implement appropriate technical and organizational measures to protect your data, including:',
                },
                {
                    type: 'list',
                    listType: 'unordered',
                    items: [
                        'Encryption of data in transit using TLS/SSL protocols',
                        'Encryption of sensitive data at rest using industry-standard encryption algorithms',
                        'Regular security assessments and penetration testing',
                        'Strict access controls and multi-factor authentication for system administrators',
                        'Regular security updates and patch management',
                        'Automated and manual monitoring for suspicious activities',
                        'Regular data backups with secure storage',
                        'Employee training on data security and privacy best practices',
                    ],
                },
                {
                    type: 'text',
                    content:
                        'We use PostgreSQL database with row-level security to ensure that data can only be accessed by authorized users. Our infrastructure is hosted in secure data centers with physical and environmental safeguards. We regularly review and update our security practices to adapt to emerging threats and technologies.',
                },
                {
                    type: 'heading',
                    content: 'Data Breach Notification',
                    level: 2,
                },
                {
                    type: 'text',
                    content: 'In the event of a data breach that compromises your personal information, we will:',
                },
                {
                    type: 'list',
                    listType: 'unordered',
                    items: [
                        'Notify affected users within 72 hours of becoming aware of the breach',
                        'Provide information about what data was affected',
                        'Explain potential consequences of the breach',
                        'Outline steps we are taking to address the breach',
                        'Offer guidance on how users can protect themselves',
                    ],
                },
                {
                    type: 'heading',
                    content: 'Data Processing and Third-Party Services',
                    level: 2,
                },
                {
                    type: 'text',
                    content:
                        'We use certain first-party and third-party services to help us operate and improve Packbase. These services comply with our data policy:',
                },
                {
                    type: 'list',
                    listType: 'unordered',
                    items: [
                        'Wildbase: Wildbase staff may internally see all but encrypted data for moderation, legal and/or regulatory requirements.',
                        'QA Wolf (a.k.a "QAW"): Used for Quality Assurance, and can only see publicly available data.',
                        'Resend: For some critical account information and an opt-in update mailing list.',
                        'Clerk: Used for authentication and user management. Clerk processes account credentials and authentication data.',
                        'Stripe via Clerk: If you make purchases, payment information is processed by Stripe. We do not store your credit card details on our servers; this information is securely managed by Stripe and accessed through Clerk. Payment information is only retained by Stripe to process your transactions and for legal compliance purposes. We do not have any access to your card details and related information.',
                    ],
                },
                {
                    type: 'text',
                    content:
                        'All third-party services we use are compliant with applicable data protection regulations and have appropriate security measures in place. We have data processing agreements with these providers to ensure your data is handled properly.',
                },
                {
                    type: 'text',
                    content: 'We do not share your personal data with other third parties except:',
                },
                {
                    type: 'list',
                    listType: 'unordered',
                    items: [
                        'When required by law or valid legal process',
                        'With your explicit consent',
                        'To protect our legal rights or the safety of users',
                    ],
                },
                {
                    type: 'text',
                    content:
                        "If Packbase is sold to a merger, you'll be asked whether or not you want your data to be owned by the specified merger. If we get no response from you, or you disagree, your data will be permanently erased before the merge begins.",
                },
                {
                    type: 'heading',
                    content: 'Contact Information',
                    level: 2,
                },
                {
                    type: 'text',
                    content:
                        'For any questions about these terms or our privacy practices, email support@packbase.app OR contact us on our official Discord support channel.',
                },
            ],
        },
        {
            id: 'governing-law',
            title: 'Governing Law',
            level: 3,
            content: [
                {
                    type: 'text',
                    content:
                        'These terms shall be governed by and construed in accordance with the laws of Victoria, Australia, without regard to its conflict of law provisions.',
                },
            ],
        },
    ],
}
