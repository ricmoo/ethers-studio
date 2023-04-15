import { Interface } from "ethers";
export declare class CompiledContract {
    readonly filename: string;
    readonly name: string;
    readonly abi: Interface;
    readonly bytecode: string;
    constructor(filename: string, name: string, abi: Interface, bytecode: string);
    static fromCode(filename: string, code: string): Promise<CompiledContract>;
}
export declare class CompiledError {
    readonly filename: string;
    readonly message: string;
    readonly formatted: string;
    constructor(filename: string, message: string, formatted: string);
}
export declare class Compiled {
    readonly contracts: Array<CompiledContract>;
    readonly errors: Array<CompiledError>;
    readonly warnings: Array<CompiledError>;
    constructor();
}
export declare function cacheSolc(version: string): Promise<boolean>;
export declare function getSemver(code: string): Promise<null | string>;
export declare function compile(root: string, filename: string): Promise<Compiled>;
//# sourceMappingURL=solidity.d.ts.map