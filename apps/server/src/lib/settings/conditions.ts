import type {AccessCondition, Condition, ConditionOperator, LogicalCondition} from './types'

export class ConditionEvaluator {
    /**
     * Evaluates whether a condition is met for a given model object
     */
    static evaluate<T extends Record<string, any>>(
        condition: AccessCondition,
        modelObject: T
    ): boolean {
        if (this.isLogicalCondition(condition)) {
            return this.evaluateLogicalCondition(condition, modelObject)
        }
        return this.evaluateSimpleCondition(condition, modelObject)
    }

    /**
     * Validates condition structure
     */
    static validateCondition(condition: AccessCondition): boolean {
        try {
            if (this.isLogicalCondition(condition)) {
                const {and, or} = condition

                if (and && or) {
                    throw new Error('Condition cannot have both "and" and "or"')
                }

                if (!and && !or) {
                    throw new Error('Logical condition must have either "and" or "or"')
                }

                const conditions = and || or || []
                return conditions.every(subCondition =>
                    this.validateSimpleCondition(subCondition)
                )
            }

            return this.validateSimpleCondition(condition)
        } catch {
            return false
        }
    }

    /**
     * Type guard to check if condition is a logical condition
     */
    private static isLogicalCondition(
        condition: AccessCondition
    ): condition is LogicalCondition {
        return 'and' in condition || 'or' in condition
    }

    /**
     * Evaluates logical conditions (and/or)
     */
    private static evaluateLogicalCondition<T extends Record<string, any>>(
        condition: LogicalCondition,
        modelObject: T
    ): boolean {
        if (condition.and) {
            return condition.and.every(subCondition =>
                this.evaluateSimpleCondition(subCondition, modelObject)
            )
        }

        if (condition.or) {
            return condition.or.some(subCondition =>
                this.evaluateSimpleCondition(subCondition, modelObject)
            )
        }

        return false
    }

    /**
     * Evaluates simple conditions
     */
    private static evaluateSimpleCondition<T extends Record<string, any>>(
        condition: Condition,
        modelObject: T
    ): boolean {
        const {field, operator, value} = condition
        const fieldValue = this.getNestedFieldValue(modelObject, field)

        switch (operator) {
            case 'equals':
                return fieldValue === value

            case 'notEquals':
                return fieldValue !== value

            case 'in':
                return Array.isArray(value) && value.includes(fieldValue)

            case 'notIn':
                return Array.isArray(value) && !value.includes(fieldValue)

            case 'greaterThan':
                return typeof fieldValue === 'number' &&
                    typeof value === 'number' &&
                    fieldValue > value

            case 'lessThan':
                return typeof fieldValue === 'number' &&
                    typeof value === 'number' &&
                    fieldValue < value

            case 'exists':
                return fieldValue !== undefined && fieldValue !== null

            case 'notExists':
                return fieldValue === undefined || fieldValue === null

            default:
                throw new Error(`Unsupported operator: ${operator}`)
        }
    }

    /**
     * Gets nested field value using dot notation
     * e.g., "user.profile.email" -> modelObject.user.profile.email
     */
    private static getNestedFieldValue<T extends Record<string, any>>(
        obj: T,
        path: string
    ): any {
        return path.split('.').reduce((current, key) => {
            return current && typeof current === 'object' ? current[key] : undefined
        }, obj)
    }

    /**
     * Validates simple condition structure
     */
    private static validateSimpleCondition(condition: Condition): boolean {
        const {field, operator, value} = condition

        if (!field || typeof field !== 'string') {
            return false
        }

        const validOperators: ConditionOperator[] = [
            'equals', 'notEquals', 'in', 'notIn',
            'greaterThan', 'lessThan', 'exists', 'notExists'
        ]

        if (!validOperators.includes(operator)) {
            return false
        }

        // For 'exists' and 'notExists', value is not required
        if (operator === 'exists' || operator === 'notExists') {
            return true
        }

        // For 'in' and 'notIn', value must be an array
        if ((operator === 'in' || operator === 'notIn') && !Array.isArray(value)) {
            return false
        }

        // For numeric operators, value should be a number
        if ((operator === 'greaterThan' || operator === 'lessThan') &&
            typeof value !== 'number') {
            return false
        }

        return value !== undefined
    }
}