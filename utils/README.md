# ISBE Contract Utilities

This directory contains utility classes and helpers for ISBE smart contract development and deployment.

## Secp256r1Wallet

Production-ready secp256r1 wallet implementation for Ethereum-compatible networks with regulatory compliance requirements.

### Features

- **NIST P-256 Compliance**: Implements secp256r1 (NIST P-256) elliptic curve signatures
- **Ethers.js Integration**: Extends `AbstractSigner` for seamless integration
- **EIP-155 Support**: Full transaction replay protection
- **Production Ready**: Thoroughly tested with smart contract deployments

### Quick Start

```javascript
const { Secp256r1Wallet } = require('./utils/Secp256r1Wallet')
const { ethers } = require('ethers')

// Initialize provider and wallet
const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545')
const wallet = new Secp256r1Wallet(privateKey, provider)

// Get wallet address
const address = await wallet.getAddress()
console.log('Wallet address:', address)

// Sign and send transaction
const transaction = {
    nonce: await provider.getTransactionCount(address),
    gasPrice: ethers.parseUnits('1', 'wei'),
    gasLimit: 21000n,
    to: '0xRecipientAddress',
    value: ethers.parseUnits('1', 'ether'),
    chainId: (await provider.getNetwork()).chainId,
}

const signedTx = await wallet.signTransaction(transaction)
const response = await provider.send('eth_sendRawTransaction', [signedTx])
```

### Contract Interaction

For contract interactions, use raw transactions to avoid ethers.js signature recovery issues:

```javascript
// Create contract interface for encoding
const contract = new ethers.Contract(contractAddress, abi, provider)
const functionData = Secp256r1Wallet.encodeContractCall(
    contract,
    'functionName',
    [arg1, arg2]
)

// Create and sign transaction
const contractTx = {
    nonce: await provider.getTransactionCount(address),
    gasPrice: ethers.parseUnits('1', 'wei'),
    gasLimit: 100000n,
    to: contractAddress,
    value: 0n,
    data: functionData,
    chainId: (await provider.getNetwork()).chainId,
}

const signedContractTx = await wallet.signTransaction(contractTx)
const contractResponse = await provider.send('eth_sendRawTransaction', [
    signedContractTx,
])
```

### Network Requirements

The secp256r1 wallet requires a network configured to accept secp256r1 signatures. Ensure your Besu genesis configuration includes:

```json
{
    "config": {
        "ecCurve": "secp256r1",
        "ellipticCurve": "secp256r1"
    }
}
```

### Documentation

For complete implementation details, see:

- [`../docs/Secp256r1-Signature-Guide.md`](../docs/Secp256r1-Signature-Guide.md) - Comprehensive implementation guide
- [`../scripts/production-secp256r1-deploy.js`](../scripts/production-secp256r1-deploy.js) - Example usage

### Security Notes

- Never hardcode private keys in production
- Use environment variables for key management
- Implement proper key rotation strategies
- Consider hardware security modules (HSMs) for high-value operations

---

_Part of the ISBE (Interoperable Secure Blockchain Ecosystem) project by Alastria_
