import React, { useState } from 'react';
import { createVlayerClient } from "@vlayer/sdk";
import { getConfig, createContext } from "@vlayer/sdk/config";
import proverSpec from "./BugBountyEmailProver.json";
import verifierSpec from "./BugBountyRegistry.json";

// Hardcoded addresses from deployment
const PROVER_ADDRESS = "0x4ceeb9cf8499f13d018606ad32faecf568c5c286";
const VERIFIER_ADDRESS = "0x46f0d007f332b115858e6da427e279f4a1e54ec1";

const EmailParserWithMinting = () => {
    const [headers, setHeaders] = useState({});
    const [body, setBody] = useState('');
    const [error, setError] = useState('');
    const [fileName, setFileName] = useState('');
    const [mintingStatus, setMintingStatus] = useState('');
    const [txHash, setTxHash] = useState('');
    const [mintResult, setMintResult] = useState(null);

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

        try {
            // Convert headers object back to string format
            const headersString = Object.entries(headers)
                .map(([key, value]) => `${key}: ${value}`)
                .join('\r\n');

            const config = {
                vlayerEnv: 'testnet',
                chainName: 'lineaSepolia',
                proverUrl: 'https://stable-fake-prover.vlayer.xyz',
                jsonRpcUrl: 'https://rpc.sepolia.linea.build',
                privateKey: '0x06144584635a701efc050f7916a45fd94b4be93b961fd85a5dc2b51048b75d87',
                token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbnZpcm9ubWVudCI6InRlc3QiLCJpYXQiOjE3NDg1MzU5MDQsImV4cCI6MTc4MDE1ODMwNCwic3ViIjoiLzJqc0VWcEtKZDlOcnAreGMxclFzQUd4UE9rR1RKa3k5YUJKTTZjM3VlWXdBUndNd2dnRHVqNElsZk1wNFB4Q3ltekZWVzJnaE9LVlpEdGh2MkdqOUE9PSJ9.cYLG3SZhaIGW2TdJJ9KooJKLdqIShqOTai83EW4t-tF2tNADWZGxcUZbeC7RUOBuOBwdIlQoBWVWjh21TR3LJxiLYSNdkKJ8LzxHxlpRyKb6p885TsasGOoN05WVSxUYNR9DJekZSbKQ7x8qsA7DpJI50hUO_qPyMB5rscqzJDJW3VRap-J7PKa8swd02N9xJFMyv1VcAXNETkgpq2p5sX_Uzpp9d0FgHaq--eKlueSBlmIHVYyyjJgci3VOs4BCQVSW0Dac8cF7maNQMMTZNVDjbgA60Eck0M84r35SovW_t28mBoWHLpgOasXDZXtqqySp51Nj5-i-mSilS1iMdWd0UW3kC7orhdw5c3trPfYRZH3B7i9pe37GnTGd9A226igrd4Ib4ViImlwbLQtYzlX-cRd2-nZ9WA4U8_mQgXUNdTb5mM2KSxe4goC45P2dtW2Md9hZj6TZz6wI-3mE3kJbyowmtRhwCODHoA4Aq0dpiDTcfiDAyapoku-eRiSkI4AA5VN6HEXRJ-fYO7GVCiIeV_CgBjmdRrPMHOp4xxbljOtR0EhtfFFt0Nr7u3EhQgR95PWYAa12HvDlVGGoKn3lMao0zzTBt2vkxf9TZD1LRjjkTRWpjzbig5lFDWtA4_lOLTFcS31cKbAbLfrTlkk9KCyhqcbSc-V2_cFjq9Q'
            };
            console.log(config)
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
                args: [body, headersString],
                chainId: chain.id,
                gasLimit: config.gasLimit,
                account: john.address,
            });

            setMintingStatus('Waiting for proving result...');
            const result = await vlayer.waitForProvingResult({ hash });
            const [proof, submission] = result;

            setMintResult({
                reporter: submission.reporter,
                platform: submission.platform,
                severity: submission.severity,
                merits: submission.merits.toString(),
                tokenId: submission.tokenId.toString(),
                verified: submission.verified
            });

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

                setMintResult(prev => ({
                    ...prev,
                    totalMerits: userStats[0].toString(),
                    badgeCount: userStats[1].toString(),
                    criticalCount: userStats[2].toString(),
                    highCount: userStats[3].toString(),
                    mediumCount: userStats[4].toString(),
                    lowCount: userStats[5].toString()
                }));
            } else {
                setMintingStatus('❌ Transaction failed');
            }
        } catch (err) {
            let errorMessage = err.message;
            
            // Check for specific error messages
            if (errorMessage.includes("Submission already used")) {
                errorMessage = "This bug bounty submission has already been claimed. Each submission can only be claimed once.";
            } else if (errorMessage.includes("Execution reverted")) {
                // Extract the actual error reason if it exists
                const match = errorMessage.match(/Execution reverted with reason: (.*?)(?=\.|$)/);
                if (match && match[1]) {
                    errorMessage = match[1];
                }
            }
            
            setError('Minting error: ' + errorMessage);
            setMintingStatus('Minting failed');
            console.error('Detailed error:', err);
        }
    };

    return (
        <div style={styles.container}>
            <h2>Email Parser with Badge Minting</h2>
            <input
                type="file"
                accept=".eml"
                onChange={handleFileUpload}
                style={styles.input}
            />
            {fileName && <p>Uploaded: {fileName}</p>}

            {error && <div style={styles.error}>{error}</div>}

            <div style={styles.buttonContainer}>
                <button
                    onClick={mintBadge}
                    disabled={!Object.keys(headers).length || !body}
                    style={styles.mintButton}
                >
                    Mint Bug Bounty Badge
                </button>
            </div>

            {mintingStatus && <div style={styles.status}>{mintingStatus}</div>}
            {txHash && <div style={styles.txLink}>Transaction: {txHash}</div>}

            {mintResult && (
                <div style={styles.resultContainer}>
                    <h3>Minting Result</h3>
                    <div style={styles.resultCard}>
                        <p><strong>Reporter:</strong> {mintResult.reporter}</p>
                        <p><strong>Platform:</strong> {mintResult.platform}</p>
                        <p><strong>Severity:</strong> {mintResult.severity}</p>
                        <p><strong>Merits:</strong> {mintResult.merits}</p>
                        <p><strong>Token ID:</strong> {mintResult.tokenId}</p>
                        <p><strong>Verified:</strong> {mintResult.verified ? 'Yes' : 'No'}</p>

                        {mintResult.totalMerits && (
                            <>
                                <h4>User Stats</h4>
                                <p><strong>Total Merits:</strong> {mintResult.totalMerits}</p>
                                <p><strong>Badge Count:</strong> {mintResult.badgeCount}</p>
                                <p><strong>Critical:</strong> {mintResult.criticalCount}</p>
                                <p><strong>High:</strong> {mintResult.highCount}</p>
                                <p><strong>Medium:</strong> {mintResult.mediumCount}</p>
                                <p><strong>Low:</strong> {mintResult.lowCount}</p>
                            </>
                        )}
                    </div>
                </div>
            )}

            {Object.keys(headers).length > 0 && (
                <div style={styles.section}>
                    <h3>Parsed Headers</h3>
                    <table style={styles.table}>
                        <tbody>
                            {Object.entries(headers).map(([key, value]) => (
                                <tr key={key}>
                                    <td style={styles.keyCell}>{key}:</td>
                                    <td style={styles.valueCell}>{value}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {body && (
                <div style={styles.section}>
                    <h3>Parsed Body Content</h3>
                    <div style={styles.bodyContainer}>
                        <pre style={styles.bodyText}>{body}</pre>
                    </div>
                </div>
            )}
        </div>
    );
};

// Styling
const styles = {
    container: {
        fontFamily: 'Arial, sans-serif',
        maxWidth: '800px',
        margin: '20px auto',
        padding: '20px',
        border: '1px solid #2c3e50',
        borderRadius: '10px',
        backgroundColor: '#1a202c',
        color: '#e2e8f0',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    },
    input: {
        margin: '10px 0',
        padding: '10px',
        width: '100%',
        backgroundColor: '#2d3748',
        color: 'white',
        border: '1px solid #4a5568',
        borderRadius: '4px'
    },
    buttonContainer: {
        margin: '20px 0',
        textAlign: 'center'
    },
    mintButton: {
        padding: '12px 24px',
        backgroundColor: '#4caf50',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: 'bold',
        transition: 'background-color 0.3s',
        ':hover': {
            backgroundColor: '#388e3c'
        },
        ':disabled': {
            backgroundColor: '#2d3748',
            cursor: 'not-allowed'
        }
    },
    section: {
        marginTop: '30px',
        padding: '15px',
        backgroundColor: '#2d3748',
        borderRadius: '8px'
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        backgroundColor: '#2d3748'
    },
    keyCell: {
        fontWeight: 'bold',
        padding: '10px',
        border: '1px solid #4a5568',
        width: '30%',
        verticalAlign: 'top',
        color: '#63b3ed'
    },
    valueCell: {
        padding: '10px',
        border: '1px solid #4a5568',
        wordBreak: 'break-word'
    },
    bodyContainer: {
        backgroundColor: '#2d3748',
        padding: '15px',
        border: '1px solid #4a5568',
        borderRadius: '4px',
        maxHeight: '300px',
        overflowY: 'auto'
    },
    bodyText: {
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        margin: 0,
        color: '#cbd5e0'
    },
    error: {
        color: '#fc8181',
        margin: '15px 0',
        padding: '10px',
        backgroundColor: '#2d3748',
        borderRadius: '4px'
    },
    status: {
        margin: '15px 0',
        padding: '10px',
        backgroundColor: '#2d3748',
        borderRadius: '4px',
        textAlign: 'center',
        fontWeight: 'bold'
    },
    txLink: {
        color: '#63b3ed',
        margin: '10px 0',
        wordBreak: 'break-all'
    },
    resultContainer: {
        marginTop: '30px',
        padding: '15px',
        backgroundColor: '#2d3748',
        borderRadius: '8px'
    },
    resultCard: {
        backgroundColor: '#4a5568',
        padding: '15px',
        borderRadius: '6px',
        marginTop: '10px'
    }
};

export default EmailParserWithMinting;