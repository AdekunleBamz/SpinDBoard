const hre = require("hardhat");

function getArg(name, defaultValue) {
  const prefix = `--${name}=`;
  const arg = process.argv.find((a) => a.startsWith(prefix));
  if (!arg) return defaultValue;
  return arg.slice(prefix.length);
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
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

async function printStatus(contract) {
  const [gameId, status, totalPool, playerCount, winner, winningNumber] =
    await contract.getCurrentGame();

  const statusNames = ["Waiting", "Spinning", "Completed"];
  console.log("Current Game:");
  console.log(`- id: ${gameId}`);
  console.log(`- status: ${statusNames[Number(status)] || status}`);
  console.log(`- playerCount: ${playerCount}`);
  console.log(`- totalPool: ${hre.ethers.formatEther(totalPool)} ETH`);
  console.log(`- winner: ${winner}`);
  console.log(`- winningNumber: ${winningNumber}`);
}

async function joinWithWallets(contractAddress, playersCount) {
  const keys = loadWalletPrivateKeys(10);
  if (keys.length === 0) {
    throw new Error(
      "No WALLET_*_PRIVATE_KEY values found in .env. Run scripts/generateWallets.js or fill .env first."
    );
  }

  const targetCount = Math.min(playersCount, keys.length);
  const entryFee = await hre.ethers.getContractAt("SpinDBoard", contractAddress)
    .then((c) => c.ENTRY_FEE());

  console.log(`Joining with ${targetCount} wallet(s) ...`);

  for (let i = 0; i < targetCount; i++) {
    const wallet = new hre.ethers.Wallet(keys[i], hre.ethers.provider);
    const playerContract = await hre.ethers.getContractAt(
      "SpinDBoard",
      contractAddress,
      wallet
    );

    const address = await wallet.getAddress();
    console.log(`- joining: ${address}`);

    const tx = await playerContract.joinGame({ value: entryFee });
    await tx.wait();
  }
}

async function spinAll(contractAddress) {
  const keys = loadWalletPrivateKeys(10);
  if (keys.length === 0) {
    throw new Error(
      "No WALLET_*_PRIVATE_KEY values found in .env. Run scripts/generateWallets.js or fill .env first."
    );
  }

  console.log("Spinning for joined wallets ...");

  for (const pk of keys) {
    const wallet = new hre.ethers.Wallet(pk, hre.ethers.provider);
    const playerContract = await hre.ethers.getContractAt(
      "SpinDBoard",
      contractAddress,
      wallet
    );
    const address = await wallet.getAddress();

    const [hasJoined, spinResult, hasSpun] = await playerContract.getPlayerInfo(
      address
    );

    if (!hasJoined) continue;
    if (hasSpun) {
      console.log(`- already spun: ${address} (result: ${spinResult})`);
      continue;
    }

    console.log(`- spinning: ${address}`);
    const tx = await playerContract.spin();
    await tx.wait();
  }
}

async function printResults(contract) {
  const gameId = Number(getArg("gameId", "0"));
  if (!Number.isFinite(gameId) || gameId <= 0) {
    throw new Error("Missing/invalid --gameId (e.g. --gameId=1)");
  }

  const game = await contract.getGame(gameId);
  const players = await contract.getGamePlayers(gameId);

  console.log(`Game #${gameId}`);
  console.log(`- status: ${game.status}`);
  console.log(`- totalPool: ${hre.ethers.formatEther(game.totalPool)} ETH`);
  console.log(`- winner: ${game.winner}`);
  console.log(`- winningNumber: ${game.winningNumber}`);
  console.log(`- playerCount: ${game.playerCount}`);
  console.log("Players:");

  for (const p of players) {
    console.log(
      `- ${p.playerAddress} | spun=${p.hasSpun} | result=${p.spinResult}`
    );
  }
}

async function main() {
  const action = getArg("action", "status");
  const contractAddress = requireEnv("SPINDBOARD_CONTRACT_ADDRESS");
  const contract = await hre.ethers.getContractAt("SpinDBoard", contractAddress);

  if (action === "status") {
    await printStatus(contract);
    return;
  }

  if (action === "join") {
    const players = Number(getArg("players", "3"));
    if (!Number.isFinite(players) || players <= 0) {
      throw new Error("Invalid --players (must be a positive number)");
    }
    await joinWithWallets(contractAddress, players);
    await printStatus(contract);
    return;
  }

  if (action === "spin") {
    await spinAll(contractAddress);
    await printStatus(contract);
    return;
  }

  if (action === "demo") {
    const players = Number(getArg("players", "3"));
    if (!Number.isFinite(players) || players <= 0) {
      throw new Error("Invalid --players (must be a positive number)");
    }
    await joinWithWallets(contractAddress, players);
    await spinAll(contractAddress);
    await printStatus(contract);
    return;
  }

  if (action === "results") {
    await printResults(contract);
    return;
  }

  throw new Error(
    `Unknown --action=${action}. Supported: status | join | spin | demo | results`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
