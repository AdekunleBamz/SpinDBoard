const hre = require("hardhat");

function getFlag(name) {
  return process.argv.includes(`--${name}`);
}

function normalizePrivateKey(pk) {
  const trimmed = String(pk).trim();
  if (!trimmed) return null;
  return trimmed.startsWith("0x") ? trimmed : `0x${trimmed}`;
}

function loadWalletPrivateKeys(max = 10) {
  const keys = [];
  for (let i = 1; i <= max; i++) {
    const raw = process.env[`WALLET_${i}_PRIVATE_KEY`];
    const pk = raw ? normalizePrivateKey(raw) : null;
    if (pk) keys.push(pk);
  }
  return keys;
}

async function main() {
  const confirm = getFlag("confirm");
  const to = process.env.SWEEP_TO || process.env.DEPLOYER_ADDRESS;

  if (!to) {
    throw new Error(
      "Missing SWEEP_TO (recommended) or DEPLOYER_ADDRESS in .env to receive swept funds"
    );
  }

  const keys = loadWalletPrivateKeys(10);
  if (keys.length === 0) {
    throw new Error("No WALLET_*_PRIVATE_KEY values found in .env");
  }

  const feeData = await hre.ethers.provider.getFeeData();
  const gasPrice = feeData.gasPrice;

  if (!gasPrice) {
    throw new Error("Could not fetch gasPrice from provider");
  }

  const gasLimit = 21_000n;
  const gasCost = gasLimit * gasPrice;

  console.log(`Sweeping ${keys.length} wallet(s) to: ${to}`);
  console.log(`Network: ${hre.network.name}`);
  console.log(`Mode: ${confirm ? "CONFIRMED (will send)" : "DRY RUN (no sends)"}`);

  for (const pk of keys) {
    const wallet = new hre.ethers.Wallet(pk, hre.ethers.provider);
    const from = await wallet.getAddress();
    const balance = await hre.ethers.provider.getBalance(from);

    if (balance <= gasCost) {
      console.log(`- ${from}: skip (balance too low: ${hre.ethers.formatEther(balance)} ETH)`);
      continue;
    }

    const value = balance - gasCost;
    console.log(
      `- ${from}: sweep ${hre.ethers.formatEther(value)} ETH (keeps ~gas)`
    );

    if (!confirm) continue;

    const tx = await wallet.sendTransaction({
      to,
      value,
      gasLimit,
      gasPrice,
    });
    await tx.wait();
  }

  console.log("Done.");
  if (!confirm) {
    console.log("Re-run with --confirm to actually send transactions.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
