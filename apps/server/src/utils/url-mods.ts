export const NSIDRegExp = /^[a-zA-Z]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(\.[a-zA-Z]([a-zA-Z]{0,61}[a-zA-Z])?)$/;

export function GetXRPCFunction(url: string) {
    // i.e: /xrpc/com.test(/) -> com.test, ignoring any trailing slash. Anything after the function name is returned as 'param' in the context.
    const [lexicon, param] = url.replace('/xrpc', '').split('/');

    if (!lexicon) return {
        lexicon: null,
        param: null,
    }

    return {
        lexicon,
        param,
    }
}