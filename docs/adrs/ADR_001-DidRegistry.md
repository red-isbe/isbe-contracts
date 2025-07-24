# ADR_001: DidRegistryFacet Integration with Governance Diamond

# Table of contents

- [Status](#status)
- [Context](#context)
- [Decision](#decision)
    - [1. Conversion to DidRegistryFacet](#1-conversion-to-didregistryfacet)
    - [2. Disabling policy registry](#2-disabling-policy-registry)
- [Benefits](#benefits)
- [Implementation phases](#implementation-phases)

## Status

Proposal

## Context

The current system has an independent DidRegistry contract that handles decentralised identity (DID) management. Integration of this functionality into the governance diamond is required to centralise access control and improve security.

![DidRegistry entities](../diagrams/DidRegistry.png)

## Decision

We propose to restructure the DidRegistry system following the Diamond pattern (EIP-2535) with the following changes:

### 1. Conversion to DidRegistryFacet

- Transform `DidRegistry` into `DidRegistryFacet` as part of the governance diamond
- Maintain all existing business logic in `DidDocumentDetailed`
- Integrate role-based access control (Pending to be applied)

### 2. Disabling policy registry

As it is a managed registry by ISBE, the policy registry is not necessary.

## Benefits

1. **Centralised Control**: All access management is performed through the governance diamond
2. **Enhanced Security**: Granular roles for different access levels
3. **Compatibility**: Maintains the existing DidRegistry interface
4. **Scalability**: Leverages Diamond architecture for future extensions
5. **Auditability**: Centralised access control facilitates monitoring

## Implementation phases

- Define minimum storage layout, prepare roles and implement insertDiDDocument and getDidDocument.
- Implement updateBaseDocument, getDids and getDidDocumentByTimestamp.
- Implement addController, revokeController, getDidsByController & checkController.
- Implement addVerificationMethod, revokeVerificationMethod, expireVerificationMethod.
- Implement addVerificationRelationship, rollVerificationMethod, getDidsByVerificationRelationship.
- Implement getDids, integrate in deployment scripts and test it.
