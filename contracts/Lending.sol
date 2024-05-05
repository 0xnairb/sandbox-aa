//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Lending {

    IERC20 private currency_;
    mapping (address => uint256) private balances_;

    constructor(IERC20 _currency) {
        currency_ = _currency;
    }

    function deposit(uint256 _amount) external {
        require(currency_.transferFrom(msg.sender, address(this), _amount), "Failed to deposit");
        balances_[msg.sender] += _amount;
    }

    function withdraw() external {
        uint256 _withdrawAmount = balanceOf();
        balances_[msg.sender] = 0;
        require(currency_.transfer(msg.sender, _withdrawAmount), "Failed to withdraw");
    }

    function balanceOf(address _sender) public view returns (uint256) {
        return balances_[_sender];
    }

    function balanceOf() public view returns (uint256) {
        return balanceOf(msg.sender);
    }
}