// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.5.17;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/math/SafeMath.sol';
import '@openzeppelin/contracts/utils/Address.sol';

import './interfaces/IMinter.sol';
import './interfaces/IMintable.sol';
import './registry/Registry.sol';
import './registry/AdminRole.sol';

/// @title Minter
/// @notice CSTK token minter implementation
/// @author Giveth developers
contract Minter is IMinter, AdminRole {
    using Address for address payable;
    using SafeMath for uint256;

    uint256 private constant MAX_TRUST_DENOMINATOR = 10000000;

    //// STORAGE:

    address internal registryContract;
    address internal tokenContract;
    address internal daoContract;

    uint256 internal numeratorVal;
    uint256 internal denominatorVal;

    //// CONSTRUCTOR:

    constructor(
        address[] memory authorizedKeys,
        address dao,
        address registry,
        address cstkToken
    ) public AdminRole(authorizedKeys) {
        daoContract = dao;
        registryContract = registry;
        tokenContract = cstkToken;
    }

    //// ADMIN FUNCTIONS:

    function changeDAOContract(address dao) external onlyAdmin {
        require(dao != address(0), 'DAO cannot be address zero');
        daoContract = dao;
        emit DAOContractChanged(daoContract, msg.sender);
    }

    function changeCSTKTokenContract(address cstkToken) external onlyAdmin {
        require(cstkToken != address(0), 'CSTK token cannot be zero address');
        tokenContract = cstkToken;
        emit CSTKTokenContractChanged(tokenContract, msg.sender);
    }

    function changeRegistry(address registry) external onlyAdmin {
        require(registry != address(0), 'Registry cannot be zero address');
        registryContract = registry;
        emit RegistryContractChanged(registryContract, msg.sender);
    }

    function setRatio(uint256 numerator, uint256 denominator) external onlyAdmin {
        numeratorVal = numerator;
        denominatorVal = denominator;
        emit RatioChanged(numeratorVal, denominatorVal);
    }

    function mint(address recipient, uint256 toMint) external onlyAdmin {
        _mint(recipient, toMint);
        emit Mint(recipient, toMint);
    }

    //// EXTERNAL FUNCTIONS:

    function pay(address beneficiary) external payable {
        require(msg.value > 0, 'Cannot pay 0');

        // Get the amount to mint based on the numerator/denominator.
        uint256 toMint = msg.value.mul(numeratorVal).div(denominatorVal);
        _mint(beneficiary, toMint);

        emit PaymentReceived(beneficiary, msg.value);
    }

    //// VIEW FUNCTIONS:

    function numerator() external view returns (uint256) {
        return numeratorVal;
    }

    function denominator() external view returns (uint256) {
        return denominatorVal;
    }

    function ratio() external view returns (uint256) {
        return numeratorVal.div(denominatorVal);
    }

    function registry() external view returns (address) {
        return registryContract;
    }

    function dao() external view returns (address) {
        return daoContract;
    }

    function cstkToken() external view returns (address) {
        return tokenContract;
    }

    /// INTERNAL FUNCTIONS:

    function _mint(address recipient, uint256 toMint) internal {
        // Determine the maximum supply of the CSTK token.
        uint256 totalSupply = IERC20(tokenContract).totalSupply();

        // Get the max trust amount for the recipient acc from the Registry.
        uint256 maxTrust = Registry(registryContract).getMaxTrust(recipient);

        // Get the current CSTK balance of the recipient account.
        uint256 recipientBalance = IERC20(tokenContract).balanceOf(recipient);

        // It's activating membership too
        if (recipientBalance == 0) {
            uint256 pendingBalance = Registry(registryContract).getPendingBalance(recipient);
            toMint = toMint + pendingBalance;
            if (pendingBalance != 0) {
                Registry(registryContract).clearPendingBalance(recipient);
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
            IMintable(daoContract).mint(recipient, toMint);
        }
    }
}
