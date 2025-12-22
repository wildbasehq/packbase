/**
 * Gets a user's { feature: string } permission status.
 */
import clerkClient from "@/db/auth";

export async function checkUserBillingPermission(userId: string, feature?: string): Promise<boolean> {
    // Check via Clerk
    const user = await clerkClient.billing.getUserBillingSubscription(userId);
    if (feature) {
        return user.subscriptionItems.some(subscription => {
            if (subscription.status !== 'active') return false

            return subscription.plan?.features.some(f => {
                // Maybe check if feature is active?
                // We don't plan on billing anything per unit or any addons.
                return f.slug === feature
            });
        });
    } else {
        return user.status === 'active' && !!user.subscriptionItems?.[0]?.plan?.hasBaseFee
    }
}