# Production Deployment Guide

## 🎯 Overview

This guide provides step-by-step instructions for deploying ISBE contracts to production networks, based on successfully verified deployments on both secp256k1 and secp256r1 networks.

**Verified Networks:**

- ✅ **secp256k1**: Standard Ethereum networks (hardhat, mvp, arsys, kepler)
- ✅ **secp256r1**: Hyperledger Besu networks (customR1Network)

## 🚀 Quick Production Deployment

### For secp256k1 Networks (Standard Ethereum)

```bash
# 1. Configure accounts
echo '; Curve: SECP256K1' > .env
echo 'ACCOUNT_ADDRESS=0xYourAddress' >> .env
echo 'ACCOUNT_PRIVATE_KEY=0xYourPrivateKey' >> .env
echo 'ACCOUNTS=key1,key2,key3,key4,key5' >> .env

# 2. Validate configuration
npx hardhat validate-accounts

# 3. Deploy to production network
npx hardhat deployAll --network mvp --precommit

# 4. Verify deployment
npx hardhat complete-deployment-status --network mvp
```

### For secp256r1 Networks (Hyperledger Besu)

```bash
# 1. Generate secp256r1 accounts
npx hardhat generate-secp256r1-env --count 5

# 2. Validate configuration
npx hardhat validate-accounts

# 3. Deploy to secp256r1 network
npx hardhat deployAll --network customR1Network --precommit

# 4. Verify deployment
npx hardhat verify-besu-deployment --network customR1Network
npx hardhat complete-deployment-status --network customR1Network
```

## 📋 Pre-Deployment Checklist

### Environment Preparation

- [ ] **Node.js**: Version 20.X.X or higher installed
- [ ] **Dependencies**: `npm install` completed successfully
- [ ] **Compilation**: `npm run compile:force` passes without errors
- [ ] **Tests**: `npm run test:coverage` shows 100% coverage
- [ ] **Linting**: `npm run lint` passes with 0 warnings
- [ ] **Security**: `npm run slither:analysis:local` shows no critical issues

### Network Configuration

- [ ] **Network Access**: Target network URL is accessible
- [ ] **Chain ID**: Correct chain ID configured in `hardhat.config.ts`
- [ ] **Account Setup**: Deployer accounts configured with sufficient balance
- [ ] **Curve Type**: Correct curve type specified (`secp256k1` or `secp256r1`)
- [ ] **Gas Configuration**: Gas price and limits configured appropriately

### Security Verification

- [ ] **Private Keys**: Secure storage and handling of private keys
- [ ] **Account Validation**: All accounts pass validation checks
- [ ] **Permissions**: Deployer has necessary permissions
- [ ] **Backup**: Configuration and keys properly backed up

## 🏗️ Deployment Process

### Phase 1: Governance Deployment

The deployment process automatically follows this sequence:

1. **Governance Factory Deployment**
    - Core ISBE factory contract
    - Diamond proxy implementation
    - Initial governance roles setup

2. **Governance Configuration**
    - Role-based access control setup
    - Admin role assignment
    - Pause mechanism configuration

**Expected Output:**

```
🏛️ Deploying governance system...
   📍 Factory address: 0x414356c5A4b6DE11FE92726a9B430AfD3Facfb5D
   ✅ Governance system successfully deployed
```

### Phase 2: Business Logic Deployment

Automatic deployment of all 23 business logic contracts:

**Core Facets:**

- IsbeCutFacet (Diamond cuts)
- IsbeLoupeFacet (Diamond introspection)
- AccessControlFacet (Role management)
- ISBEPauseFacet (Pause controls)

**ERC20 Facets:**

- ERC20Facet (Base token)
- ERC20SnapshotFacet (Balance snapshots)
- ERC20BurnableFacet (Token burning)
- ERC20CappedFacet (Supply cap)
- ERC20ControllerFacet (Administrative controls)

**ERC721 Facets:**

- ERC721Facet (Base NFT)
- ERC721BurnableFacet (NFT burning)
- ERC721EnumerableFacet (Token enumeration)
- ERC721CappedFacet (Supply cap)
- ERC721ControllerFacet (Administrative controls)
- ERC721SnapshotFacet (Balance snapshots)
- ERC721RoyaltyFacet (Royalty support)
- ERC721ConsecutiveFacet (Batch minting)

