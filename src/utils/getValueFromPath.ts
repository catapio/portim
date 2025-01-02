export function isValidPath(path: string): boolean {
    const pathRegex = /^\$(\.[a-zA-Z_][a-zA-Z0-9_]*)*(\.\d+)*(\.[a-zA-Z_][a-zA-Z0-9_]*)*$/;
    return pathRegex.test(path);
}

export function getValueFromPath(obj: any, path: string): string {
    if (!isValidPath(path)) throw new Error("invalid path")

    const keys = path
        .replace(/^\$\./, "")
        .split(/\./)
        .filter((key) => key !== "")

    return String(
        keys.reduce((acc, key) => {
            if (acc === undefined || acc === null) return undefined
            return acc[key]
        }, obj)
    )
}
