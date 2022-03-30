// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.5.17;

import '../Minter.sol';

contract TestNoopMinter is Minter {
    event NoopMinted(address beneficiary, uint256 amount);

    constructor(
        address[] memory authorizedKeys,
        address dao,
        address registry,
        address cstkToken
    ) public Minter(authorizedKeys, dao, registry, cstkToken) {}

    function _mint(address recipient, uint256 toMint) internal {
        emit NoopMinted(recipient, toMint);
    }
}
