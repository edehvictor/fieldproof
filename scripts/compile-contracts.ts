import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import solc from "solc";

const rootDir = resolve(fileURLToPath(new URL("../", import.meta.url)));
const contractsDir = join(rootDir, "contracts");
const artifactsDir = join(rootDir, "artifacts");

const contractFiles = ["FieldProofEscrow.sol", "FieldProofRegistry.sol"];
const sources = {};

for (const file of contractFiles) {
  const content = await readFile(join(contractsDir, file), "utf8");
  sources[file] = { content };
}

const input = {
  language: "Solidity",
  sources,
  settings: {
    optimizer: {
      enabled: true,
      runs: 200,
    },
    outputSelection: {
      "*": {
        "*": ["abi", "evm.bytecode.object"],
      },
    },
  },
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));
const errors = output.errors || [];
const fatalErrors = errors.filter((error) => error.severity === "error");

for (const error of errors) {
  const stream = error.severity === "error" ? process.stderr : process.stdout;
  stream.write(`${error.formattedMessage}\n`);
}

if (fatalErrors.length) {
  process.exit(1);
}

await mkdir(artifactsDir, { recursive: true });

for (const [file, contracts] of Object.entries(output.contracts)) {
  for (const [contractName, artifact] of Object.entries(contracts)) {
    const normalized = {
      contractName,
      sourceName: basename(file),
      abi: artifact.abi,
      bytecode: `0x${artifact.evm.bytecode.object}`,
    };
    await writeFile(
      join(artifactsDir, `${contractName}.json`),
      `${JSON.stringify(normalized, null, 2)}\n`,
    );
    console.log(`Compiled ${contractName}`);
  }
}
