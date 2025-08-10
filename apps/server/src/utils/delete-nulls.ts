// Fully removes all null values from an object or array recursively.
// If an object's keys are all removed, the object is removed.
type DeepNonNullable<T> = T extends null
    ? never
    : T extends object
        ? { [P in keyof T as T[P] extends never ? never : P]: DeepNonNullable<T[P]> }
        : T;

export default function deleteNulls<T>(input: T): DeepNonNullable<T> {
    // Handle null values directly
    if (input === null) {
        return undefined as any
    }

    // Handle arrays
    if (Array.isArray(input)) {
        const filteredArray = input
            .map(item => deleteNulls(item))
            .filter(item => item !== undefined)
        return (filteredArray.length > 0 ? filteredArray : []) as any
    }

    // Handle objects
    if (typeof input === 'object') {
        const result: any = {}
        let hasValidProperties = false

        for (const [key, value] of Object.entries(input)) {
            const cleanedValue = deleteNulls(value)
            if (cleanedValue !== undefined) {
                result[key] = cleanedValue
                hasValidProperties = true
            }
        }

        return hasValidProperties ? result : undefined
    }

    // Return non-object values as is
    return input as any
}