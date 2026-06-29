// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {GradeLedger} from "../src/GradeLedger.sol";

contract GradeLedgerTest is Test {
    GradeLedger ledger;
    address owner = address(0xA11CE);
    address stranger = address(0xB0B);

    bytes32 constant H1 = keccak256("snapshot-1");
    bytes32 constant H2 = keccak256("snapshot-2");

    function setUp() public {
        ledger = new GradeLedger(owner);
    }

    function test_constructor_setsOwner() public view {
        assertEq(ledger.owner(), owner);
    }

    function test_record_storesHashAndDate() public {
        vm.prank(owner);
        ledger.recordSnapshot(20260630, H1);

        assertEq(ledger.hashByDate(20260630), H1);
        assertEq(ledger.count(), 1);
        (uint32 d, bytes32 h) = ledger.latest();
        assertEq(d, 20260630);
        assertEq(h, H1);
    }

    function test_record_multiple_latestTracksOrder() public {
        vm.startPrank(owner);
        ledger.recordSnapshot(20260630, H1);
        ledger.recordSnapshot(20260707, H2);
        vm.stopPrank();

        assertEq(ledger.count(), 2);
        (uint32 d, bytes32 h) = ledger.latest();
        assertEq(d, 20260707);
        assertEq(h, H2);
    }

    function test_verify() public {
        vm.prank(owner);
        ledger.recordSnapshot(20260630, H1);
        assertTrue(ledger.verify(20260630, H1));
        assertFalse(ledger.verify(20260630, H2));
        assertFalse(ledger.verify(20270101, H1));
    }

    function test_revert_whenNotOwner() public {
        vm.prank(stranger);
        vm.expectRevert(GradeLedger.NotOwner.selector);
        ledger.recordSnapshot(20260630, H1);
    }

    function test_revert_whenAlreadyRecorded() public {
        vm.startPrank(owner);
        ledger.recordSnapshot(20260630, H1);
        vm.expectRevert(abi.encodeWithSelector(GradeLedger.AlreadyRecorded.selector, uint32(20260630)));
        ledger.recordSnapshot(20260630, H2); // same date, must fail — immutable
        vm.stopPrank();
    }

    function test_revert_onZeroHash() public {
        vm.prank(owner);
        vm.expectRevert(GradeLedger.ZeroHash.selector);
        ledger.recordSnapshot(20260630, bytes32(0));
    }

    function test_transferOwnership() public {
        vm.prank(owner);
        ledger.transferOwnership(stranger);
        assertEq(ledger.owner(), stranger);

        vm.prank(stranger);
        ledger.recordSnapshot(20260630, H1);
        assertEq(ledger.hashByDate(20260630), H1);
    }

    function test_revert_transferToZero() public {
        vm.prank(owner);
        vm.expectRevert(GradeLedger.ZeroAddress.selector);
        ledger.transferOwnership(address(0));
    }
}
