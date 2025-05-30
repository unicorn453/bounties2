## Ideas :
- Verifiable Bug Bounty submission !
- Proof-of-Employment On-Chain using world coin
- Generate avatar based on your wins and participation in hackathons (NFT ?)





- Proof of Residency for Regulatory Compliance
- ENS email ownership
- 

- extension for auti filling 2fa codes or maybe anti phishing extension




## Best Idea :
### Verifiable Bug Bounty submission
**Bounties** :
- Blockscout (All bounties)
- Vlayer (Email Proof, Most inspiring)

**Description** :
- so basically the user will upload the email with the congratulations message that he found the bug, and if the email is proven to be a valid submission a badge will be generated plus some merits will be given to him based on how much money he made from the bug, and then any user can on chain verify the proof using blockscout api, and the user page will be updated with the new badge or/and merit collected from this submission.

```mermaid
graph TD
A[User Submits Email Proof] --> B[vlayer Verification]
B --> C{Valid Submission?}
C -->|Yes| D[Smart Contract: Record Proof]
D --> E[Mint Badge NFT + Calculate Merits]
E --> F[Blockscout Merits API: Award Points]
F --> G[Blockscout Explorer UI]
G --> H[User Profile: Show Badge/Merits]
```


### Technical Diagram :
```mermaid
sequenceDiagram
    participant User
    participant Vlayer(Backend)
    participant Blockchain
    participant Blockscout
    
    User->>Vlayer: Submit raw email + address
    Vlayer->>Vlayer: Verify DKIM signature
    Vlayer->>Vlayer: Extract bounty amount
    Vlayer->>Blockchain: Submit email hash
    Blockchain->>Blockchain: Store submission record
    Vlayer->>Blockchain: Trigger verification
    Blockchain->>Blockchain: Mint NFT badge
    Blockchain->>Blockscout: Emit verification event
    Blockscout->>Blockscout: Update user profile
```