**Specialized Facets:**

- HashTimestampFacet (Document timestamping)
- OwnableFacet (Ownership management)
- DID Facets (Decentralized Identity - 4 facets)

**Expected Output:**

```
📦 Deploying 23 business logics...
   ✅ ERC20Facet deployed at: 0x...
   ✅ AccessControlFacet deployed at: 0x...
   ...
📊 Summary: 23 successful, 0 failed
```

### Phase 3: Use Case Deployment

Deployment of 4 complete use case implementations:

1. **ERC20 Complete UseCase**
    - Full ERC20 token implementation
    - 5 business logic integrations
    - Administrative controls

2. **DID Registry UseCase**
    - Decentralized Identity management
    - 4 specialized facets
    - Identity verification

3. **ERC721 UseCase**
    - Complete NFT implementation
    - 8 business logic integrations
    - Royalty and metadata support

4. **Hash Timestamp UseCase**
    - Document timestamping service
    - Cryptographic proof generation
    - Immutable audit trail

**Expected Output:**

```
🎯 Deploying 4 use cases...
   ✅ ERC20 Complete UseCase: 0x54C6D771C741c7E61c328482d1Be41Ce41CdF345
   ✅ DID Registry UseCase: 0x45759BeD675E20Cf1CB9B308a771E70c61b80DC0
   ✅ ERC721 UseCase: 0x47DdC0c475905055595a53208fc6d90B866AEd26
   ✅ Hash Timestamp UseCase: 0x90EF60cAd55dcB11b2e5a24a610DBDC363664a68
```

### Phase 4: Validation and Verification

Automatic execution of 13 validation tests:

**Governance Validations:**

- Facets validation (8 facets expected)
- Roles validation (7 governance roles)
- Pause/unpause functionality

**Business Logic Validations:**

- Deployment success (23/23 contracts)
- Version management
- Registry integrity

**Use Case Validations:**

- Deployment success (4/4 use cases)
- Configuration validation
- Access control verification
- Pause/unpause functionality

**Integration Validations:**

- HashTimestamp introspection
- Cross-component communication
- Interface compliance

**Expected Output:**

```
📋 VALIDATION RESULTS:
   ✅ Governance Facets Validation: Found 8 facets with proper selectors
   ✅ Business Logic Deployment: 23/23 business logics deployed successfully
   ✅ Use Case Deployment: 4/4 use cases deployed successfully
   ...
✅ All pre-commit validations passed!
```

## 🔍 Post-Deployment Verification

### Comprehensive Status Check

```bash
npx hardhat complete-deployment-status --network <network> --governance <governance-address>
```

**Verifies:**

- Network connectivity and performance
- Governance contract status
- Business logic registry
- Use case deployments
- Role assignments
- Interface compliance

### Individual Contract Verification

```bash
# Check specific contract details
npx hardhat contract-info --address <contract-address> --network <network>

# Verify governance facets
npx hardhat getFacets --diamond <governance-address> --network <network>

# Check business logic registry
npx hardhat getBusinessLogics --factory <factory-address> --network <network>

# Test pause functionality
npx hardhat isPaused --diamond <contract-address> --network <network>
```

### Network-Specific Verification

For **secp256r1** networks (Hyperledger Besu):

```bash
npx hardhat verify-besu-deployment --network customR1Network --factory <factory-address>
```

For **secp256k1** networks:

```bash
npx hardhat deployment-status --network <network> --start-block 0
```

## 📊 Performance Expectations

### Deployment Timeline

**secp256k1 Networks:**

- Total Time: ~3-5 minutes
- Governance: ~30 seconds
- Business Logic: ~2-3 minutes (23 contracts)
- Use Cases: ~1 minute (4 contracts)
- Validation: ~30 seconds

**secp256r1 Networks:**

- Total Time: ~4-6 minutes
- Governance: ~45 seconds
- Business Logic: ~3-4 minutes (23 contracts)
- Use Cases: ~1-2 minutes (4 contracts)
- Validation: ~1 minute

