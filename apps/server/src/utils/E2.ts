import * as crypto from 'node:crypto'

type E2IDType = {
    ID: string;
    variants: { [key: string]: string };
};

const E2IDTypes: { [key: string]: E2IDType } = {
    Core: {
        ID: '00',
        variants: {
            PARENT: 'A1',
            IMPORT_JOB: 'I1',
        },
    },
    User: {
        ID: '01',
        variants: {
            PARENT: 'A1',
            ALTERNATIVE_IDENTITY: 'A2',
            AUTOMATED: 'A3',
        },
    },
    Group: {
        ID: '02',
        variants: {
            PARENT: 'A1',
            MEMBERSHIP: 'A2',
        },
    },
    Post: {
        ID: '03',
        variants: {
            PARENT: 'A1',
            INTERACTION_LIKE: 'I1',
            INTERACTION_HOWLING_ECHO: 'I2',
            INTERACTION_HOWLING_POST: 'I3',
            INTERACTION_HOWLING_ALONGSIDE: 'I4',
            CONTENT_IMAGE: 'C1',
            CONTENT_VIDEO: 'C2',
            CONTENT_AUDIO: 'C3',
            CONTENT_RICH: 'C4'
        },
    },
    Feed: {
        ID: '04',
        variants: {
            PARENT: 'A1',
        },
    },
};

function E2IDTypeIDToName(typeID: string): string | null {
    for (const typeName in E2IDTypes) {
        if (E2IDTypes[typeName].ID === typeID) {
            return typeName;
        }
    }

    throw new Error(`E2ID Type ID ${typeID} does not match any record`)
}

function E2IDCreate(type: string, variant: string = 'PARENT', suffix: string = ''): string {
    if (!E2IDTypes[type]) {
        throw new Error(`Invalid E2ID Type: ${type}`);
    }

    const type_id = E2IDTypes[type].ID;
    const variant_id = E2IDTypes[type].variants[variant];
    const random_id = E2IDRandomID();
    let base_id = type_id + variant_id + random_id;

    // If suffix starts with ':' then it's a child ID, if it ends with ':' then it's a parent ID
    if (suffix.startsWith(':')) {
        base_id += suffix;
    } else if (suffix.endsWith(':')) {
        base_id = suffix + base_id;
    }

    return base_id;
}

/**
 * @returns string matching regex ^([A-Za-z1-9]{12,48})$
 */
function E2IDRandomID(): string {
    const random_id_length = Math.floor(Math.random() * (48 - 12 + 1)) + 12;
    return Buffer.from(crypto.randomBytes(random_id_length)).toString('hex');
}