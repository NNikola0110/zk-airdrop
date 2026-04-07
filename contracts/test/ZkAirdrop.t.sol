// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Test, console} from "forge-std/Test.sol";
import {ZkAirdrop} from "../src/ZkAirdrop.sol";

contract ZkAirdropTest is Test {
    function testContractDeployment() public {
        // Basic deployment test - uses address(0) as placeholder for Semaphore
        // Full integration tests require Semaphore contract deployment
        ZkAirdrop airdrop = new ZkAirdrop(address(1));
        assertEq(address(airdrop.semaphore()), address(1));
        assertEq(airdrop.campaignCount(), 0);
    }
}
