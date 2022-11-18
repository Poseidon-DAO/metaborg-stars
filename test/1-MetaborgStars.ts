import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

const BN_ONE_GWEI = ethers.BigNumber.from("1000000000000000");
const availablesID=[0,1,2,3,4,5,6,7,8,9,10];
const stars=[1,4,1,1,0,1,2,1,1,0,1];
const baseURI = "https://poseidondao.mypinata.cloud/ipfs/QmP9urnKMSDCAkzNyRJzmpJjbhmYuQbLPaYdunQdthYWAh/";
describe("Metaborg Stars", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshopt in every test.
  async function deploySmartContract() {

    // Contracts are deployed using the first signer/account by default
    const [owner, address1, address2, address3] = await ethers.getSigners();

    const Metaborg = await ethers.getContractFactory("MetaborgDistributionERC1155_V2");
    const metaborg = await Metaborg.deploy();
    await metaborg.initialize();

    const MetaborgStars = await ethers.getContractFactory("MetaborgStars");
    const metaborgStars = await MetaborgStars.deploy();
    await metaborgStars.initialize(availablesID, stars, baseURI, metaborg.address);

    return { metaborg, metaborgStars, owner, address1, address2, address3 };
  }

  describe("Deployment and Settings", function () {
    it("Check the owner address", async function () {
      const {metaborgStars, owner} = await loadFixture(deploySmartContract);
      expect(await metaborgStars.owner()).to.equals(owner.address);
    });

    it("Set Group Metadata", async function () {
      const {metaborgStars, address1} = await loadFixture(deploySmartContract);
      const prices = [BN_ONE_GWEI, BN_ONE_GWEI.mul(2), BN_ONE_GWEI.mul(3)];
      const packs = [1, 2, 3];
      const groupID = 0;
      await metaborgStars.setGroupMetaData(prices, packs, groupID);
      // By default all addresses had group = 0 by priority
      const metadata = await metaborgStars.callStatic.getAddressMetadata(address1.address);
      expect(metadata[0]).to.equals(packs[0]);
      expect(metadata[1]).to.equals(packs[1]);
      expect(metadata[2]).to.equals(packs[2]);
      expect(metadata[3]).to.equals(prices[0]);
      expect(metadata[4]).to.equals(prices[1]);
      expect(metadata[5]).to.equals(prices[2]);
    });

    it("Can't Set Group Metadata for undetected group", async function () {
      const {metaborgStars, address1} = await loadFixture(deploySmartContract);
      const prices = [BN_ONE_GWEI, BN_ONE_GWEI.mul(2), BN_ONE_GWEI.mul(3)];
      const packs = [1, 2, 3];
      const groupID = 100; //errore
      await expect(metaborgStars.setGroupMetaData(prices, packs, groupID)).to.be.revertedWith("GROUP_ID_NOT_VALID");
    });

    it("Can't Set Group Metadata if price array length is not equals to 3", async function () {
      const {metaborgStars} = await loadFixture(deploySmartContract);
      const prices = [BN_ONE_GWEI, BN_ONE_GWEI.mul(2)];
      const packs = [1, 2, 3];
      const groupID = 0; 
      await expect(metaborgStars.setGroupMetaData(prices, packs, groupID)).to.be.revertedWith("PRICE_ARRAY_LENGTH_DISMATCH");
    });

    it("Can't Set Group Metadata if packs array length is not equals to 3", async function () {
      const {metaborgStars} = await loadFixture(deploySmartContract);
      const prices = [BN_ONE_GWEI, BN_ONE_GWEI.mul(2), BN_ONE_GWEI.mul(3)];
      const packs = [1];
      const groupID = 0; 
      await expect(metaborgStars.setGroupMetaData(prices, packs, groupID)).to.be.revertedWith("PACKS_ARRAY_LENGTH_DISMATCH");
    });

    it("Set Wait to burn", async function () {
      const {metaborgStars} = await loadFixture(deploySmartContract);
      const blocks = 1000;
      await metaborgStars.setWaitToBurn(blocks);
      expect(await metaborgStars.callStatic.blockDelay()).to.equals(ethers.BigNumber.from(blocks));
    });
  });

  describe("Customers Buying System", function () {
      it("Single pack - OPEN", async function () {
        const {metaborgStars, address1} = await loadFixture(deploySmartContract);
        const price1 = [10,20,30];
        const price2 = [40,50,60];
        const price3 = [70,80,90];
        const packs1 = [1,2,3];
        const packs2 = [4,5,6];
        const packs3 = [7,8,9];
        await metaborgStars.setGroupMetaData(price1, packs1, 0); // price[], pack[], group
        await metaborgStars.setGroupMetaData(price2, packs2, 1); // price[], pack[], group
        await metaborgStars.setGroupMetaData(price3, packs3, 2); // price[], pack[], group
        await metaborgStars.connect(address1).buyMetaborgStars({value: price1[1]});
        expect(await metaborgStars.balanceOf(address1.address)).to.equals(ethers.BigNumber.from(packs1[1]));
      });

      it("Single pack - WHITELISTED", async function () {
        const {metaborgStars, address1} = await loadFixture(deploySmartContract);
        const price1 = [10,20,30];
        const price2 = [40,50,60];
        const price3 = [70,80,90];
        const packs1 = [1,2,3];
        const packs2 = [4,5,6];
        const packs3 = [7,8,9];
        await metaborgStars.setGroupMetaData(price1, packs1, 0); // price[], pack[], group
        await metaborgStars.setGroupMetaData(price2, packs2, 1); // price[], pack[], group
        await metaborgStars.setGroupMetaData(price3, packs3, 2); // price[], pack[], group
        await metaborgStars.setWhitelistedAddresses([address1.address], true);
        const metadata = await metaborgStars.callStatic.getAddressMetadata(address1.address);
        await metaborgStars.connect(address1).buyMetaborgStars({value: price2[1]});
        expect(await metaborgStars.balanceOf(address1.address)).to.equals(ethers.BigNumber.from([packs2[1]]));
      });

      it("Single pack - OWNER", async function () {
        const {metaborg, metaborgStars, address1} = await loadFixture(deploySmartContract);
        const price1 = [10,20,30];
        const price2 = [40,50,60];
        const price3 = [70,80,90];
        const packs1 = [1,2,3];
        const packs2 = [4,5,6];
        const packs3 = [7,8,9];
        await metaborgStars.setGroupMetaData(price1, packs1, 0); // price[], pack[], group
        await metaborgStars.setGroupMetaData(price2, packs2, 1); // price[], pack[], group
        await metaborgStars.setGroupMetaData(price3, packs3, 2); // price[], pack[], group

        // check metaborg test to understand mock data
        await metaborg.createMangaDistribution(1,1,1,1,[address1.address],[3], 1, 2, 3, ["#1", "#2", "#3"],false);
        await metaborg.connect(address1).mintRandomManga(1, {value: 1});

        await metaborgStars.connect(address1).buyMetaborgStars({value: price3[1]});
        expect(await metaborgStars.balanceOf(address1.address)).to.equals(ethers.BigNumber.from([packs3[1]]));
      });

      it("Single pack - OWNER has more priority of WHITELISTED", async function () {
        const {metaborg, metaborgStars, address1} = await loadFixture(deploySmartContract);
        const price1 = [10,20,30];
        const price2 = [40,50,60];
        const price3 = [70,80,90];
        const packs1 = [1,2,3];
        const packs2 = [4,5,6];
        const packs3 = [7,8,9];
        await metaborgStars.setGroupMetaData(price1, packs1, 0); // price[], pack[], group
        await metaborgStars.setGroupMetaData(price2, packs2, 1); // price[], pack[], group
        await metaborgStars.setGroupMetaData(price3, packs3, 2); // price[], pack[], group
        await metaborgStars.setGroupMetaData(price3, packs3, 3); // price[], pack[], group

        await metaborgStars.setWhitelistedAddresses([address1.address], true);

        // check metaborg test to understand mock data
        await metaborg.createMangaDistribution(1,1,1,1,[address1.address],[3], 1, 2, 3, ["#1", "#2", "#3"],false);
        await metaborg.connect(address1).mintRandomManga(1, {value: 1});
        await metaborgStars.connect(address1).buyMetaborgStars({value: price3[1]});
        expect(await metaborgStars.balanceOf(address1.address)).to.equals(ethers.BigNumber.from([packs3[1]]));
      });

      it("Single pack - if OWNER group is not set we use OPEN", async function () {
        const {metaborg, metaborgStars, address1} = await loadFixture(deploySmartContract);
        const price1 = [10,20,30];
        const price2 = [40,50,60];
        const price3 = [70,80,90];
        const packs1 = [1,2,3];
        const packs2 = [4,5,6];
        const packs3 = [7,8,9];
        await metaborgStars.setGroupMetaData(price1, packs1, 0); // price[], pack[], group
        await metaborgStars.setGroupMetaData(price2, packs2, 1); // price[], pack[], group
        //await metaborgStars.setGroupMetaData(price3, packs3, 2); // price[], pack[], group

        await metaborgStars.setWhitelistedAddresses([address1.address], true);

        // check metaborg test to understand mock data
        await metaborg.createMangaDistribution(1,1,1,1,[address1.address],[3], 1, 2, 3, ["#1", "#2", "#3"],false);
        await metaborg.connect(address1).mintRandomManga(1, {value: 1});

        await metaborgStars.connect(address1).buyMetaborgStars({value: price1[1]});
        expect(await metaborgStars.balanceOf(address1.address)).to.equals(ethers.BigNumber.from([packs1[1]]));
      });

      it("Withdraw owner balance", async function () {
        const {metaborgStars, address1, address2} = await loadFixture(deploySmartContract);        
        const oldBalance = await ethers.provider.getBalance(address2.address);
        const price1 = [10,20,30];
        const packs1 = [1,2,3];
        await metaborgStars.setGroupMetaData(price1, packs1, 0); // price[], pack[], group
        await metaborgStars.connect(address1).buyMetaborgStars({value: price1[1]});
        await metaborgStars.withdrawOwnerBalance(address2.address);
        const newBalance = await ethers.provider.getBalance(address2.address);
        expect(newBalance).to.equals(oldBalance.add(ethers.BigNumber.from(price1[1])));
      });

      it("Airdrop Manga", async function () {
        const {metaborgStars, address1, address2} = await loadFixture(deploySmartContract);        
        await metaborgStars.airdropManga([address1.address, address2.address], [11,12]);
        expect(await metaborgStars.ownerOf(11)).to.equals(address1.address);
        expect(await metaborgStars.ownerOf(12)).to.equals(address2.address);
      });

      it("Airdrop Manga - Can't set duplicates IDs", async function () {
        const {metaborgStars, address1, address2} = await loadFixture(deploySmartContract);        ;
        await expect(metaborgStars.airdropManga([address1.address, address2.address], [1,2])).to.be.revertedWith("ONE_OR_MORE_ID_ALREADY_SET");

      });


      it("Full Distribution Manga", async function () {
        const {metaborgStars, address1, address2} = await loadFixture(deploySmartContract);     
        const price1 = [10,20,30];
        const packs1 = [1,2,11];
        await metaborgStars.setGroupMetaData(price1, packs1, 0); // price[], pack[], group
        await metaborgStars.connect(address1).buyMetaborgStars({value: price1[2]});    
        expect(await metaborgStars.balanceOf(address1.address)).to.equals(ethers.BigNumber.from("11"));
      });

      it("Full Distribution Manga within 6 calls", async function () {
        const {metaborgStars, address1, address2} = await loadFixture(deploySmartContract);     
        const price1 = [10,20,30];
        const packs1 = [1,2,11];
        await metaborgStars.setGroupMetaData(price1, packs1, 0); // price[], pack[], group
        await metaborgStars.connect(address1).buyMetaborgStars({value: price1[1]});   
        await metaborgStars.connect(address1).buyMetaborgStars({value: price1[1]});   
        await metaborgStars.connect(address1).buyMetaborgStars({value: price1[1]});   
        await metaborgStars.connect(address1).buyMetaborgStars({value: price1[1]});   
        await metaborgStars.connect(address1).buyMetaborgStars({value: price1[1]});   
        await metaborgStars.connect(address1).buyMetaborgStars({value: price1[0]});   
        expect(await metaborgStars.balanceOf(address1.address)).to.equals(ethers.BigNumber.from("11"));
      });

      it("Check if with 3 or 5 pack we receive a 3 or 4 stars", async function () {
        const {metaborgStars, address1, address2} = await loadFixture(deploySmartContract);     
        const price1 = [10,20,30];
        const packs1 = [1,2,11];
        const index4Stars = 1
        await metaborgStars.setGroupMetaData(price1, packs1, 0); // price[], pack[], group
        await metaborgStars.connect(address1).buyMetaborgStars({value: price1[1]});
        expect(await metaborgStars.ownerOf(index4Stars)).to.equals(address1.address);
      });



  });
  
});
/*
const availablesID=[0,1,2,3,4,5,6,7,8,9,10];
const stars=[1,4,1,1,0,1,2,1,1,0,3];
*/