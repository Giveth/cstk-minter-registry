// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.5.17;

import '../Minter.sol';

contract TestNoopMinter is Minter {
    event NoopMinted(address beneficiary, uint256 amount);

    constructor(
        address[] memory authorizedKeys,
        address tokenManager,
        address registry,
        address token
    ) public Minter(authorizedKeys, tokenManager, registry, token) {}

    function _mint(address recipient, uint256 amount) internal {
        emit NoopMinted(recipient, amount);
    }
}
