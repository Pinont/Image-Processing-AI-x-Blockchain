// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title ProvenanceRegistry
 * @dev Records AI detection results to provide an immutable history of "What was detected, when, and by which model".
 */
contract ProvenanceRegistry {
    
    struct DetectionRecord {
        address user;
        uint256 timestamp;
        string modelVersion;
        string resultCid; // IPFS CID of the full JSON result
    }

    // Mapping from Image Hash -> Array of Records (Multiple people can detect the same image)
    mapping(bytes32 => DetectionRecord[]) public imageDetections;

    // Event to allow off-chain indexers (e.g., The Graph) to build the history
    event DetectionRecorded(
        address indexed user,
        bytes32 indexed imageHash,
        string modelVersion,
        string resultCid,
        uint256 timestamp
    );

    /**
     * @notice Records a detection result on-chain.
     * @param imageHash SHA-256 hash of the original image.
     * @param modelVersion Version string of the AI model used (e.g., "YOLOv11x-Web").
     * @param resultCid IPFS CID where the detailed detection result is stored.
     */
    function recordDetection(
        bytes32 imageHash,
        string memory modelVersion,
        string memory resultCid
    ) public {
        DetectionRecord memory newRecord = DetectionRecord({
            user: msg.sender,
            timestamp: block.timestamp,
            modelVersion: modelVersion,
            resultCid: resultCid
        });

        imageDetections[imageHash].push(newRecord);

        emit DetectionRecorded(
            msg.sender,
            imageHash,
            modelVersion,
            resultCid,
            block.timestamp
        );
    }

    /**
     * @notice Get the number of times an image has been processed.
     */
    function getDetectionCount(bytes32 imageHash) public view returns (uint256) {
        return imageDetections[imageHash].length;
    }

    /**
     * @notice Get a specific record for an image.
     */
    function getDetectionRecord(bytes32 imageHash, uint256 index) public view returns (
        address user,
        uint256 timestamp,
        string memory modelVersion,
        string memory resultCid
    ) {
        require(index < imageDetections[imageHash].length, "Index out of bounds");
        DetectionRecord memory record = imageDetections[imageHash][index];
        return (record.user, record.timestamp, record.modelVersion, record.resultCid);
    }
}
