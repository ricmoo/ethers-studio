
export function repeat(chr: string, length: number): string {
    if (chr.length === 0) { throw new Error("invalid string"); }
    while (chr.length < length) { chr += chr; }
    return chr.substring(0, length);
}

export function stripBlockComments(code: string): string {
    return "  " + code.replace(/(\/\*.*?\*\/)/gm, (all, comment: string) => {
        return comment.split("\n").map((line) => {
            return repeat(" ", line.length);
        }).join("\n");
    }) + "  ";
}

export function stripStrings(code: string): string {
    return "";
}

export function stripInlineComments(code: string): string {
    return code.split("\n").map((line) => {
        let slash = line.indexOf("//");
        if (slash === -1) { return line; }
        return line.substring(0, slash) + repeat(" ", line.length - slash);
    }).join("\n");
}
