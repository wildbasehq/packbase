import { HTTPError } from '@/lib/HTTPError';

export default function requiresToken({ set, user }: { set: any; user: { sub: string } }) {
    if (!user) {
        set.status = 401;
        throw HTTPError.unauthorized({ summary: 'Unauthorized' });
    }
    return true;
}
