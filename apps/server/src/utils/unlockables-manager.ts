import { ClerkClient } from '@clerk/backend';

interface UnlockablesConfig {
    baseUnlockables: string[];
    tieredUnlockables: {
        [key: number]: string;
    };
    firstUnlockable?: string;
}

export class UnlockablesManager {
    private readonly clerk: ClerkClient;
    private readonly config: UnlockablesConfig;

    constructor(
        clerk: any,
        config: UnlockablesConfig = {
            baseUnlockables: [
                'cat_invite_2',
                'cat_invite_3',
                'cat_invite_4',
                'cat_invite_5',
                'cat_invite_6',
                'cat_invite_7',
                'cat_invite_8',
                'cat_invite_9',
                'cat_invite_10',
                'cat_invite_11',
                'cat_invite_12',
            ],
            tieredUnlockables: {
                10: 'cat_invite_13',
                15: 'cat_invite_14',
                20: 'cat_invite_15',
            },
            firstUnlockable: 'cat_invite_1',
        },
    ) {
        this.clerk = clerk;
        this.config = config;
    }

    private async getUserProfile(ownerId: string) {
        try {
            return await this.clerk.users.getUser(ownerId);
        } catch (error) {
            throw new Error(`Failed to get user profile: ${error.message}`);
        }
    }

    private async updateUserMetadata(ownerId: string, metadata: UserPrivateMetadata) {
        try {
            return await this.clerk.users.updateUserMetadata(ownerId, {
                privateMetadata: metadata,
            });
        } catch (error) {
            throw new Error(`Failed to update user metadata: ${error.message}`);
        }
    }

    private getAvailableUnlockables(currentUnlockables: string[]): string[] {
        return this.config.baseUnlockables.filter((unlockable) => !currentUnlockables.includes(unlockable));
    }

    private async addUnlockable(userId: string, unlockable: string, currentUnlockables: string[] = []): Promise<boolean> {
        if (currentUnlockables.includes(unlockable)) {
            return false;
        }

        prisma.collectibles.create({
            data: {
                user_id: userId,
                badge_id: unlockable,
            },
        });
        return true;
    }

    private getRandomUnlockable(availableUnlockables: string[]): string {
        const randomIndex = Math.floor(Math.random() * availableUnlockables.length);
        return availableUnlockables[randomIndex];
    }

    /**
     * Process unlockables for a user
     * @param ownerId - Clerk ID of the user
     * @param userId - Packbase ID of the user
     * @param specificUnlockable - Optional specific unlockable to add
     * @param increment
     * @returns Promise<boolean> - Whether any unlockables were added
     */
    async processUnlockables(ownerId: string, userId: string, specificUnlockable?: string | null, increment?: boolean): Promise<boolean> {
        try {
            const userProfile = await this.getUserProfile(ownerId);
            const userBadges = await prisma.collectibles.findMany({
                where: {
                    user_id: userId,
                },
            });
            const currentUnlockables = userBadges?.map((badge) => badge.badge_id) || [];
            const invited = increment ? userProfile.privateMetadata?.invited + 1 : userProfile.privateMetadata?.invited || 0;

            // Update invited count
            await this.updateUserMetadata(ownerId, { invited });

            let unlockableAdded = false;

            // Handle first invite achievement if configured
            if (this.config.firstUnlockable) {
                unlockableAdded = await this.addUnlockable(userId, this.config.firstUnlockable, currentUnlockables);
                if (unlockableAdded) {
                    currentUnlockables.push(this.config.firstUnlockable);
                }
            }

            // Handle specific unlockable if provided
            if (specificUnlockable) {
                return await this.addUnlockable(userId, specificUnlockable, currentUnlockables);
            }

            // Handle tiered unlockables
            if (this.config.tieredUnlockables[invited]) {
                unlockableAdded = (await this.addUnlockable(userId, this.config.tieredUnlockables[invited], currentUnlockables)) || unlockableAdded;

                currentUnlockables.push(this.config.tieredUnlockables[invited]);
            }

            // Handle random unlockables for regular invites
            if (invited > 1 && currentUnlockables.length < invited) {
                const availableUnlockables = this.getAvailableUnlockables(currentUnlockables);

                if (availableUnlockables.length > 0) {
                    const randomUnlockable = this.getRandomUnlockable(availableUnlockables);
                    unlockableAdded = (await this.addUnlockable(userId, randomUnlockable, currentUnlockables)) || unlockableAdded;
                }
            }

            return unlockableAdded;
        } catch (error) {
            console.error('Error processing unlockables:', error);
            throw error;
        }
    }
}
