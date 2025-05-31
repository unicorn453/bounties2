import React, { useState } from 'react';
import { createVlayerClient } from "@vlayer/sdk";
import { getConfig, createContext } from "@vlayer/sdk/config";
import { useNotification } from "@blockscout/app-sdk";
import { X, Upload, Shield } from 'lucide-react';
import proverSpec from "./BugBountyEmailProver.json";
import verifierSpec from "./BugBountyRegistry.json";

// Hardcoded addresses from deployment
const PROVER_ADDRESS = "0xe7439829bb4bc8aed8ebddef00ff953d0cea2ac1";
const VERIFIER_ADDRESS = "0x5d8d62f0c91b318026a144c5c73efd82072c2b58";
const CHAIN_ID = 11155111;

const EmailUpload = ({ address, isOpen, onClose }) => {
    const [headers, setHeaders] = useState({});
    const [body, setBody] = useState('');
    const [error, setError] = useState('');
    const [fileName, setFileName] = useState('');
    const [mintingStatus, setMintingStatus] = useState('');
    const [txHash, setTxHash] = useState('');
    const [mintResult, setMintResult] = useState(null);
    const { openTxToast } = useNotification();

    const parseEmail = (content) => {
        setError('');
        try {
            // Split headers and body
            const headerBodySplit = content.split('\r\n\r\n');
            if (headerBodySplit.length < 2) {
                throw new Error('Invalid email format');
            }

            // Parse headers
            const headerLines = headerBodySplit[0].split('\r\n');
            const parsedHeaders = {};

            let currentHeader = '';
            headerLines.forEach(line => {
                if (/^\s/.test(line)) {
                    // Continuation of previous header
                    parsedHeaders[currentHeader] += ' ' + line.trim();
                } else {
                    const colonIndex = line.indexOf(':');
                    if (colonIndex > 0) {
                        currentHeader = line.substring(0, colonIndex).trim();
                        const value = line.substring(colonIndex + 1).trim();
                        parsedHeaders[currentHeader] = value;
                    }
                }
            });

            // Parse body
            const bodyContent = headerBodySplit.slice(1).join('\r\n\r\n');
            const contentType = parsedHeaders['Content-Type'] || '';
            let parsedBody = bodyContent;

            // Handle quoted-printable encoding
            if (/quoted-printable/i.test(contentType)) {
                parsedBody = parsedBody
                    .replace(/=\r\n/g, '')
                    .replace(/=([0-9A-F]{2})/g, (_, hex) =>
                        String.fromCharCode(parseInt(hex, 16))
                    );
            }

            // Handle base64 encoding
            if (/base64/i.test(contentType) && /text\/(plain|html)/i.test(contentType)) {
                try {
                    parsedBody = atob(parsedBody.replace(/\s/g, ''));
                } catch (e) {
                    console.error('Base64 decoding error:', e);
                }
            }

            setHeaders(parsedHeaders);
            setBody(parsedBody);
        } catch (err) {
            setError('Error parsing email: ' + err.message);
            setHeaders({});
            setBody('');
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setFileName(file.name);

        const reader = new FileReader();
        reader.onload = (event) => {
            parseEmail(event.target.result);
        };
        reader.onerror = () => {
            setError('Error reading file');
        };
        reader.readAsText(file);
    };

    const mintBadge = async () => {
        if (!Object.keys(headers).length || !body) {
            setError('Please upload and parse an email first');
            return;
        }

        setMintingStatus('Minting started...');
        setMintResult(null);
        setTxHash('');
        setError('');

        try {
            // Convert headers object back to string format
            const headersString = Object.entries(headers)
                .map(([key, value]) => `${key}: ${value}`)
                .join('\r\n');

            const config = {
                vlayerEnv: 'testnet',
                chainName: 'sepolia',
                proverUrl: 'https://stable-fake-prover.vlayer.xyz',
                jsonRpcUrl: 'https://ethereum-sepolia-rpc.publicnode.com',
                privateKey: '0x06144584635a701efc050f7916a45fd94b4be93b961fd85a5dc2b51048b75d87',
                token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbnZpcm9ubWVudCI6InRlc3QiLCJpYXQiOjE3NDg1MzU5MDQsImV4cCI6MTc4MDE1ODMwNCwic3ViIjoiLzJqc0VWcEtKZDlOcnAreGMxclFzQUd4UE9rR1RKa3k5YUJKTTZjM3VlWXdBUndNd2dnRHVqNElsZk1wNFB4Q3ltekZWVzJnaE9LVlpEdGh2MkdqOUE9PSJ9.cYLG3SZhaIGW2TdJJ9KooJKLdqIShqOTai83EW4t-tF2tNADWZGxcUZbeC7RUOBuOBwdIlQoBWVWjh21TR3LJxiLYSNdkKJ8LzxHxlpRyKb6p885TsasGOoN05WVSxUYNR9DJekZSbKQ7x8qsA7DpJI50hUO_qPyMB5rscqzJDJW3VRap-J7PKa8swd02N9xJFMyv1VcAXNETkgpq2p5sX_Uzpp9d0FgHaq--eKlueSBlmIHVYyyjJgci3VOs4BCQVSW0Dac8cF7maNQMMTZNVDjbgA60Eck0M84r35SovW_t28mBoWHLpgOasXDZXtqqySp51Nj5-i-mSilS1iMdWd0UW3kC7orhdw5c3trPfYRZH3B7i9pe37GnTGd9A226igrd4Ib4ViImlwbLQtYzlX-cRd2-nZ9WA4U8_mQgXUNdTb5mM2KSxe4goC45P2dtW2Md9hZj6TZz6wI-3mE3kJbyowmtRhwCODHoA4Aq0dpiDTcfiDAyapoku-eRiSkI4AA5VN6HEXRJ-fYO7GVCiIeV_CgBjmdRrPMHOp4xxbljOtR0EhtfFFt0Nr7u3EhQgR95PWYAa12HvDlVGGoKn3lMao0zzTBt2vkxf9TZD1LRjjkTRWpjzbig5lFDWtA4_lOLTFcS31cKbAbLfrTlkk9KCyhqcbSc-V2_cFjq9Q',
                gasLimit: 10000000
            };

            const {
                chain,
                ethClient,
                account: john,
                proverUrl,
                confirmations,
            } = createContext(config);

            if (!john) {
                throw new Error(
                    "No account found. Ensure EXAMPLES_TEST_PRIVATE_KEY is set"
                );
            }

            setMintingStatus('Generating proof...');

            const vlayer = createVlayerClient({
                url: proverUrl,
                token: config.token,
            });

            // Generate proof using the parsed email data
            const hash = await vlayer.prove({
                address: PROVER_ADDRESS,
                proverAbi: proverSpec.abi,
                functionName: "prove",
                args: [body, headersString, address],
                chainId: chain.id,
                gasLimit: 100000000,
            });

            setMintingStatus('Waiting for proving result...');
            const result = await vlayer.waitForProvingResult({ hash });
            const [proof, submission] = result;

            setMintingStatus('Submitting proof to registry...');

            const gas = await ethClient.estimateContractGas({
                address: VERIFIER_ADDRESS,
                abi: verifierSpec.abi,
                functionName: "submitBugBountyProof",
                args: [
                    proof,
                    submission.platform,
                    submission.severity,
                    submission.submissionId
                ],
                account: john,
                blockTag: "pending",
            });

            const verificationHash = await ethClient.writeContract({
                address: VERIFIER_ADDRESS,
                abi: verifierSpec.abi,
                functionName: "submitBugBountyProof",
                args: [
                    proof,
                    submission.platform,
                    submission.severity,
                    submission.submissionId
                ],
                account: john,
                gas,
            });

            setTxHash(verificationHash);
            setMintingStatus('Waiting for transaction confirmation...');

            // Show transaction toast
            try {
                console.log(CHAIN_ID.toString())
                console.log(verificationHash)
                openTxToast(CHAIN_ID.toString(), verificationHash);
            } catch (toastError) {
                console.warn('Toast notification failed:', toastError);
                setMintingStatus('Transaction submitted - view in explorer');
            }

            const receipt = await ethClient.waitForTransactionReceipt({
                hash: verificationHash,
                confirmations,
                retryCount: 60,
                retryDelay: 1000,
            });

            if (receipt.status === "success") {
                setMintingStatus('🎉 Bug bounty badge successfully awarded!');

                // Get updated user stats
                const userStats = await ethClient.readContract({
                    address: VERIFIER_ADDRESS,
                    abi: verifierSpec.abi,
                    functionName: "getUserStats",
                    args: [john.address],
                });

                setMintResult({
                    reporter: submission.reporter,
                    platform: submission.platform,
                    severity: submission.severity,
                    merits: submission.merits.toString(),
                    tokenId: submission.tokenId.toString(),
                    verified: submission.verified,
                    totalMerits: userStats[0].toString(),
                    badgeCount: userStats[1].toString(),
                    criticalCount: userStats[2].toString(),
                    highCount: userStats[3].toString(),
                    mediumCount: userStats[4].toString(),
                    lowCount: userStats[5].toString()
                });
            } else {
                throw new Error('Transaction failed');
            }
        } catch (err) {
            let errorMessage = err.message;

            if (errorMessage.includes("Submission already used")) {
                errorMessage = "This bug bounty submission has already been claimed. Each submission can only be claimed once.";
            } else if (errorMessage.includes("Execution reverted")) {
                const match = errorMessage.match(/Execution reverted with reason: (.*?)(?=\.|$)/);
                if (match && match[1]) {
                    errorMessage = match[1];
                }
            }

            setError('Minting error: ' + errorMessage);
            setMintingStatus('Minting failed');
            setMintResult(null);
            console.error('Detailed error:', err);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-lg flex justify-between items-center">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        Upload Bug Bounty Email
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-white hover:text-gray-200 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Upload Email File (.eml)
                        </label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                            <div className="space-y-1 text-center">
                                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                <div className="flex text-sm text-gray-600">
                                    <label
                                        htmlFor="file-upload"
                                        className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                                    >
                                        <span>Upload a file</span>
                                        <input
                                            id="file-upload"
                                            name="file-upload"
                                            type="file"
                                            accept=".eml"
                                            onChange={handleFileUpload}
                                            className="sr-only"
                                        />
                                    </label>
                                    <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className="text-xs text-gray-500">
                                    .eml files only
                                </p>
                            </div>
                        </div>
                        {fileName && (
                            <p className="mt-2 text-sm text-gray-600">
                                Selected file: {fileName}
                            </p>
                        )}
                    </div>

                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                            {error}
                        </div>
                    )}

                    {mintingStatus && (
                        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700">
                            {mintingStatus}
                        </div>
                    )}

                    {txHash && (
                        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-green-700">
                                Transaction: {txHash}
                            </p>
                        </div>
                    )}

                    {mintResult && (
                        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <h3 className="font-semibold text-green-800 mb-2">Minting Successful!</h3>
                            <div className="space-y-1 text-sm text-green-700">
                                <p><span className="font-medium">Platform:</span> {mintResult.platform}</p>
                                <p><span className="font-medium">Severity:</span> {mintResult.severity}</p>
                                <p><span className="font-medium">Merits:</span> {mintResult.merits}</p>
                                <p><span className="font-medium">Token ID:</span> {mintResult.tokenId}</p>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-4">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={mintBadge}
                            disabled={!Object.keys(headers).length || !body}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Mint Badge
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmailUpload;
