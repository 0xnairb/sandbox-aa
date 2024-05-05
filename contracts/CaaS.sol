//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract ContractAsAService {

    IERC20 private currency_;
    mapping (string => uint256) private services_;
    mapping (address => uint256) private feeUsed_;

    constructor() {}

    function getCurrency() public view returns (address) {
        return address(currency_);
    }

    function getServiceFee(string memory _service) public view returns (uint256) {
        return services_[_service];
    }

    function getFeeUsed(address _sender) public view returns (uint256) {
        return feeUsed_[_sender];
    }

    function setCurrency(IERC20 _currency) external {
        currency_ = _currency;
    }

    function registerService(string memory _name, uint256 _fee) external {
        services_[_name] = _fee;
    }

    function executeService(string memory _service) external {
        uint256 serviceFee = services_[_service];
        require(IERC20(currency_).transferFrom(msg.sender, address(this), serviceFee), "Insufficient fee amount");
        feeUsed_[msg.sender] += serviceFee;
    }
}