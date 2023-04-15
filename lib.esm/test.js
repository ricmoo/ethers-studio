import fs from "fs";
import { join, parse, resolve } from "path";
import { spawn } from "child_process";
import { compile } from "./solidity.js";
function getRecusriveType(type, callback) {
    if (type.isArray()) {
        const str = callback(type.arrayChildren);
        if (type.arrayLength >= 0) {
            const types = [];
            for (let i = 0; i < type.arrayLength; i++) {
                types.push(str);
            }
            return `[ ${types.join(", ")} ]`;
        }
        return `Array<${str}>`;
    }
    //if (type.isTuple()) {
    //}
    throw new Error(`unsupported type: ${type.type}`);
}
function getType(type) {
    if (type.baseType.match(/^bytes([0-9]*)$/)) {
        return "string";
    }
    if (type.baseType.match(/^u?int([0-9]*)$/)) {
        return "bigint";
    }
    switch (type.baseType) {
        case "address": return "string";
        case "bool": return "boolean";
        case "string": return "string";
        case "array":
    }
    return getRecusriveType(type, getType);
}
function getLooseType(type) {
    if (type.type.match(/^bytes([0-9]*)$/)) {
        return "ethers.BytesLike";
    }
    if (type.type.match(/^u?int([0-9]*)$/)) {
        return "ethers.BigNumberish";
    }
    switch (type.baseType) {
        case "address": return "ethers.AddressLike";
        case "bool": return "boolean";
        case "string": return "string";
    }
    return getRecusriveType(type, getLooseType);
}
function generateTypeScript(contract) {
    let output = [];
    output.push(`/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/`);
    output.push(`/\/ Contract: ${contract.name}`);
    output.push(`/\/ File:     ${contract.filename}`);
    output.push("");
    output.push(`interface ${contract.name}Interface {`);
    contract.abi.forEachFunction((fragment, index) => {
        let outputs;
        if (fragment.outputs.length === 1) {
            outputs = getType(fragment.outputs[0]);
        }
        else {
            outputs = `[ ${fragment.outputs.map(getType).join(", ")} ]`;
        }
        let defaultOutput = outputs;
        if (!fragment.constant) {
            defaultOutput = "ethers.ContractTransactionResponse";
        }
        output.push(`  ${fragment.name}: ethers.BaseContractMethod< [ ${fragment.inputs.map(getLooseType).join(", ")} ], ${outputs}, ${defaultOutput} >,`);
    });
    output.push(`}`);
    output.push("");
    output.push(`const ${contract.name}Abi: Array<string> = [`);
    contract.abi.forEachFunction((fragment, index) => {
        output.push(`    ${JSON.stringify(fragment.format("full"))},`);
    });
    output.push(`];`);
    output.push("");
    output.push(`export const ${contract.name} = ethers.BaseContract.buildClass<${contract.name}Interface>(${contract.name}Abi)`);
    return output.join("\n");
}
function zpad(_v, length) {
    let v = String(_v);
    while (v.length < length) {
        v = "0" + v;
    }
    return v;
}
function getTime() {
    const now = new Date();
    let hours = now.getHours(), meridian = "a.m.";
    if (hours >= 12) {
        if (hours > 12) {
            hours -= 12;
        }
        meridian = "p.m.";
    }
    else if (hours === 0) {
        hours = 12;
    }
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    return `${hours}:${zpad(minutes, 2)}:${zpad(seconds, 2)} ${meridian}`;
}
async function updateDotSol(root, config, filename) {
    const inPath = join(root, config.dirs.contracts);
    const compiled = await compile(inPath, filename);
    for (const contract of compiled.contracts) {
        const ts = `import { ethers } from "ethers";\n\n` + generateTypeScript(contract);
        const outPath = join(root, config.dirs.output);
        const outFile = parse(filename).name + ".ts";
        fs.mkdirSync(outPath, { recursive: true });
        fs.writeFileSync(join(outPath, outFile), ts);
    }
    return compiled;
}
function walk(root, path, callback) {
    for (const filename of fs.readdirSync(join(root, path))) {
        if (fs.statSync(join(root, path, filename)).isDirectory()) {
            walk(root, join(path, filename), callback);
        }
        else {
            callback(join(path, filename));
        }
    }
}
function readDir(root) {
    const result = [];
    walk(root, ".", (fn) => { result.push(fn); });
    return result;
}
async function updateDotSols(root, config, filenames) {
    const errors = [];
    for (const filename of filenames) {
        const compiled = await updateDotSol(root, config, filename);
        compiled.errors.forEach((e) => errors.push(e));
        compiled.warnings.forEach((e) => errors.push(e));
    }
    if (errors.length) {
        errors.forEach((e) => console.log(e.formatted));
    }
    else {
        console.log(`\n${getTime()} - Found 0 errors. Watching for contract changes...\n`);
    }
    return errors;
}
(async function () {
    const config = {
        dirs: {
            contracts: "contracts",
            // Defaults to src.ts/${ dirs.contracts }
            output: "src.ts/contracts",
        }
    };
    // @TODO: Pull this from the project root? where package.json lives? tsconfig?
    const root = resolve(".");
    // Initial compailation
    const filenames = readDir(join(root, config.dirs.contracts)).filter(f => f.match(/\.sol$/));
    let errors = await updateDotSols(root, config, filenames);
    const watcher = fs.watch(join(root, config.dirs.contracts), { recursive: true }, async (eventType, filename) => {
        if (!filename.match(/\.sol$/)) {
            return;
        }
        console.log(`\n${getTime()} - File change detected. Starting contract compilation...\n`);
        const filenames = new Set([filename]);
        for (const e of errors) {
            filenames.add(e.filename);
        }
        errors = await updateDotSols(root, config, Array.from(filenames));
    });
    // Spawn tsc; @TODO: add config for this
    const tsc = spawn("npx", ["tsc", "--project", "tsconfig.json", "-w"], {
        cwd: root
    });
    tsc.stdout.on("data", (data) => {
        console.log(data.toString().trim() + "\n");
    });
    tsc.stderr.on("data", (data) => {
        console.log("stderr output from tsc:");
        console.log(data.toString());
    });
    tsc.on("error", (error) => {
        console.log("Error from tsc:");
        console.log("ErrorEE", error);
        watcher.close();
        tsc.disconnect();
    });
    tsc.on("close", (code) => {
        console.log(`${getTime()} - tsc closing. Shutting down.`);
        watcher.close();
    });
})();
//# sourceMappingURL=test.js.map