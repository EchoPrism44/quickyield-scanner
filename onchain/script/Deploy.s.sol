// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {GradeLedger} from "../src/GradeLedger.sol";

/// @notice Deploys GradeLedger. The deployer (PRIVATE_KEY) becomes the initial
///         owner / recorder unless LEDGER_OWNER is set to a different address.
///
/// Usage (testnet):
///   forge script script/Deploy.s.sol --rpc-url base_sepolia --broadcast --verify
/// Usage (mainnet):
///   forge script script/Deploy.s.sol --rpc-url base --broadcast --verify
contract Deploy is Script {
    function run() external returns (GradeLedger ledger) {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);
        address ledgerOwner = vm.envOr("LEDGER_OWNER", deployer);

        vm.startBroadcast(pk);
        ledger = new GradeLedger(ledgerOwner);
        vm.stopBroadcast();

        console2.log("GradeLedger deployed at:", address(ledger));
        console2.log("Owner / recorder:", ledgerOwner);
    }
}
