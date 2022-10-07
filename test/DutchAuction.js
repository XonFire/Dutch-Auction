const { ethers } = require("hardhat");
const { expect } = require("chai");
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");
require("@nomicfoundation/hardhat-chai-matchers");

describe("Dutch Auction contract", function () {
    async function deployAuctionFixture() {
        const TubbysCoinFactory = await ethers.getContractFactory("TubbysCoin");
        const [owner, addr1, addr2] = await ethers.getSigners();
        const TubbysCoin = await TubbysCoinFactory.deploy(5000);
        await TubbysCoin.deployed();
        const DutchAuctionFactory = await ethers.getContractFactory("DutchAuction");
        const DutchAuction = await DutchAuctionFactory.deploy(TubbysCoin.address, 2000, 1000, 1);
        await DutchAuction.deployed();
        TubbysCoin.approve(DutchAuction.address, 5000);

        return {TubbysCoin, DutchAuction, owner, addr1, addr2};
    }

    describe("TubbysCoin Deployment", function () {
        it("Should have initial supply of 5000", async function() {
            const {TubbysCoin} = await loadFixture(deployAuctionFixture);
            expect(await TubbysCoin.totalSupply()).to.equal(5000);
        });

        it("Owner should have total supply of 5000", async function () {
            const {TubbysCoin, owner} = await loadFixture(deployAuctionFixture);
            expect(await TubbysCoin.balanceOf(owner.address)).to.equal(5000);
        });
    });

    describe("Dutch Auction Deployment", function () {
        it("Should be in init stage", async function() {
            const {DutchAuction} = await loadFixture(deployAuctionFixture);
            expect(await DutchAuction.stage()).to.equal(0);
        });
    });

    describe("Dutch Auction Started", function () {
        it("Should be in start stage", async function() {
            const {DutchAuction} = await loadFixture(deployAuctionFixture);
            await DutchAuction.startAuction();
            expect(await DutchAuction.stage()).to.equal(1);
        })
    })
    
    describe("Price of TUBBY", function () {
        it("Should be priced correctly (discounted price > reserved price)", async function () {
            const {DutchAuction} = await loadFixture(deployAuctionFixture);
            await DutchAuction.startAuction();
            // advance time by 10 minutes
            await time.increase(10*60);
            expect(await DutchAuction.calcTokenPrice()).to.equal(2000-600);
        })

        it("Should be priced correctly (discounted price < reserved price)", async function () {
            const {DutchAuction} = await loadFixture(deployAuctionFixture);
            await DutchAuction.startAuction();
            // advance time by 19 minutes
            await time.increase(19*60);
            expect(await DutchAuction.calcTokenPrice()).to.equal(1000);
        })
    })

    describe("Bidding", function () {
        it("Should be a success bid of 500 TUBBY", async function () {
            const QUANTITY_SOLD = 500;
            const AMOUNT_WEI = 1000000;
            const {DutchAuction, addr1} = await loadFixture(deployAuctionFixture);
            await DutchAuction.startAuction();
            const cost = (await DutchAuction.calcTokenPrice()) * QUANTITY_SOLD;
            const refund = AMOUNT_WEI - cost;
            // one block is mined during expect statement. Thus update cost % refund by QUANTITY_SOLD*discountRate 
            await expect(DutchAuction
                .connect(addr1)
                .bid(500, {value: AMOUNT_WEI}))
            .to.emit(DutchAuction, "BidSubmission").withArgs(addr1.address, QUANTITY_SOLD, cost-QUANTITY_SOLD*1)
            .to.emit(DutchAuction, "RefundEther").withArgs(addr1.address, refund+QUANTITY_SOLD*1)
        })

        it("Should be a failure bid (Not enough ETH)", async function () {
            const AMOUNT_WEI = 1000;
            const {DutchAuction, addr1} = await loadFixture(deployAuctionFixture);
            await DutchAuction.startAuction();
            await expect(DutchAuction
                .connect(addr1)
                .bid(500, {value: AMOUNT_WEI}))
            .to.be.revertedWith("Insufficient ETH for bid");
        })

        it("Should only sell 5000 when order 6000 TUBBY & Auction Ends", async function () {
            const QUANTITY_SOLD = 5000;
            const AMOUNT_WEI = 100000000;
            const {DutchAuction, addr1} = await loadFixture(deployAuctionFixture);
            await DutchAuction.startAuction();
            const cost = (await DutchAuction.calcTokenPrice()) * QUANTITY_SOLD;
            const refund = AMOUNT_WEI - cost;
            await expect(DutchAuction
                .connect(addr1)
                .bid(6000, {value: AMOUNT_WEI}))
            .to.emit(DutchAuction, "BidSubmission").withArgs(addr1.address, QUANTITY_SOLD, cost-QUANTITY_SOLD*1)
            .to.emit(DutchAuction, "RefundEther").withArgs(addr1.address, refund+QUANTITY_SOLD*1)
            .to.emit(DutchAuction, "AuctionEnd").withArgs(await time.latest()+1);
        })
    })

    describe("Claiming Tokens", function () {
        it("Should be able to claim tokens", async function () {
            const {TubbysCoin, DutchAuction, owner, addr1, addr2} = await loadFixture(deployAuctionFixture);
            await DutchAuction.startAuction();
            await DutchAuction.connect(addr1).bid(2500, {value: 100000000});
            await DutchAuction.connect(addr2).bid(2500, {value: 100000000});
            await expect(
                DutchAuction.connect(addr1).claimTokens()
            ).to.changeTokenBalances(TubbysCoin, [owner, addr1], [-2500, 2500])
            .to.emit(DutchAuction, "RefundEther").withArgs(addr1.address, 2500);
            await expect(
                 DutchAuction.connect(addr2).claimTokens()
            ).to.changeTokenBalances(TubbysCoin, [owner, addr2], [-2500, 2500])
            .to.emit(DutchAuction, "RefundEther").withArgs(addr2.address, 0);
        })
    })
});