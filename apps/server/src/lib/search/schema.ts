import {Prisma} from '@prisma/client';

/**
 * Narrowed representation of the scalar types supported by the search layer.
 * Maps Prisma model scalar fields to lightweight column metadata consumed by the parser/executor.
 */
export type ColumnType =
    'string'
    | 'number'
    | 'boolean'
    | 'date'
    | 'json'
    | 'bigint'
    | 'string_array'
    | 'number_array'
    | 'json_array';

/** Metadata for a single column on a table. */
export type TableColumn = {
    name: string;
    type: ColumnType;
    isOptional: boolean;
};

/** Schema description for an entire table keyed by column name. */
export type TableSchema = {
    name: string;
    columns: Record<string, TableColumn>;
};

/** Prisma relation metadata used to resolve forward/backward joins. */
export type RelationMeta = {
    from: string;
    to: string;
    fieldName: string;
    fromFields: string[];
    toFields: string[];
    isList: boolean;
};

/**
 * Convert a Prisma scalar field definition into a ColumnType understood by the search engine.
 * Returns undefined for unsupported scalar kinds (e.g., enums) so they are skipped.
 */
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

/**
 * Walk the Prisma DMMF models and build a simplified schema map of tables -> columns.
 * Only scalar fields are included; relational/object fields are excluded.
 */
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

/** Cached table schemas keyed by model name, derived once at module load. */
export const Schemas: Record<string, TableSchema> = buildSchemas();

/**
 * Build relation metadata from Prisma models to support relation-based WHERE clauses.
 */
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

/** Cached relation metadata for all models. */
export const Relations: RelationMeta[] = buildRelations();

/** Quick existence check for tables supported by the search layer. */
export const isValidTable = (name: string): boolean => !!Schemas[name];

/** Retrieve column metadata if present on the given table. */
export const getColumn = (table: string, column: string): TableColumn | undefined => {
    return Schemas[table]?.columns[column];
};

/**
 * Retrieve the ID column metadata for a table, if Prisma marks one as the primary key.
 * Used when projecting entire rows or relation keys without explicit column selection.
 */
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
