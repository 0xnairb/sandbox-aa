//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USDC", "mUSDC") {
        // mint 1000 tokens to Dev1,2,3 & owner
        _mint(address(0xe396434D1C5705D6A632d42b791E036974047FB4), 1000 ether);
        _mint(address(0x071B4B7115E861eF5ce0325137834c81d311A0BF), 1000 ether);
        _mint(address(0x9484C071a122D9CbDB9132210feA5956Bd80c00C), 1000 ether);
        _mint(msg.sender, 1000 ether);
    }
}