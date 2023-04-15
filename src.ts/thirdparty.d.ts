declare module "solc" {
    export function compile(input: string, options?: Record<string, any>): any;
    export function version(): string;
}
