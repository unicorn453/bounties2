import React, { useState } from 'react';

const EmailParser = () => {
    const [headers, setHeaders] = useState({});
    const [body, setBody] = useState('');
    const [error, setError] = useState('');
    const [fileName, setFileName] = useState('');

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

    return (
        <div style={styles.container}>
            <h2>Email Parser</h2>
            <input
                type="file"
                accept=".eml"
                onChange={handleFileUpload}
                style={styles.input}
            />
            {fileName && <p>Uploaded: {fileName}</p>}

            {error && <div style={styles.error}>{error}</div>}

            {Object.keys(headers).length > 0 && (
                <div style={styles.section}>
                    <h3>Headers</h3>
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
                    <h3>Body Content</h3>
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
        border: '1px solid #ddd',
        borderRadius: '8px',
        backgroundColor: '#f9f9f9'
    },
    input: {
        margin: '10px 0',
        padding: '10px'
    },
    section: {
        marginTop: '20px'
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        backgroundColor: 'white'
    },
    keyCell: {
        fontWeight: 'bold',
        padding: '8px',
        border: '1px solid #ddd',
        width: '30%',
        verticalAlign: 'top'
    },
    valueCell: {
        padding: '8px',
        border: '1px solid #ddd',
        wordBreak: 'break-word'
    },
    bodyContainer: {
        backgroundColor: 'white',
        padding: '15px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        maxHeight: '400px',
        overflowY: 'auto'
    },
    bodyText: {
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        margin: 0
    },
    error: {
        color: 'red',
        margin: '10px 0'
    }
};

export default EmailParser;
