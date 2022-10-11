// This is a script for deploying your contracts. You can adapt it to deploy
// yours, or create new ones.

const path = require("path");

async function main() {
  // This is just a convenience check
  if (network.name === "hardhat") {
    console.warn(
      "You are trying to deploy a contract to the Hardhat Network, which" +
      " gets automatically created and destroyed every time. Use the Hardhat" +
      " option '--network localhost'"
    );
  }

  // ethers is available in the global scope
  const [deployer] = await ethers.getSigners();
  console.log(
    "Deploying the contracts with the account:",
    await deployer.getAddress()
  );

  console.log("Account balance:", (await deployer.getBalance()).toString());

  const TubbysCoinFactory = await ethers.getContractFactory("TubbysCoin");
  const TubbysCoin = await TubbysCoinFactory.deploy(5000);
  await TubbysCoin.deployed();
  const DutchAuctionFactory = await ethers.getContractFactory("DutchAuction");
  const DutchAuction = await DutchAuctionFactory.deploy(TubbysCoin.address, 2000, 1000, 1);
  await DutchAuction.deployed();
  await TubbysCoin.transfer(DutchAuction.address, 5000);

  console.log("TubbysCoin address:", TubbysCoin.address);
  console.log("DutchAuction address", DutchAuction.address);

  // We also save the contract's artifacts and address in the frontend directory
  saveFrontendFiles(TubbysCoin, DutchAuction);
}

function saveFrontendFiles(TubbysCoin, DutchAuction) {
  const fs = require("fs");
  const contractsDir = path.join(__dirname, "..", "frontend", "src", "contracts");

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  fs.writeFileSync(
    path.join(contractsDir, "contract-address.json"),
    JSON.stringify({ TubbysCoin: TubbysCoin.address, DutchAuction: DutchAuction.address }, undefined, 2)
  );

  const TubbysCoinArtifact = artifacts.readArtifactSync("TubbysCoin");
  const DutchAuctionArtifact = artifacts.readArtifactSync("DutchAuction");

  fs.writeFileSync(
    path.join(contractsDir, "TubbysCoin.json"),
    JSON.stringify(TubbysCoinArtifact, null, 2)
  );

  fs.writeFileSync(
    path.join(contractsDir, "DutchAuction.json"),
    JSON.stringify(DutchAuctionArtifact, null, 2)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
