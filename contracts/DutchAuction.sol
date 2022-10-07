// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "hardhat/console.sol";

contract TubbysCoin is ERC20Burnable {
    address public owner;

    constructor(uint initialSupply) ERC20("TubbyCoin", "TUBBY") {
        owner = msg.sender;
        _mint(owner, initialSupply);
    }
}

contract DutchAuction {
    event BidSubmission(address indexed bidder, uint quntity, uint amount);

    event AuctionEnd(uint endTime);

    event RefundEther(address indexed bidder, uint refund);

    address public owner;

    bool internal locked;
    uint finalPrice;
    uint immutable reservedPrice;
    uint immutable totalTokens;
    uint totalSold;
    uint public startTime;
    uint public endTime;
    uint immutable discountRate;
    uint immutable startingPrice;
    uint private constant DURATION = 20 minutes;
    mapping(address => uint) public bids;
    mapping(address => uint) public orders;
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

    modifier isOwner() {
        require(msg.sender == owner, "Not owner of contract");
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
        uint _startingPrice,
        uint _reservedPrice,
        uint _discountRate
    ) {
        require(_token != address(0), "Invalid address");
        owner = msg.sender;
        token = ERC20Burnable(_token);
        stage = Stages.init;
        reservedPrice = _reservedPrice;
        startingPrice = _startingPrice;
        discountRate = _discountRate;
        startTime = block.timestamp;
        endTime = block.timestamp + DURATION;
        totalTokens = token.totalSupply();
    }

    function startAuction() public isOwner isStage(Stages.init) {
        require(
            token.allowance(owner, address(this)) == totalTokens,
            "Auction is not approved to sell specificed amount of tokens"
        );
        stage = Stages.start;
        startTime = block.timestamp;
        endTime = block.timestamp + DURATION;
    }

    function calcTokenPrice() public view returns (uint) {
        uint timeElapsed = block.timestamp - startTime;
        uint discountedPrice = startingPrice - discountRate * timeElapsed;
        if (reservedPrice > discountedPrice) discountedPrice = reservedPrice;
        // console.log("timeElasped is %s", timeElapsed);
        // console.log("Discounted Price is %s", discountedPrice);
        return discountedPrice;
    }

    function bid(uint _quantity)
        external
        payable
        hasEnded
        isStage(Stages.start)
        reentrancyGuard
        returns (uint quantity)
    {
        quantity = _quantity;
        if (quantity > totalTokens - totalSold)
            quantity = totalTokens - totalSold;
        address payable bidder = payable(msg.sender);
        uint amount = msg.value;
        uint cost = calcTokenPrice() * quantity;
        require(msg.value >= cost, "Insufficient ETH for bid");
        bids[bidder] += cost;
        orders[bidder] += quantity;
        console.log("bidder", bidder);
        totalSold += quantity;
        // refund excess ETH
        uint refund = 0;
        if (amount > cost) {
            refund = amount - cost;
            // console.log("Quantity", quantity);
            // console.log("Cost", cost);
            // console.log("Refund Amount %s", refund);
            bidder.transfer(refund);
            emit RefundEther(bidder, refund);
        }
        if (totalSold >= totalTokens) endAuction();
        emit BidSubmission(bidder, quantity, cost);
    }

    function endAuction() private {
        stage = Stages.end;
        endTime = block.timestamp;
        finalPrice = calcTokenPrice();
        // Burn excess token
        token.burnFrom(owner, totalTokens - totalSold);
        // console.log("AUCTION SHOULD HAVE ENDED");
        emit AuctionEnd(endTime);
    }

    function claimTokens() public isStage(Stages.end) reentrancyGuard {
        // console.log("hello!");
        address payable receiver = payable(msg.sender);
        uint tokenCount = orders[receiver];
        uint refund = bids[receiver] - tokenCount * finalPrice;
        // console.log("refund", refund);
        orders[receiver] = 0;
        bids[receiver] = 0;
        token.transferFrom(owner, receiver, tokenCount);
        receiver.transfer(refund);
        emit RefundEther(receiver, refund);
    }
}
