export default async function migrateReactSlotnumToString() {
    const reactions = await prisma.posts_reactions.findMany();
    for (const reaction of reactions) {
        if (reaction.slot === '0') {
            await prisma.posts_reactions.update({
                where: { post_id_actor_id_slot: { post_id: reaction.post_id, actor_id: reaction.actor_id, slot: '0' } },
                data: { slot: '👍' },
            });
        }
    }
}
