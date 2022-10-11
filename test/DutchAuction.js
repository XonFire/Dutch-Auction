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
        await TubbysCoin.transfer(DutchAuction.address, 5000);

        return { TubbysCoin, DutchAuction, owner, addr1, addr2 };
    }

    describe("TubbysCoin Deployment", function () {
        it("Should have initial supply of 5000", async function () {
            const { TubbysCoin } = await loadFixture(deployAuctionFixture);
            expect(await TubbysCoin.totalSupply()).to.equal(5000);
        });

        it("DutchAuction should have total supply of 5000", async function () {
            const { TubbysCoin, DutchAuction } = await loadFixture(deployAuctionFixture);
            expect(await TubbysCoin.balanceOf(DutchAuction.address)).to.equal(5000);
        });
    });

    describe("Dutch Auction Deployment", function () {
        it("Should be in init stage", async function () {
            const { DutchAuction } = await loadFixture(deployAuctionFixture);
            expect(await DutchAuction.stage()).to.equal(0);
        });
    });

    describe("Dutch Auction Start", function () {
        it("Should not be start by non-owner", async function () {
            const { DutchAuction, addr1 } = await loadFixture(deployAuctionFixture);
            await expect(DutchAuction.connect(addr1).startAuction()).to.be.revertedWith("Not owner of contract");
        })

        it("Should not start if token owner did not approve Dutch Auction to sell the total supply of tokens", async function () {
            const TubbysCoinFactory = await ethers.getContractFactory("TubbysCoin");
            const [owner, addr1, addr2] = await ethers.getSigners();
            const TubbysCoin = await TubbysCoinFactory.deploy(5000);
            await TubbysCoin.deployed();
            const DutchAuctionFactory = await ethers.getContractFactory("DutchAuction");
            const DutchAuction = await DutchAuctionFactory.deploy(TubbysCoin.address, 2000, 1000, 1);
            await DutchAuction.deployed();
            TubbysCoin.approve(DutchAuction.address, 2000);
            await expect(DutchAuction.startAuction()).to.be.revertedWith("Auction is not approved to sell token total supply");
        })

        it("Should be in start stage", async function () {
            const { DutchAuction } = await loadFixture(deployAuctionFixture);
            await DutchAuction.startAuction();
            expect(await DutchAuction.stage()).to.equal(1);
        })

        it("Should not be able to start another auction", async function () {
            const { DutchAuction } = await loadFixture(deployAuctionFixture);
            await DutchAuction.startAuction();
            await expect(DutchAuction.startAuction()).to.be.revertedWith("Wrong stage of Dutch Auction");
        })

    })

    describe("Price of TUBBY", function () {
        it("Should be priced correctly (discounted price > reserved price)", async function () {
            const { DutchAuction } = await loadFixture(deployAuctionFixture);
            await DutchAuction.startAuction();
            // advance time by 10 minutes
            await time.increase(10 * 60);
            expect(await DutchAuction.calcTokenPrice()).to.equal(2000 - 600);
        })

        it("Should be priced correctly (discounted price < reserved price)", async function () {
            const { DutchAuction } = await loadFixture(deployAuctionFixture);
            await DutchAuction.startAuction();
            // advance time by 19 minutes
            await time.increase(19 * 60);
            expect(await DutchAuction.calcTokenPrice()).to.equal(1000);
        })
    })

    describe("Bidding", function () {
        it("Should be reverted if auction has not started", async function () {
            const { DutchAuction } = await loadFixture(deployAuctionFixture);
            await expect(DutchAuction.bid(1, { value: 100000 })).to.be.revertedWith("Wrong stage of Dutch Auction")
        })

        it("Should be a success bid of 500 TUBBY", async function () {
            const QUANTITY_SOLD = 500;
            const AMOUNT_WEI = 1000000;
            const { DutchAuction, addr1 } = await loadFixture(deployAuctionFixture);
            await DutchAuction.startAuction();
            const cost = (await DutchAuction.calcTokenPrice()) * QUANTITY_SOLD;
            const refund = AMOUNT_WEI - cost;
            // one block is mined during expect statement. Thus update cost % refund by QUANTITY_SOLD*discountRate 
            await expect(DutchAuction
                .connect(addr1)
                .bid(500, { value: AMOUNT_WEI })
            ).to.emit(DutchAuction, "BidSubmission").withArgs(addr1.address, QUANTITY_SOLD, cost - QUANTITY_SOLD * 1)
                .to.emit(DutchAuction, "RefundEther").withArgs(addr1.address, refund + QUANTITY_SOLD * 1)
        })

        it("Should be a failure bid (Not enough ETH)", async function () {
            const { DutchAuction, addr1 } = await loadFixture(deployAuctionFixture);
            await DutchAuction.startAuction();
            await expect(DutchAuction
                .connect(addr1)
                .bid(500, { value: 1000 })
            ).to.be.revertedWith("Insufficient ETH for bid");
        })

        it("Should only sell 5000 when order 6000 TUBBY", async function () {
            const QUANTITY_SOLD = 5000;
            const AMOUNT_WEI = 100000000;
            const { DutchAuction, addr1 } = await loadFixture(deployAuctionFixture);
            await DutchAuction.startAuction();
            const cost = (await DutchAuction.calcTokenPrice()) * QUANTITY_SOLD;
            const refund = AMOUNT_WEI - cost;
            await expect(DutchAuction
                .connect(addr1)
                .bid(6000, { value: AMOUNT_WEI }))
                .to.emit(DutchAuction, "BidSubmission").withArgs(addr1.address, QUANTITY_SOLD, cost - QUANTITY_SOLD * 1)
                .to.emit(DutchAuction, "RefundEther").withArgs(addr1.address, refund + QUANTITY_SOLD * 1)
        })

        it("Should revert bid when all tokens are sold", async function () {
            const { DutchAuction, addr1, addr2 } = await loadFixture(deployAuctionFixture);
            await DutchAuction.startAuction();
            await DutchAuction.connect(addr1).bid(5000, { value: 100000000 })
            await expect(DutchAuction.connect(addr2).bid(100, { value: 100000000 })).to.be.reverted;
        })

        it("Should revert bid when timeout", async function () {
            const { DutchAuction, addr1 } = await loadFixture(deployAuctionFixture);
            await DutchAuction.startAuction();
            await time.increase(20 * 60);
            await expect(DutchAuction.connect(addr1).bid(100, { value: 100000000 })).to.be.reverted;
        })
    })

    describe("Auction End", function () {
        it("Should end when all quantity sold", async function () {
            const { DutchAuction, addr1 } = await loadFixture(deployAuctionFixture);
            await DutchAuction.startAuction();
            await time.increase(5 * 60)
            await expect(DutchAuction.connect(addr1).bid(5000, { value: 100000000 }))
                .to.emit(DutchAuction, "AuctionEnd")
                .withArgs(await time.latest() + 1);
        })

        it("Shoudl end when time is up and a claim is made", async function () {
            const { DutchAuction, addr1 } = await loadFixture(deployAuctionFixture);
            await DutchAuction.startAuction();
            await DutchAuction.connect(addr1).bid(4000, { value: 100000000 });
            await time.increase(20 * 60)
            await expect(DutchAuction.claimTokens())
                .to.emit(DutchAuction, "AuctionEnd")
                .withArgs(await time.latest() + 1);
        })

        it("Should have all unsold tokens burned (owner ends the auction)", async function () {
            const { TubbysCoin, DutchAuction, addr1 } = await loadFixture(deployAuctionFixture);
            await DutchAuction.startAuction();
            await (DutchAuction.connect(addr1).bid(4000, { value: 100000000 }))
            await time.increase(20 * 60);
            await DutchAuction.claimTokens()
            expect(await TubbysCoin.totalSupply()).to.equal(4000);
        })

        it("Should drain DutchAuction of all tokens and ether", async function () {
            const { TubbysCoin, DutchAuction, addr1 } = await loadFixture(deployAuctionFixture);
            await DutchAuction.startAuction();
            await (DutchAuction.connect(addr1).bid(4000, { value: 100000000 }))
            await time.increase(20 * 60);
            await DutchAuction.connect(addr1).claimTokens();
            expect(await ethers.provider.getBalance(DutchAuction.address)).to.equal(0);
            expect(await TubbysCoin.balanceOf(DutchAuction.address)).to.equal(0);
        })
    })


    describe("Claiming Tokens", function () {
        it("Should reject claims if auction hasn't ended", async function () {
            const { DutchAuction, addr1 } = await loadFixture(deployAuctionFixture);
            await DutchAuction.startAuction();
            await DutchAuction.connect(addr1).bid(2500, { value: 100000000 });
            await expect(DutchAuction.connect(addr1).claimTokens())
                .to.be.revertedWith("Wrong stage of Dutch Auction")
        })

        it("Should be able to claim tokens & final price based on last price of tokens sold", async function () {
            const { TubbysCoin, DutchAuction, addr1, addr2 } = await loadFixture(deployAuctionFixture);
            await DutchAuction.startAuction();
            await DutchAuction.connect(addr1).bid(2500, { value: 100000000 });
            await DutchAuction.connect(addr2).bid(2500, { value: 100000000 });
            await expect(
                DutchAuction.connect(addr1).claimTokens()
            ).to.changeTokenBalances(TubbysCoin, [DutchAuction.address, addr1], [-2500, 2500])
                .to.emit(DutchAuction, "RefundEther").withArgs(addr1.address, 2500);
            await expect(
                DutchAuction.connect(addr2).claimTokens()
            ).to.changeTokenBalances(TubbysCoin, [DutchAuction.address, addr2], [-2500, 2500])
                .to.emit(DutchAuction, "RefundEther").withArgs(addr2.address, 0);
        })

        it("Should allow claiming once auction timeouts & final price should be reserved price", async function () {
            const { TubbysCoin, DutchAuction, addr1 } = await loadFixture(deployAuctionFixture);
            await DutchAuction.startAuction();
            await (DutchAuction.connect(addr1).bid(4000, { value: 100000000 }))
            await time.increase(20 * 60);
            await expect(DutchAuction.connect(addr1).claimTokens())
                .to.changeTokenBalances(TubbysCoin, [addr1], [4000])
                .to.emit(DutchAuction, "RefundEther").withArgs(addr1.address, (1999 - 1000) * 4000);
        })
    })
});