### Success Metrics

- **Deployment Success Rate**: 100% (27/27 contracts)
- **Validation Pass Rate**: 100% (13/13 tests)
- **Network Response Time**: < 5ms
- **Contract Sizes**: 355-587 bytes average
- **Gas Efficiency**: Optimized for production

## 🚨 Troubleshooting

### Common Issues

1. **Account Validation Fails**

    ```bash
    # Fix account configuration
    npx hardhat validate-accounts --fix

    # For secp256r1 networks, regenerate accounts
    npx hardhat generate-secp256r1-env --count 5
    ```

2. **Network Connection Issues**
    - Verify network URL in `hardhat.config.ts`
    - Check firewall and network access
    - Confirm chain ID matches

3. **Deployment Failures**

    ```bash
    # Clean and recompile
    npm run clean
    npm run compile:force

    # Check account balances
    npx hardhat besu-info --network <network>
    ```

4. **Validation Failures**
    - Check contract deployment addresses
    - Verify governance configuration
    - Confirm role assignments

### Error Recovery

**Partial Deployment Recovery:**

1. Note which contracts deployed successfully
2. Check deployment logs for failure points
3. Re-run deployment (idempotent operations)
4. Verify final state with status commands

**Configuration Issues:**

1. Backup current configuration
2. Reset to known good state
3. Re-validate accounts and network settings
4. Retry deployment

## 🔐 Security Best Practices

### Key Management

1. **Production Keys**
    - Use hardware wallets when possible
    - Store private keys in secure key management systems
    - Never commit private keys to version control
    - Use different keys for different environments

2. **Multi-Signature Governance**
    - Consider multi-sig wallets for critical roles
    - Implement time-locks for sensitive operations
    - Document key holder responsibilities

### Network Security

1. **Network Validation**
    - Verify network authenticity
    - Confirm TLS/SSL certificates
    - Monitor for suspicious activity

2. **Access Control**
    - Limit deployment permissions
    - Monitor role assignments
    - Implement principle of least privilege

### Monitoring and Alerts

1. **Deployment Monitoring**
    - Monitor contract deployment status
    - Set up alerts for critical failures
    - Log all deployment activities

2. **Ongoing Monitoring**
    - Monitor contract interactions
    - Alert on pause/unpause events
    - Track role changes and governance actions

## 📚 Production Examples

### MVP Network Deployment (secp256k1)

```bash
# Production deployment to ISBE MVP
npx hardhat deployAll --network mvp --precommit

# Expected results:
# ✅ 27 contracts deployed
# ✅ 13 validations passed
# ✅ Chain ID 2023 confirmed
# ✅ secp256k1 curve detected
```

### Hyperledger Besu Deployment (secp256r1)

```bash
# Production deployment to Hyperledger Besu
npx hardhat deployAll --network customR1Network --precommit

# Expected results:
# ✅ 27 contracts deployed to secp256r1 network
# ✅ Chain ID 2222 confirmed
# ✅ P-256 curve cryptography verified
# ✅ Ethereum-compatible addresses generated
```

## 🎯 Success Criteria

### Deployment Success

- [ ] **All 27 contracts deployed** without errors
- [ ] **Governance factory** at known address
- [ ] **Business logic registry** contains 23 contracts
- [ ] **Use cases** deployed with proper configurations
- [ ] **All validations pass** (13/13 tests)

### Functional Verification

- [ ] **Diamond pattern** working correctly
- [ ] **Access control** roles properly assigned
- [ ] **Pause mechanisms** functional
- [ ] **Interface compliance** verified
- [ ] **Cross-component integration** working

### Performance Verification

- [ ] **Network response time** < 5ms
- [ ] **Deployment time** within expected ranges
- [ ] **Contract sizes** optimized
- [ ] **Gas usage** efficient

This guide has been validated through successful production deployments on both secp256k1 and secp256r1 networks, ensuring reliable and secure deployment procedures for ISBE contracts.

---

_Verified through successful production deployment on customR1Network (secp256r1, Chain ID 2222)_  
_27 contracts deployed, 13 validations passed, 100% success rate_
