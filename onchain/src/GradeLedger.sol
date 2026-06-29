// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title QuickYield GradeLedger
/// @notice An on-chain anchor for QuickYield's public Safety-Grade ledger.
///         Each week, the QuickYield GitHub Action grades every live DeFi pool
///         and commits a dated snapshot (`data/grades/<date>.json`) to the repo.
///         The keccak256 hash of that file is recorded here, on Base, so the
///         record is cryptographically verifiable and tamper-proof: a snapshot
///         can be written exactly once and can never be altered or deleted.
/// @dev    Holds no funds. The only privileged action is recording a hash.
///         Even if the recorder key leaks, the worst case is spurious dates —
///         existing entries are immutable and no value is at risk.
contract GradeLedger {
    /// @notice Emitted when a snapshot hash is anchored.
    /// @param date  Snapshot date as a packed integer, YYYYMMDD (e.g. 20260630).
    /// @param hash  keccak256 of the committed snapshot JSON file bytes.
    /// @param index Sequential index of this snapshot (0-based).
    event SnapshotRecorded(uint32 indexed date, bytes32 hash, uint256 index);

    /// @notice Emitted when ownership is transferred.
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    error NotOwner();
    error AlreadyRecorded(uint32 date);
    error ZeroHash();
    error ZeroAddress();

    /// @notice The account allowed to record snapshots (the CI recorder wallet).
    address public owner;

    /// @notice snapshot hash by date (YYYYMMDD). Zero means "not recorded".
    mapping(uint32 => bytes32) public hashByDate;

    /// @notice All recorded dates, in the order they were anchored.
    uint32[] public dates;

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor(address initialOwner) {
        if (initialOwner == address(0)) revert ZeroAddress();
        owner = initialOwner;
        emit OwnershipTransferred(address(0), initialOwner);
    }

    /// @notice Anchor one weekly snapshot. Each date can be written only once.
    /// @param date YYYYMMDD packed integer (e.g. 20260630).
    /// @param hash keccak256 of the snapshot JSON file bytes.
    function recordSnapshot(uint32 date, bytes32 hash) external onlyOwner {
        if (hash == bytes32(0)) revert ZeroHash();
        if (hashByDate[date] != bytes32(0)) revert AlreadyRecorded(date);
        hashByDate[date] = hash;
        dates.push(date);
        emit SnapshotRecorded(date, hash, dates.length - 1);
    }

    /// @notice Number of snapshots anchored so far.
    function count() external view returns (uint256) {
        return dates.length;
    }

    /// @notice The most recently anchored snapshot.
    /// @return date The snapshot date (YYYYMMDD), or 0 if none recorded.
    /// @return hash The snapshot hash, or zero if none recorded.
    function latest() external view returns (uint32 date, bytes32 hash) {
        uint256 n = dates.length;
        if (n == 0) return (0, bytes32(0));
        date = dates[n - 1];
        hash = hashByDate[date];
    }

    /// @notice Verify a candidate hash matches the anchored hash for a date.
    function verify(uint32 date, bytes32 candidate) external view returns (bool) {
        return hashByDate[date] != bytes32(0) && hashByDate[date] == candidate;
    }

    /// @notice Transfer the recorder role (e.g. to rotate the CI key).
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}
