/**
 * Takes in a form submit target and converts it into JSON. Switches `on|off` to `true|false`, etc.
 */
export default function FormToJSON<T extends Record<string, string | number | boolean>>(
    formTarget: EventTarget,
    defaults?: Partial<T>
): T {
    if (!(formTarget instanceof HTMLFormElement)) return (defaults || {}) as T

    const formData = new FormData(formTarget)
    const json: Record<string, any> = {...defaults}

    for (const [key, value] of formData.entries()) {
        const strValue = typeof value === 'string' ? value : (value as boolean).toString()

        if (strValue === 'on' || strValue === 'true') json[key] = true
        else if (strValue === 'off' || strValue === 'false') json[key] = false
        else if (!isNaN(Number(strValue.replace(/,/g, '')))) {
            json[key] = Number(strValue.replace(/,/g, ''))
        } else {
            json[key] = strValue
        }
    }

    return json as T
}