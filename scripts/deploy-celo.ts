import "dotenv/config";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createPublicClient, createWalletClient, defineChain, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const rootDir = resolve(fileURLToPath(new URL("../", import.meta.url)));
const artifactsDir = join(rootDir, "artifacts");
const deploymentsDir = join(rootDir, "deployments");

const celo = defineChain({
  id: 42220,
  name: "Celo",
  nativeCurrency: { decimals: 18, name: "CELO", symbol: "CELO" },
  rpcUrls: {
    default: { http: ["https://forno.celo.org"] },
  },
  blockExplorers: {
    default: { name: "Celoscan", url: "https://celoscan.io" },
  },
});

const alfajores = defineChain({
  id: 44787,
  name: "Celo Alfajores",
  nativeCurrency: { decimals: 18, name: "CELO", symbol: "CELO" },
  rpcUrls: {
    default: { http: ["https://alfajores-forno.celo-testnet.org"] },
  },
  blockExplorers: {
    default: { name: "Alfajores Celoscan", url: "https://alfajores.celoscan.io" },
  },
});

const networkName = process.env.CELO_NETWORK === "mainnet" ? "mainnet" : "alfajores";
const chain = networkName === "mainnet" ? celo : alfajores;
const rpcUrl = process.env.CELO_RPC_URL || chain.rpcUrls.default.http[0];
const privateKey = process.env.PRIVATE_KEY;

if (!privateKey || !privateKey.startsWith("0x")) {
  throw new Error("Set PRIVATE_KEY in .env before deploying to Celo.");
}

const account = privateKeyToAccount(privateKey as `0x${string}`);
const transport = http(rpcUrl);
const wallet = createWalletClient({ account, chain, transport });
const publicClient = createPublicClient({ chain, transport });

async function loadArtifact(name) {
  return JSON.parse(await readFile(join(artifactsDir, `${name}.json`), "utf8"));
}

async function deploy(name, args) {
  const artifact = await loadArtifact(name);
  const hash = (await (wallet as any).deployContract({
    chain,
    abi: artifact.abi,
    bytecode: artifact.bytecode,
    args,
  })) as `0x${string}`;
  console.log(`${name} deploy tx: ${hash}`);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log(`${name} deployed at ${receipt.contractAddress}`);
  return {
    address: receipt.contractAddress,
    transactionHash: hash,
  };
}

await mkdir(deploymentsDir, { recursive: true });

const verifierAddress = process.env.VERIFIER_ADDRESS || account.address;
const publisherAddress = process.env.PUBLISHER_ADDRESS || account.address;

const escrow = await deploy("FieldProofEscrow", [verifierAddress]);
const registry = await deploy("FieldProofRegistry", [publisherAddress]);

const deployment = {
  network: networkName,
  chainId: chain.id,
  deployer: account.address,
  verifierAddress,
  publisherAddress,
  contracts: {
    FieldProofEscrow: escrow,
    FieldProofRegistry: registry,
  },
  blockExplorer: chain.blockExplorers.default.url,
  deployedAt: new Date().toISOString(),
};

await writeFile(
  join(deploymentsDir, `${networkName}.json`),
  `${JSON.stringify(deployment, null, 2)}\n`,
);

console.log(`Deployment written to deployments/${networkName}.json`);
