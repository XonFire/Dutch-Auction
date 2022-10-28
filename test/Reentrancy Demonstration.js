const { ethers } = require("hardhat");
const { expect } = require("chai");
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");
require("@nomicfoundation/hardhat-chai-matchers");

describe("Reentrancy Attack Demonstration", function () {
    async function deployContractsFixture() {
        const TubbysCoinFactory = await ethers.getContractFactory("TubbysCoin");
        const [owner, addr1, addr2] = await ethers.getSigners();
        const TubbysCoin = await TubbysCoinFactory.deploy(5000);
        await TubbysCoin.deployed();
        const VulnerableFactory = await ethers.getContractFactory("Vulnerable");
        // Price of TubbyCoin will be start at 1 eth and drop to 1 wei at end of Auction
        const Vulnerable = await VulnerableFactory.deploy(TubbysCoin.address, ethers.utils.parseEther("1"), 1, ethers.utils.parseEther("0.001"));
        await Vulnerable.deployed();
        await TubbysCoin.transfer(Vulnerable.address, 5000);
        const AttackFactory = await ethers.getContractFactory("Attack");
        const Attack = await AttackFactory.deploy(Vulnerable.address);

        return { TubbysCoin, Vulnerable, Attack, owner, addr1, addr2 };
    }

    async function beforeReentrancyAttackFixture() {
        const { TubbysCoin, Vulnerable, Attack, owner, addr1, addr2 } = await loadFixture(deployContractsFixture);
        await Vulnerable.startAuction();
        // addr2 is the thief
        await Attack.connect(addr2).bid(1, { value: ethers.utils.parseEther("1") });
        // we'll be stealing money from addr1
        await (Vulnerable.connect(addr1).bid(2000, { value: ethers.utils.parseEther("2000") }));
        return { TubbysCoin, Vulnerable, Attack, owner, addr1, addr2 }
    }

    describe("Reentrancy Attack", function () {
        it("Should have Attack contract having 0 ETH balance", async function () {
            const { Attack } = await loadFixture(beforeReentrancyAttackFixture);
            expect(await ethers.provider.getBalance(Attack.address)).to.be.below(ethers.utils.parseEther("1"));
        })

        it("Should have Attack contract draining ETH in Vulnerable contract", async function () {
            const { Attack, addr2 } = await loadFixture(beforeReentrancyAttackFixture);
            await time.increase(20 * 60);
            await Attack.connect(addr2).attack();
            expect(await ethers.provider.getBalance(Attack.address)).to.be.above(ethers.utils.parseEther("1"));
        })
    })
});