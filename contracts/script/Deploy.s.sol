// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Script, console} from "forge-std/Script.sol";
import {ZkAirdrop} from "../src/ZkAirdrop.sol";

contract DeployScript is Script {
    function run() external {
        // Semaphore contract address (set for your target network)
        address semaphore = vm.envAddress("SEMAPHORE_ADDRESS");

        vm.startBroadcast();

        ZkAirdrop zkAirdrop = new ZkAirdrop(semaphore);
        console.log("ZkAirdrop deployed at:", address(zkAirdrop));

        vm.stopBroadcast();
    }
}
