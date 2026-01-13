const hre = require("hardhat");

async function main() {
  const SpinDBoard = await hre.ethers.getContractFactory("SpinDBoard");
  const spinDBoard = await SpinDBoard.deploy();
  await spinDBoard.waitForDeployment();

  const address = await spinDBoard.getAddress();
  console.log(`SpinDBoard deployed to: ${address}`);

  // Optional verification (BaseScan) — only runs if an API key is provided.
  const hasApiKey = Boolean(process.env.BASESCAN_API_KEY);
  const isHardhat = hre.network.name === "hardhat";

  if (!isHardhat && hasApiKey) {
    console.log("Waiting a bit before verification...");
    await new Promise((resolve) => setTimeout(resolve, 15_000));

    try {
      await hre.run("verify:verify", {
        address,
        constructorArguments: [],
      });
      console.log("Verified on explorer.");
    } catch (err) {
      console.log("Verification skipped/failed:", err?.message || err);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
