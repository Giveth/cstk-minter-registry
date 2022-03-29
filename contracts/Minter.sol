// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.5.17;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/math/SafeMath.sol';
import '@openzeppelin/contracts/utils/Address.sol';

import './interfaces/IMinter.sol';
import './interfaces/IMintable.sol';
import './registry/Registry.sol';
import './registry/AdminRole.sol';

contract Minter is IMinter, AdminRole {
    using Address for address payable;
    using SafeMath for uint256;

    uint256 private constant MAX_TRUST_DENOMINATOR = 10000000;

    Registry internal registry;
    IERC20 internal cstkToken;
    IMintable internal dao;

    address public authorizedKey; // NOTE: use of this storage slot is reserved

    uint256 public numerator;
    uint256 public denominator;

    address payable public collector;

    constructor(
        address[] memory _authorizedKeys,
        address _daoAddress,
        address _registryAddress,
        address _cstkTokenAddress
    ) public AdminRole(_authorizedKeys) {
        dao = IMintable(_daoAddress);
        registry = Registry(_registryAddress);
        cstkToken = IERC20(_cstkTokenAddress);
    }

    function setRatio(uint256 _numerator, uint256 _denominator) external onlyAdmin {
        numerator = _numerator;
        denominator = _denominator;
        emit RatioChanged(_numerator, _denominator);
    }

    function mint(address recipient, uint256 toMint) external onlyAdmin {
        _mint(recipient, toMint);
        emit Mint(recipient, toMint);
    }

    function _mint(address recipient, uint256 toMint) internal {
        // Determine the maximum supply of the CSTK token.
        uint256 totalSupply = cstkToken.totalSupply();

        // Get the max trust amount for the recipient acc from the Registry.
        uint256 maxTrust = registry.getMaxTrust(recipient);

        // Get the current CSTK balance of the recipient account.
        uint256 recipientBalance = cstkToken.balanceOf(recipient);

        // It's activating membership too
        if (recipientBalance == 0) {
            uint256 pendingBalance = registry.getPendingBalance(recipient);
            toMint = toMint + pendingBalance;
            if (pendingBalance != 0) {
                registry.clearPendingBalance(recipient);
            }
        }

        // The recipient cannot receive more than the following amount of tokens:
        // maxR := maxTrust[recipient] * TOTAL_SUPPLY / 10000000.
        uint256 maxToReceive = maxTrust.mul(totalSupply).div(MAX_TRUST_DENOMINATOR);

        // If the recipient is to receive more than this amount of tokens, reduce
        // mint the difference.
        if (maxToReceive <= recipientBalance.add(toMint)) {
            toMint = maxToReceive.sub(recipientBalance);
        }

        // If there is anything to mint, mint it to the recipient.
        if (toMint > 0) {
            dao.mint(recipient, toMint);
        }
    }

    function pay(address beneficiary) external payable {
        // Get the amount to mint based on the numerator/denominator.
        uint256 toMint = msg.value.mul(numerator).div(denominator);
        // _mint(beneficiary, toMint);

        collector.sendValue(msg.value);

        emit PaymentReceived(beneficiary, toMint);
    }

    function changeCollector(address payable _collector) external onlyAdmin {
        require(_collector != address(0), 'Collector cannot be zero address');
        collector = _collector;
        emit CollectorChanged(_collector, msg.sender);
    }

    function changeDAOContract(address daoContract) external onlyAdmin {
        require(daoContract != address(0), 'DAO cannot be address zero');
        dao = IMintable(daoContract);
        emit DAOContractChanged(daoContract, msg.sender);
    }

    function changeCSTKTokenContract(address cstkTokenContract) external onlyAdmin {
        require(cstkTokenContract != address(0), 'CSTK token cannot be zero address');
        cstkToken = IERC20(cstkTokenContract);
        emit CSTKTokenContractChanged(cstkTokenContract, msg.sender);
    }

    function changeRegistry(address registryContract) external onlyAdmin {
        require(registryContract != address(0), 'Registry cannot be zero address');
        registry = Registry(registryContract);
        emit RegistryContractChanged(registryContract, msg.sender);
    }
}
