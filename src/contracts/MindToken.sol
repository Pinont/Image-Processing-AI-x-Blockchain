// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title MINDToken
 * @dev Simple ERC20 Token for the MIND ecosystem.
 */
contract MindToken {
    string public name = "Decentral Mind Token";
    string public symbol = "MIND";
    uint8 public decimals = 18;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(uint256 initialSupply) {
        totalSupply = initialSupply * (10 ** uint256(decimals));
        balanceOf[msg.sender] = totalSupply;
        emit Transfer(address(0), msg.sender, totalSupply);
    }

    function transfer(address to, uint256 value) public returns (bool success) {
        require(balanceOf[msg.sender] >= value, "Insufficient balance");
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint256 value) public returns (bool success) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) public returns (bool success) {
        require(balanceOf[from] >= value, "Insufficient balance");
        require(allowance[from][msg.sender] >= value, "Allowance exceeded");
        balanceOf[from] -= value;
        balanceOf[to] += value;
        allowance[from][msg.sender] -= value;
        emit Transfer(from, to, value);
        return true;
    }

    // Mint function for the owner/faucet (Simplified for hackathon/demo)
    function mint(address to, uint256 amount) public {
        // In real world, add onlyOwner modifier
        uint256 scaledAmount = amount * (10 ** uint256(decimals));
        totalSupply += scaledAmount;
        balanceOf[to] += scaledAmount;
        emit Transfer(address(0), to, scaledAmount);
    }

    // Burn function for spending tokens
    function burn(uint256 amount) public {
        uint256 scaledAmount = amount * (10 ** uint256(decimals));
        require(balanceOf[msg.sender] >= scaledAmount, "Insufficient balance to burn");
        balanceOf[msg.sender] -= scaledAmount;
        totalSupply -= scaledAmount;
        emit Transfer(msg.sender, address(0), scaledAmount);
    }
}
