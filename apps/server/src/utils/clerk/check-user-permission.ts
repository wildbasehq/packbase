/**
 * Gets a user's { feature: string } permission status.
 */
import clerkClient from "@/db/auth";

export async function checkUserBillingPermission(userId: string, feature: string): Promise<boolean> {
    // Check via Clerk
    const user = await clerkClient.billing.getUserBillingSubscription(userId);
    return user.subscriptionItems.some(item => {
        if (item.status !== 'active') return false

        return item.plan?.features.some(f => {
            return f.slug === feature
        });
    });
}