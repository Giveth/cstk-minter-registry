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
/// @notice Token minter implementation
/// @author Giveth developers
contract Minter is IMinter, AdminRole {
    using Address for address payable;
    using SafeMath for uint256;

    uint256 private constant MAX_TRUST_DENOMINATOR = 10000000;

    //// STORAGE:

    address internal registryContract;
    address internal tokenContract;
    address internal tokenManagerContract;

    uint256 internal membershipDuesVal;

    uint256 internal numeratorVal;
    uint256 internal denominatorVal;

    //// CONSTRUCTOR:

    constructor(
        address[] memory authorizedKeys,
        address tokenManager,
        address registry,
        address token
    ) public AdminRole(authorizedKeys) {
        tokenManagerContract = tokenManager;
        registryContract = registry;
        tokenContract = token;
    }

    //// ADMIN FUNCTIONS:

    function changeTokenManagerContract(address tokenManager) external onlyAdmin {
        require(tokenManager != address(0), 'Token Manager cannot be zero address');
        tokenManagerContract = tokenManager;
        emit TokenManagerContractChanged(tokenManagerContract, msg.sender);
    }

    function changeTokenContract(address token) external onlyAdmin {
        require(token != address(0), 'Token cannot be zero address');
        tokenContract = token;
        emit TokenContractChanged(tokenContract, msg.sender);
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

    function setMembershipDues(uint256 amount) external onlyAdmin {
        membershipDuesVal = amount;
        emit MembershipDuesChanged(amount, msg.sender);
    }

    /// EXTERNAL FUNCTIONS:

    function bridgeDonation(
        address sender,
        uint256 amount,
        string calldata homeTX
    ) external onlyAdmin {
        _mint(sender, amount);
        emit DonationBridged(sender, amount, homeTX);
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

    function membershipDues() external view returns (uint256) {
        return membershipDuesVal;
    }

    function tokenManager() external view returns (address) {
        return tokenManagerContract;
    }

    function token() external view returns (address) {
        return tokenContract;
    }

    function registry() external view returns (address) {
        return registryContract;
    }

    /// INTERNAL FUNCTIONS:

    function _mint(address recipient, uint256 amount) internal {
        uint256 toMint;

        // Get the max trust amount for the recipient acc from the Registry.
        uint256 maxTrust = Registry(registryContract).getMaxTrust(recipient);

        // Get the current token balance of the recipient account.
        uint256 recipientBalance = IERC20(tokenContract).balanceOf(recipient);

        // Check if we are not an active member:
        // Active members must have token balance.
        if (recipientBalance == 0) {
            // If we are not an active member, check if our application is approved.
            // Application is approved if we have a maxTrust score.
            if (maxTrust > 0) {
                // Check if the deposit is greather than membership dues.
                if (amount >= membershipDuesVal) {
                    // If we did pay membership dues, activate the membership:
                    // Add any pending balance to the mint amount and clear the value.
                    uint256 pendingBalance = Registry(registryContract).getPendingBalance(recipient);

                    // Mint amount: donation * ratio + pending balance.
                    toMint = amount.mul(numeratorVal).div(denominatorVal) + pendingBalance;

                    // Clear the pending balance.
                    if (pendingBalance > 0) {
                        Registry(registryContract).clearPendingBalance(recipient);
                    }
                }
            }
            // If we don't have a membership application, or we did not donate enough to cover dues
            // there is nothing else to do.
            return;
        } else {
            // Amount to mint is the donation * ratio.
            toMint = amount.mul(numeratorVal).div(denominatorVal);
        }

        // Determine the maximum supply of the token.
        uint256 totalSupply = IERC20(tokenContract).totalSupply();

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
            IMintable(tokenManagerContract).mint(recipient, toMint);
        }
    }
}
