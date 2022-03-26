const { EtherscanProvider } = require("@ethersproject/providers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

const toWei = (num) => ethers.utils.parseEther(num.toString());
const fromWei = (num) => ethers.utils.formatEther(num);

describe("NFTMarketplace", function () {
  let NFT;
  let nft;
  let marketplace;
  let Marketplace;
  let deployer;
  let addr1;
  let addr2;
  let addrs;
  let feePercent = 1;
  let URI = "sample URI";

  beforeEach(async function () {
    //get the contractFactories and signers here
    NFT = await ethers.getContractFactory("NFT");
    Marketplace = await ethers.getContractFactory("Marketplace");
    [deployer, addr1, addr2, ...addrs] = await ethers.getSigners();

    //to deploy our contracts
    nft = await NFT.deploy();
    marketplace = await Marketplace.deploy(freePercent);
  });

  describe("Deployment", function(){
      it("Should track name and symbol of the nft collection", async function(){
          //this test expects the owner variable stored in the contract to be equal to 
          //our Signer's owner
          const nftName = "DApp NFT"
          const nftSymbol = "DAPP"
          expect(await nft.name()).to.equal(nftName);
          expect(await nft.symbol()).to.equal(nftSymbol);)
      });
      it("should track feeAccount and feePercent of the marketplace", async function(){
          expect(await marketplace.feeAccount()).to.equal(deployer.address);
          expect(await marketplace.feePercent()).to.equal(feePercent);
      })
  })

  describe("Minting NFTs", function(){
      it("should track each minted NFT", async function(){
          //addr1 mints an nft
          await nft.connect(addr1).mint(URI)
          expect(await nft.tokenCount()).to.equal(1);
          expect(await nft.balanceOf(addr1.address)).to.equal(1);
          expect(await nft.tokenURI(1)).to.equal(URI);
          //addr2 mints an nft
          await nft.connect(addr2).mint(URI)
          expect(await nft.tokenCount()).to.equal(2);
          expect(await nft.balanceOf(addr2.address)).to.equal(1);
          expect(await nft.tokenURI(2)).to.equal(URI);
          
      });

  })

  describe("Making marketplace items", function() {
      let price = 1
      let result
      beforeEach(async function(){
          //addr1 mints an nft
          await nft.connect(addr1).mint(URI)
          //addr1 approves marketplace to spend nft
          await nft.connect(addr1).setApprovalForAll(marketplace.address,true)
      })

      it("should track newly created item, transfer NFT from seller to amrketplace and emit offered event", async function(){
          //addr1 offers their nft at a price of 1 ether
          await expect(marketplace.connect(addr1).makeItem(nft.address,1,toWei(price)))
          .to.emit(marketplace,"Offered")
          .withArgs(
              1,
              nft.address,
              1,
              toWei(price),
              addr1.address
          )
          //owner of NFT should now be the marketplace
          expect(await nft.ownerOf(1)).to.equal(marketplace.address);
          //item count should now equal 1
          expect(await marketplace.itemCount()).to.equal(1)
          //get item from items mapping then check fields to ensure they  are correct
          const item = await marketplace.items(1)
          expect(item.itemId).to.equal(1)
          expect(item.nft).to.equal(nft.address)
          expect(item.tokenId).to.equal(1)
          expect(item.price).to.equal(toWei(price))
          expect(item.sold).to.equal(false)


      });
      it("should fail if price is set to zero", async function(){
          await expect(
              marketplace.connect(addr1).makeItem(nft.address,1,0)
          ).to.be.revertedWith("price must be greater than zero");
          
      })

  })
  describe("purchasing marketplace items", function(){
      let price = 2
      let fee = (feePercent/100)*price
      let totalPriceInWei
      beforeEach(async function() {
          //addr1 mints an nft
          await nft.connect(addr1).mint(URI)
          //addr1 approves marketplace to spend tokens
          await nft.connect(addr1).setApprovalForAll(marketplace.address,true)
          //addr1 makes their nft a marketplace item
          await marketplace.connect(addr1).makeItem(nft.address, 1, toWei(price))
      })
      it("should update item as sold , pay seller, transfer NFT to buyer, charge fees and emit a bought event", async function(){
          const sellerInitialEthBal = await addr1.getBalance()
          const feeAccountInitialEthBal = await deployer.getBalance()
          //fetch items total price (market fees + item price)
          totalPriceInWei = await marketplace.getTotalprice(1);
          //addr2 purchanse item
          await expect(marketplace.connect(addr2).purchaseItem(1,{value:totalPriceInWei}))
          .to.emit(marketplace,"Bought")
          .withArgs(
              1,
              nft.address,
              1,
              toWei(price),
              addr1.address,
              addr2.address
          )
          const sellerFinalEthBal = await addr1.getBalance()
          const feeAccountFinalBal = await deployer.getBalance()
          //item should be marked as sold
          expect ((await marketplace.ietms(1)).sold).to.equal(true)
          //seller should receive payment for the price of the NFT sold
          expect(+fromWei(sellerFinalEthBal)).to.equal(+price + +fromWei(sellerInitialEthbal))
          //feeAccount should receive fee
          expect(+fromWei(feeAccountFinalEthBal)).to.equal(+fee + +fromWei(feeAccountInitialEthBal))
          //the buyer should now own the nft
          expect(await nft.ownerOf(1)).to.equal(addr2.address);
      })

      it("should fall for invalid item ids, sold items and when not enough ether is paid",async function(){
          //fails for invalid item ids
          await expect(
              marketplace.connect(addr2).purchaseItem(2,{value:totalPriceInWei})

          ).to.be.revertedWith("item doesn't exit");
          //fails when not enough ether is paid with the transaction.
          //in this instance, fails when buyer only sends enough ether to cover the price of the nft,but not additional amrket fee
          await expect(
              marketplace.connect(addr2).purchaseItem(1,{value: toWei(price)})

          ).to.be.revertedWith("not enough ether to cover item price and market fee");
          //addr2 purchase item 1
          await marketplace.connect(addr2).purchaseitem(1,{value: totalPriceInWei})
          //addr3 tries purchasing item 1 after its been sold
          const addr3 = addrs[0]
          await expect(
              marketplace.connect(addr3).purchaseItem(1, {value:totalPriceInWei})

          ).to.be.revertedWith("item already sold");
      })
  })