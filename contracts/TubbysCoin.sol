// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TubbysCoin is ERC20Burnable, Ownable {
    constructor(uint256 initialSupply) ERC20("TubbyCoin", "TUBBY") Ownable() {
        _mint(owner(), initialSupply);
    }
}
