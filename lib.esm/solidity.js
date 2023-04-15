import fs from "fs";
import { join } from "path";
import { Interface } from "ethers";
import solc from "solc";
export class CompiledContract {
    filename;
    name;
    abi;
    bytecode;
    constructor(filename, name, abi, bytecode) {
        this.filename = filename;
        this.name = name;
        this.abi = abi;
        this.bytecode = bytecode;
    }
    static async fromCode(filename, code) {
        throw new Error("");
    }
}
export class CompiledError {
    filename;
    message;
    formatted;
    constructor(filename, message, formatted) {
        this.filename = filename;
        this.message = message;
        this.formatted = formatted;
    }
}
export class Compiled {
    contracts;
    errors;
    warnings;
    constructor() {
        this.contracts = [];
        this.errors = [];
        this.warnings = [];
    }
}
export async function cacheSolc(version) {
    return false;
}
export async function getSemver(code) {
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
        if (depth === 0) {
            content += c;
        }
    }
    const pragmas = [];
    content.replace(/pragma\w+solidity([0-9.^]*)\w*;/, (all, version) => {
        pragmas.push(version);
        return "";
    });
    if (pragmas.length === 1) {
        return pragmas[0];
    }
    if (pragmas.length === 0) {
        return null;
    }
    throw new Error("");
}
export async function compile(root, filename) {
    const sources = {};
    sources[filename] = { content: fs.readFileSync(join(root, filename)).toString() };
    const input = {
        language: "Solidity",
        sources,
        settings: {
            outputSelection: {
                "*": {
                    "*": ["*"]
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
    for (const error of (output.errors || [])) {
        if (error.severity === "warning") {
            compiled.warnings.push(new CompiledError(error.sourceLocation.file, error.message, error.formattedMessage));
        }
        else if (error.severity === "error") {
            compiled.errors.push(new CompiledError(error.sourceLocation.file, error.message, error.formattedMessage));
        }
        else {
            console.log(error);
            throw new Error("Hmm...");
        }
    }
    return compiled;
}
//# sourceMappingURL=solidity.js.map