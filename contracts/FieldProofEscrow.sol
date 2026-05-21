// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function transfer(address to, uint256 value) external returns (bool);
}

/// @title FieldProofEscrow
/// @notice Escrows stablecoin rewards for local stablecoin reality proofs.
contract FieldProofEscrow {
    enum RequestStatus {
        Open,
        Closed,
        Cancelled
    }

    enum SubmissionStatus {
        Pending,
        Approved,
        Rejected
    }

    struct ProofRequest {
        address requester;
        address token;
        uint256 rewardPerProof;
        uint256 confirmationsNeeded;
        uint256 deadline;
        uint256 fundedBalance;
        uint256 approvedCount;
        RequestStatus status;
        bytes32 metadataHash;
    }

    struct Submission {
        address contributor;
        bytes32 evidenceHash;
        uint16 confidenceBps;
        SubmissionStatus status;
    }

    address public owner;
    address public verifier;
    uint256 public nextRequestId = 1;

    mapping(uint256 => ProofRequest) public requests;
    mapping(uint256 => mapping(uint256 => Submission)) public submissions;
    mapping(uint256 => uint256) public submissionCount;

    event ProofRequestCreated(
        uint256 indexed requestId,
        address indexed requester,
        address indexed token,
        uint256 rewardPerProof,
        uint256 confirmationsNeeded,
        bytes32 metadataHash
    );
    event ProofSubmitted(
        uint256 indexed requestId,
        uint256 indexed submissionId,
        address indexed contributor,
        bytes32 evidenceHash
    );
    event ProofVerified(
        uint256 indexed requestId,
        uint256 indexed submissionId,
        bool accepted,
        uint16 confidenceBps
    );
    event PayoutReleased(
        uint256 indexed requestId,
        uint256 indexed submissionId,
        address indexed contributor,
        uint256 amount
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "NOT_OWNER");
        _;
    }

    modifier onlyVerifier() {
        require(msg.sender == verifier, "NOT_VERIFIER");
        _;
    }

    constructor(address initialVerifier) {
        owner = msg.sender;
        verifier = initialVerifier;
    }

    function setVerifier(address newVerifier) external onlyOwner {
        require(newVerifier != address(0), "ZERO_VERIFIER");
        verifier = newVerifier;
    }

    function createRequest(
        address token,
        uint256 rewardPerProof,
        uint256 confirmationsNeeded,
        uint256 deadline,
        bytes32 metadataHash
    ) external returns (uint256 requestId) {
        require(token != address(0), "ZERO_TOKEN");
        require(rewardPerProof > 0, "ZERO_REWARD");
        require(confirmationsNeeded > 0, "ZERO_CONFIRMATIONS");
        require(deadline > block.timestamp, "BAD_DEADLINE");

        requestId = nextRequestId++;
        uint256 totalFunding = rewardPerProof * confirmationsNeeded;
        require(IERC20(token).transferFrom(msg.sender, address(this), totalFunding), "FUND_FAILED");

        requests[requestId] = ProofRequest({
            requester: msg.sender,
            token: token,
            rewardPerProof: rewardPerProof,
            confirmationsNeeded: confirmationsNeeded,
            deadline: deadline,
            fundedBalance: totalFunding,
            approvedCount: 0,
            status: RequestStatus.Open,
            metadataHash: metadataHash
        });

        emit ProofRequestCreated(
            requestId,
            msg.sender,
            token,
            rewardPerProof,
            confirmationsNeeded,
            metadataHash
        );
    }

    function submitProof(uint256 requestId, bytes32 evidenceHash) external returns (uint256 submissionId) {
        ProofRequest storage proofRequest = requests[requestId];
        require(proofRequest.status == RequestStatus.Open, "REQUEST_NOT_OPEN");
        require(block.timestamp <= proofRequest.deadline, "REQUEST_EXPIRED");
        require(evidenceHash != bytes32(0), "EMPTY_EVIDENCE");

        submissionId = ++submissionCount[requestId];
        submissions[requestId][submissionId] = Submission({
            contributor: msg.sender,
            evidenceHash: evidenceHash,
            confidenceBps: 0,
            status: SubmissionStatus.Pending
        });

        emit ProofSubmitted(requestId, submissionId, msg.sender, evidenceHash);
    }

    function verifyProof(
        uint256 requestId,
        uint256 submissionId,
        bool accepted,
        uint16 confidenceBps
    ) external onlyVerifier {
        ProofRequest storage proofRequest = requests[requestId];
        Submission storage submission = submissions[requestId][submissionId];
        require(proofRequest.status == RequestStatus.Open, "REQUEST_NOT_OPEN");
        require(submission.contributor != address(0), "NO_SUBMISSION");
        require(submission.status == SubmissionStatus.Pending, "ALREADY_VERIFIED");
        require(confidenceBps <= 10_000, "BAD_CONFIDENCE");

        submission.confidenceBps = confidenceBps;

        if (accepted) {
            submission.status = SubmissionStatus.Approved;
            proofRequest.approvedCount += 1;
            proofRequest.fundedBalance -= proofRequest.rewardPerProof;
            require(
                IERC20(proofRequest.token).transfer(submission.contributor, proofRequest.rewardPerProof),
                "PAYOUT_FAILED"
            );
            emit PayoutReleased(requestId, submissionId, submission.contributor, proofRequest.rewardPerProof);

            if (proofRequest.approvedCount >= proofRequest.confirmationsNeeded) {
                proofRequest.status = RequestStatus.Closed;
            }
        } else {
            submission.status = SubmissionStatus.Rejected;
        }

        emit ProofVerified(requestId, submissionId, accepted, confidenceBps);
    }

    function refundExpired(uint256 requestId) external {
        ProofRequest storage proofRequest = requests[requestId];
        require(msg.sender == proofRequest.requester, "NOT_REQUESTER");
        require(block.timestamp > proofRequest.deadline, "NOT_EXPIRED");
        require(proofRequest.status == RequestStatus.Open, "NOT_OPEN");

        proofRequest.status = RequestStatus.Cancelled;
        uint256 refund = proofRequest.fundedBalance;
        proofRequest.fundedBalance = 0;
        require(IERC20(proofRequest.token).transfer(proofRequest.requester, refund), "REFUND_FAILED");
    }
}
