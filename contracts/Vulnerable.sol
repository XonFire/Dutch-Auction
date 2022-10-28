// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";
import "./TubbysCoin.sol";

contract Vulnerable is Ownable {
    event BidSubmission(
        address indexed bidder,
        uint256 quntity,
        uint256 amount
    );

    event AuctionEnd(uint256 endTime);

    event RefundEther(address indexed bidder, uint256 refund);

    bool internal locked;
    uint256 public finalPrice;
    uint256 public immutable reservedPrice;
    uint256 public immutable totalTokens;
    uint256 public totalSold;
    uint256 public startTime;
    uint256 public endTime;
    uint256 public immutable discountRate;
    uint256 public immutable startingPrice;
    uint256 private constant DURATION = 20 minutes;
    mapping(address => uint256) public bids;
    mapping(address => uint256) public orders;
    ERC20Burnable public token;
    Stages public stage;

    enum Stages {
        init,
        start,
        end
    }

    modifier isStage(Stages _stage) {
        require(stage == _stage, "Wrong stage of Dutch Auction");
        _;
    }

    modifier hasEnded() {
        if (stage == Stages.start && block.timestamp > endTime) endAuction();
        _;
    }

    modifier reentrancyGuard() {
        require(!locked);
        locked = true;
        _;
        locked = false;
    }

    constructor(
        address _token,
        uint256 _startingPrice,
        uint256 _reservedPrice,
        uint256 _discountRate
    ) Ownable() {
        require(_token != address(0), "Invalid address");
        token = ERC20Burnable(_token);
        stage = Stages.init;
        reservedPrice = _reservedPrice;
        startingPrice = _startingPrice;
        discountRate = _discountRate;
        startTime = block.timestamp;
        endTime = block.timestamp + DURATION;
        totalTokens = token.totalSupply();
    }

    function startAuction() public onlyOwner isStage(Stages.init) {
        require(
            token.balanceOf(address(this)) == totalTokens,
            "Auction is not approved to sell token total supply"
        );
        stage = Stages.start;
        startTime = block.timestamp;
        endTime = block.timestamp + DURATION;
    }

    function calcTokenPrice() public view returns (uint256) {
        uint256 timeElapsed = block.timestamp - startTime;
        uint256 discount = discountRate * timeElapsed;
        if (discount > startingPrice) discount = startingPrice;
        uint256 discountedPrice = startingPrice - discount;
        if (reservedPrice > discountedPrice) discountedPrice = reservedPrice;
        return discountedPrice;
    }

    function bid(uint256 _quantity)
        external
        payable
        hasEnded
        isStage(Stages.start)
        reentrancyGuard
        returns (uint256 quantity)
    {
        require(_quantity > 0, "Invalid bid");
        quantity = _quantity;
        if (quantity > totalTokens - totalSold)
            quantity = totalTokens - totalSold;
        assert(quantity > 0);
        address payable bidder = payable(msg.sender);
        uint256 amount = msg.value;
        uint256 cost = calcTokenPrice() * quantity;
        require(msg.value >= cost, "Insufficient ETH for bid");
        bids[bidder] += cost;
        orders[bidder] += quantity;
        totalSold += quantity;
        // refund excess ETH
        uint256 refund = 0;
        if (amount > cost) {
            refund = amount - cost;
            bidder.transfer(refund);
            emit RefundEther(bidder, refund);
        }
        if (totalSold >= totalTokens) endAuction();
        emit BidSubmission(bidder, quantity, cost);
    }

    function endAuction() private {
        assert(totalSold <= totalTokens);
        stage = Stages.end;
        finalPrice = calcTokenPrice();
        endTime = block.timestamp;
        token.burn(totalTokens - totalSold);
        address payable contractOwner = payable(owner());
        contractOwner.transfer(finalPrice * totalSold);
        emit AuctionEnd(endTime);
    }

    function claimTokens() public hasEnded isStage(Stages.end) {
        address payable receiver = payable(msg.sender);
        uint256 tokenCount = orders[receiver];
        uint256 refund = bids[receiver] - tokenCount * finalPrice;
        token.transfer(receiver, tokenCount);
        console.log("Refunding %d to %s", refund, msg.sender);
        receiver.call{value: refund}("");
        emit RefundEther(receiver, refund);
        orders[receiver] = 0;
        bids[receiver] = 0;
    }
}
