const { Wallet } = require("ethers");

function getArg(name, defaultValue) {
  const prefix = `--${name}=`;
  const arg = process.argv.find((a) => a.startsWith(prefix));
  if (!arg) return defaultValue;
  return arg.slice(prefix.length);
}

async function main() {
  const count = Number(getArg("count", process.env.WALLET_COUNT || "10"));
  if (!Number.isFinite(count) || count <= 0) {
    throw new Error("Invalid --count (must be a positive number)");
  }

  console.log(`# Generated ${count} wallets`);
  console.log("# Add these to your .env (WITHOUT 0x prefix):");

  for (let i = 1; i <= count; i++) {
    const wallet = Wallet.createRandom();
    const pkNo0x = wallet.privateKey.startsWith("0x")
      ? wallet.privateKey.slice(2)
      : wallet.privateKey;

    console.log(`WALLET_${i}_PRIVATE_KEY=${pkNo0x}`);
    console.log(`# WALLET_${i}_ADDRESS=${wallet.address}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
