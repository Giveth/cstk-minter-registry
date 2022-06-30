// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.5.17;

/// @title IMinter
/// @notice Token minter interface
contract IMinter {
    //// ADMIN FUNCTIONS:

    /// @notice Change the address of the DAO that mints the tokens.
    /// @dev Must be called by an Admin account
    /// @param dao The new DAO contract address
    function changeDAOContract(address dao) external;

    /// @notice Change the address of the token contract.
    /// @dev Must be called by an Admin account.
    /// @param token The new token contract address
    function changeTokenContract(address token) external;

    /// @notice Change the address of the Registry.
    /// @dev Must be called by an Admin account
    /// @param registry The new Registry contract address
    function changeRegistry(address registry) external;

    /// @notice Set the ratio (numerator/denominator) used for minting calculation.
    /// @dev Can only be called by an Admin account.
    /// @param _numerator The ratio numerator
    /// @param _denominator The ratio denominator
    function setRatio(uint256 _numerator, uint256 _denominator) external;

    /// @notice Set the membership dues that need to be donated to actvate a membership.
    /// @dev Can only be called by an Admin account.
    /// @param amount The amount to set the new dues to
    function setMembershipDuesuint256 amount) external;

    /// @notice Bridge a donation transaction to the minter contract.
    ///
    /// The donation will call ethe underlying mnt function.
    ///
    /// @dev Cano only be called by an Admin account.
    function bridgeDonation(
        address sender,
        uint256 amount,
        string calldata homeTX
    ) external;

    //// VIEW FUNCTIONS:

    /// @notice Returns the value of the nominator used by the mint ratio.
    /// @return The value of the nominator
    function numerator() external view returns (uint256);

    /// @notice Returns the value of the denominator used by the mint ratio.
    /// @return The value of the denominator
    function denominator() external view returns (uint256);

    /// @notice Returns the value of the mint ratio calculated as fixed point division of NUMERATOR/DENOMINATOR.
    /// @return The calculated value of the ratio
    function ratio() external view returns (uint256);

    /// @notice Returns the current membership dues.
    /// @return The membership dues
    function membershipDues() external view returns (uint256);

    /// @notice Returns the address of the DAO contract.
    /// @return The address of the DAO contract
    function dao() external view returns (address);

    /// @notice Returns the address of the registry contract.
    /// @return The address of the registry contract
    function registry() external view returns (address);

    /// @notice Returns the address of the token cotnract.
    /// @return The address of the token contract
    function token() external view returns (address);

    //// EVENTS:

    /// @dev Event emitted when a donation is bridged.
    /// @param sender The account that sent the donation
    /// @param amount The amount donated
    /// @param homeTX The transaction being bridged
    event DonationBridged(address indexed sender, uint256 amount, string homeTX);

    /// @dev Event emitted when the mint ratio is changed
    /// @param nominator The new nominator value
    /// @param denominator The new denominator value
    event RatioChanged(uint256 nominator, uint256 denominator);

    /// @dev Event emitted when the mebership dues are changed.
    /// @param amount The new memebership dues
    /// @param admin The admin account that made the change
    event MembershipDuesChanged(uint256 amount, address admin);

    /// @dev Event emitted when the DAO contract is changed
    /// @param daoContract The address of the new DAO contract
    /// @param admin The admin account that made the change
    event DAOContractChanged(address daoContract, address admin);

    /// @dev Event emitted when the token contract is changed
    /// @param tokenContract The address of the new Token contract
    /// @param admin The admin account that made the change
    event TokenContractChanged(address tokenContract, address admin);

    /// @dev Event emitted when the Registry contract is changed
    /// @param registryContract The address of the new Registry contract
    /// @param admin The admin account that made the change
    event RegistryContractChanged(address registryContract, address admin);
}
