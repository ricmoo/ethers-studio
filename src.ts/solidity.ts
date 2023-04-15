import fs from "fs";
import { join } from "path";

import { Interface } from "ethers";

import solc from "solc";

export class CompiledContract {
    readonly filename: string;
    readonly name: string;

    readonly abi: Interface;
    readonly bytecode: string;

    constructor(filename: string, name: string, abi: Interface, bytecode: string) {
        this.filename = filename;
        this.name = name;

        this.abi = abi;
        this.bytecode = bytecode;
    }

    static async fromCode(filename: string, code: string): Promise<CompiledContract> {
        throw new Error("");
    }
}

export class CompiledError {
    readonly filename: string;
    readonly message: string;
    readonly formatted: string;

    constructor(filename: string, message: string, formatted: string) {
        this.filename = filename;
        this.message = message;
        this.formatted = formatted;
    }
}

export class Compiled {
    readonly contracts: Array<CompiledContract>;
    readonly errors: Array<CompiledError>;
    readonly warnings: Array<CompiledError>;

    constructor() {
        this.contracts = [ ];
        this.errors = [ ];
        this.warnings = [ ];
    }
}

export async function cacheSolc(version: string): Promise<boolean> {
    return false;
}

export async function getSemver(code: string): Promise<null | string> {
    let content = "";

    // @TODO: strip comments and strings

    let depth = 0;
    for (let i = 0; i < code.length; i++) {
        const c = code[i];
        switch (c) {
            case "{":
                depth++;
                break;
            case "}":
                depth--;
                break;
        }
        if (depth === 0) { content += c; }
    }

    const pragmas: Array<string> = [ ];

    content.replace(/pragma\w+solidity([0-9.^]*)\w*;/, (all, version) => {
        pragmas.push(version);
        return "";
    });

    if (pragmas.length === 1) { return pragmas[0]; }
    if (pragmas.length === 0) { return null; }

    throw new Error("");
}

export async function compile(root: string, filename: string): Promise<Compiled> {
    const sources: Record<string, { content: string }> = { };
    sources[filename] = { content: fs.readFileSync(join(root, filename)).toString() };
    const input = {
        language: "Solidity",
        sources,
        settings: {
            outputSelection: {
                "*": {
                    "*": [ "*" ]
                }
            }
        }
    };

    const compiled = new Compiled();

    //const version = solc.version();
    //console.log(version);

    const output = JSON.parse(solc.compile(JSON.stringify(input)));
    for (const filename in (output.contracts || [])) {
        for (const name in output.contracts[filename]) {
            const code = output.contracts[filename][name];
            const abi = new Interface(code.abi);
            compiled.contracts.push(new CompiledContract(filename, name, abi, "0x" + code.evm.bytecode.object));
        }
    }

    for (const error of (output.errors || [ ])) {
        if (error.severity === "warning") {
            compiled.warnings.push(new CompiledError(error.sourceLocation.file, error.message, error.formattedMessage));
        } else if (error.severity === "error") {
            compiled.errors.push(new CompiledError(error.sourceLocation.file, error.message, error.formattedMessage));
        } else {
            console.log(error);
            throw new Error("Hmm...");
        }
    }

    return compiled;
}

