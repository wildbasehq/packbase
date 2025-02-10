interface CardColourSchemeChild {
    header: string[];
    body: string[];
    wellBody: {
        // header: string[];
        body: string[];
    }
}
interface ColourScheme {
    all?: string[];
    main: string[];
    card?: CardColourSchemeChild;
    button?: string[];
}

// Function that replaces all instances of "ColourScheme" from the string provided with the desired colour scheme
export const replaceColourScheme = (string: string, colourScheme: string) => {
    return string.replace(/ColourScheme/g, colourScheme);
}

/* Function that builds class objects based on the provided colour scheme.
 * Component and triggerKey are optional, and are used if you need to merge
 * the component classes with another if a condition is met.
 *
 * Example: 'component' is 'card' and 'triggerKey' is 'wellBody', then the
 * function will return the classes, however the card object will be merged
 * with the wellBody object, found *inside* the card object.
 */
export const buildClassObject = (classObject: ColourScheme, colourScheme: string = 'neutral', component?: string, triggerKey?: string, callUntoItself?: boolean) => {
    const newClassObject = { ...classObject };
    const newClassObjectKeys = Object.keys(newClassObject);
    newClassObjectKeys.forEach((key) => {
        // @ts-ignore
        if (Array.isArray(newClassObject[key])) {
            // @ts-ignore
            newClassObject[key] = replaceColourScheme(newClassObject[key].join(' '), colourScheme);
        } else { // @ts-ignore
            if (typeof newClassObject[key] === 'object') {
                // @ts-ignore
                newClassObject[key] = buildClassObject(newClassObject[key], colourScheme, component, key, true);
            }
        }
    });

    // Merge the "component" and "triggerKey" objects together if both are provided
    if (component && triggerKey && !callUntoItself) {
        // @ts-ignore
        Object.keys(newClassObject[component]).forEach((key) => {
            if (key === triggerKey) return;

            // @ts-ignore
            newClassObject[component][key] = `${newClassObject[component][key]} ${newClassObject[component][triggerKey][key]}`;
        });
    }
    return newClassObject;
}
