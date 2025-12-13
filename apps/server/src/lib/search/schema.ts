import {Prisma} from '@prisma/client';

export type ColumnType =
    'string'
    | 'number'
    | 'boolean'
    | 'date'
    | 'json'
    | 'uuid'
    | 'bigint'
    | 'string_array'
    | 'number_array'
    | 'json_array';

export type TableColumn = {
    name: string;
    type: ColumnType;
    isOptional: boolean;
};

export type TableSchema = {
    name: string;
    columns: Record<string, TableColumn>;
};

export type RelationMeta = {
    from: string;
    to: string;
    fieldName: string;
    fromFields: string[];
    toFields: string[];
    isList: boolean;
};

const scalarToColumnType = (field: Prisma.DMMF.Field): ColumnType | undefined => {
    const base = field.type as string;
    const isList = field.isList;
    switch (base) {
        case 'String':
            return isList ? 'string_array' : 'string';
        case 'Int':
        case 'Float':
        case 'Decimal':
            return isList ? 'number_array' : 'number';
        case 'BigInt':
            return 'bigint';
        case 'Uuid':
            return 'uuid';
        case 'Boolean':
            return 'boolean';
        case 'DateTime':
            return 'date';
        case 'Json':
            return isList ? 'json_array' : 'json';
        default:
            return undefined;
    }
};

const buildSchemas = (): Record<string, TableSchema> => {
    const models = Prisma.dmmf.datamodel.models;
    const schemas: Record<string, TableSchema> = {};
    for (const model of models) {
        const columns: Record<string, TableColumn> = {};
        for (const field of model.fields) {
            if (field.kind !== 'scalar') continue;
            const type = scalarToColumnType(field);
            if (!type) continue;
            columns[field.name] = {
                name: field.name,
                type,
                isOptional: field.isRequired === false,
            };
        }
        schemas[model.name] = {
            name: model.name,
            columns,
        };
    }
    return schemas;
};

export const Schemas: Record<string, TableSchema> = buildSchemas();

const buildRelations = (): RelationMeta[] => {
    const models = Prisma.dmmf.datamodel.models;
    const relations: RelationMeta[] = [];
    for (const model of models) {
        for (const field of model.fields) {
            if (field.kind !== 'object') continue;
            if (!field.relationFromFields?.length || !field.relationToFields?.length) continue;
            relations.push({
                from: model.name,
                to: field.type as string,
                fieldName: field.name,
                fromFields: field.relationFromFields as string[],
                toFields: field.relationToFields as string[],
                isList: field.isList,
            });
        }
    }
    return relations;
};

export const Relations: RelationMeta[] = buildRelations();

export const isValidTable = (name: string): boolean => !!Schemas[name];

export const getColumn = (table: string, column: string): TableColumn | undefined => {
    return Schemas[table]?.columns[column];
};

export const getDefaultIdColumn = (table: string): TableColumn | undefined => {
    const model = Prisma.dmmf.datamodel.models.find((m) => m.name === table);
    const idField = model?.fields.find((f) => f.isId && f.kind === 'scalar');
    if (!idField) return undefined;
    const type = scalarToColumnType(idField);
    if (!type) return undefined;
    return {
        name: idField.name,
        type,
        isOptional: false,
    };
};
