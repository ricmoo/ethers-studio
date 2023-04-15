Ethers Studio
=============

This is a very basic proof-of-concept for a future project,
Ethers Studio.

It compiles Solidity into fully Typed interfaces (using the v6
Contract typing API), and then compiles the TypeScript, in watch
mode, ensuring the Solidity and TypeScript are managed in tandem.

Usage
-----

```
/home/ricmoo/test-project> find .

# Config
tsconfig.json
package.json

# Contracts
contracts/hello-world.sol

# TypeScript source (including generated)
src.ts/index.ts
src.ts/contracts/hello-world.ts

# Build files
lib.esm/index.js
lib.esm/contracts/hello-world.js

/home/ricmoo/test-project> npm install -g ethers-studio
/home/ricmoo/test-project> esc

4:19:37 a.m. - Found 0 errors. Watching for contract changes...

4:19:38 a.m. - Starting compilation in watch mode...

4:19:39 a.m. - Found 0 errors. Watching for file changes.
```


@TODO
-----

- build out the Factory classes with the bytecode
- much more flexible config
- reformat Solidity errors to more closely match TypeScript
- more CLI (e.g. offer single-shot, non-watch mode)
- anti-clobber protection

License
-------

MIT License.
