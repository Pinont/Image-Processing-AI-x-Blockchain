// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title IdentityRegistry
 * @dev Stores the link between a Wallet Address and an IPFS CID containing the user's Identity & Data.
 */
contract IdentityRegistry {
    // Mapping from User Wallet Address -> IPFS CID (string)
    mapping(address => string) private identityCIDs;

    // Event emitted when a user updates their identity
    event IdentityUpdated(address indexed user, string cid);

    /**
     * @dev Updates the IPFS CID for the caller.
     * @param _cid The new IPFS CID string.
     */
    function updateIdentity(string memory _cid) public {
        identityCIDs[msg.sender] = _cid;
        emit IdentityUpdated(msg.sender, _cid);
    }

    /**
     * @dev Returns the IPFS CID for a given user.
     * @param _user The address of the user.
     * @return The IPFS CID string.
     */
    function getIdentity(address _user) public view returns (string memory) {
        return identityCIDs[_user];
    }
}
