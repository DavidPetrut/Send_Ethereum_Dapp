// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TransactionLogger {
    event EtherTransfer(address indexed _from, address indexed _to, uint _value);

    function sendEther(address payable _to) external payable {
        require(msg.value > 0, "Send some ether");
        _to.transfer(msg.value);
        emit EtherTransfer(msg.sender, _to, msg.value);
    }
}
