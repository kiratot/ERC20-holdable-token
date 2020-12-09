// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.8.0;


interface IHERC20 {
    
    function holdFrom(string calldata holdId, address sender, address recipient, uint256 value) external returns (bool);
    
    function hold(string calldata holdId, address recipient, uint256 value) external returns (bool);
    
    function executeHold(string calldata holdId) external returns (bool);

    function removeHold(string calldata holdId) external returns (bool);
    
    function heldBalanceOf(address account) external view returns (uint256);
}

