const hre = require("hardhat");

// ubuntu@ubuntu-Surface-Pro-7:~/Documents/GitHub/contracts$ npx hardhat run --network rinkeby ./scripts/publish.js

async function main() {
  const smartContractList = [];

    // METABORG STARS DISTRIBUTION

    const Metaborg = await hre.ethers.getContractFactory(
      "MetaborgDistributionERC1155_V2"
    );
    const metaborg = await Metaborg.deploy();
  
    await metaborg.deployed();
  
    // await metaborgStars.initialize(IPFSList)
    console.log(
      "Metaborg deployed to:",
      metaborg.address
    );
  
    smartContractList.push(metaborg.address);

  // METABORG STARS DISTRIBUTION

  const MetaborgStars = await hre.ethers.getContractFactory(
    "MetaborgStars"
  );
  const metaborgStars = await MetaborgStars.deploy();

  await metaborgStars.deployed();

  // await metaborgStars.initialize(IPFSList)
  console.log(
    "MetaborgStars deployed to:",
    metaborgStars.address
  );

  smartContractList.push(metaborgStars.address);


  // SMART CONTRACT VERIFICATION

  const { exec } = require("child_process");
  const network = "goerli";
  exec(
    "npx hardhat verify --network " + network + " " + smartContractList[0],
    (err, stdout, stderr) => {
      console.log(err);
    }
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

/*
    LAST RUN OUTPUT:

  */

/*
 
Mauro Tommasi
Rinkeby Testnet
Pbl: 0xB6097b6932ad88D1159c10bA7D290ba05087507D
Pvt: 0x05da23ac61f6033d09e69470b9b1f6afcc98214451b78164ee0017e474ebd75a
Pbl: 0x7db3c4099660a6f33bBfF63B3318CBf9b4D07743
Pvt: 0x9723825bcb901c7fa2bb209763eb12d02a2fa233f3b31bda1c9256c2c76507e5
Pbl: 0x0a767592E4C4CbD5A65BAc08bd3c7112d68496A5
Pvt: 0x9e5173918505a0917dbb5a2c40ecdeecb11fb48f88dc5a9e84a968174dc2910f
Pbl: 0x3d6AD09Ed37447b963A7f5470bF6C0003D36dEe3
Pvt: 0xc41927c6c49d5e09b0b6b93be73f1420ed6b381614fbb824f37af79fe78480cd
Owner
Pbl: 0xDc3A186fB898669023289Fd66b68E4016875E011
Pvt: 0x17793bb885773856ac0a6f534f9484e74c1164bd545659b95419c430bbba5904

*/
