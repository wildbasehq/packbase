import prisma from '@/db/prisma';
import { SafetyTrainingData } from '@/lib/rheo/dataset/safety-classification';

async function main() {
    const [, , userId, limitArg] = process.argv;

    if (!userId) {
        console.error('Usage: bun run src/scripts/populate-posts.ts <USER_ID> [LIMIT]');
        process.exit(1);
    }

    const limit = limitArg ? Number.parseInt(limitArg, 10) : SafetyTrainingData.length;
    if (Number.isNaN(limit) || limit <= 0) {
        console.error('LIMIT must be a positive integer if provided');
        process.exit(1);
    }

    const texts = SafetyTrainingData.slice(0, Math.min(limit, SafetyTrainingData.length));

    if (texts.length === 0) {
        console.error('No training data available to insert');
        process.exit(1);
    }

    console.log(`Creating ${texts.length} posts for user ${userId} ...`);

    try {
        const data = texts.map((item) => ({
            content_type: 'markdown',
            body: item.text,
            user_id: userId,
        }));

        const result = await prisma.posts.createMany({ data });
        console.log(`Inserted ${result.count} posts.`);
    } catch (error) {
        console.error('Failed to populate posts:', error);
        process.exitCode = 1;
    } finally {
        await prisma.$disconnect();
    }
}

main();
