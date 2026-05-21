// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title FieldProofRegistry
/// @notice Publishes accepted FieldProof results as agent-readable onchain proof records.
contract FieldProofRegistry {
    struct ProofRecord {
        uint256 requestId;
        bytes32 resultHash;
        bytes32 evidenceBundleHash;
        string city;
        string signal;
        string verifiedValue;
        uint16 confidenceBps;
        uint64 recordedAt;
    }

    address public owner;
    address public publisher;
    uint256 public nextRecordId = 1;

    mapping(uint256 => ProofRecord) public records;

    event ProofRecordPublished(
        uint256 indexed recordId,
        uint256 indexed requestId,
        bytes32 resultHash,
        string city,
        string signal,
        string verifiedValue,
        uint16 confidenceBps
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "NOT_OWNER");
        _;
    }

    modifier onlyPublisher() {
        require(msg.sender == publisher, "NOT_PUBLISHER");
        _;
    }

    constructor(address initialPublisher) {
        owner = msg.sender;
        publisher = initialPublisher;
    }

    function setPublisher(address newPublisher) external onlyOwner {
        require(newPublisher != address(0), "ZERO_PUBLISHER");
        publisher = newPublisher;
    }

    function publishRecord(
        uint256 requestId,
        bytes32 resultHash,
        bytes32 evidenceBundleHash,
        string calldata city,
        string calldata signal,
        string calldata verifiedValue,
        uint16 confidenceBps
    ) external onlyPublisher returns (uint256 recordId) {
        require(resultHash != bytes32(0), "EMPTY_RESULT");
        require(evidenceBundleHash != bytes32(0), "EMPTY_EVIDENCE");
        require(confidenceBps <= 10_000, "BAD_CONFIDENCE");

        recordId = nextRecordId++;
        records[recordId] = ProofRecord({
            requestId: requestId,
            resultHash: resultHash,
            evidenceBundleHash: evidenceBundleHash,
            city: city,
            signal: signal,
            verifiedValue: verifiedValue,
            confidenceBps: confidenceBps,
            recordedAt: uint64(block.timestamp)
        });

        emit ProofRecordPublished(
            recordId,
            requestId,
            resultHash,
            city,
            signal,
            verifiedValue,
            confidenceBps
        );
    }
}
