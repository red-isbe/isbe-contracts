/**
 * @file index.ts
 * @description Exports all DidDocumentDetailedFacet tasks
 * @module tasks/didDocument
 */

// Initialization
export * from './initializeDiDRegistry'

// Read Operations
export * from './getDidDocument'
export * from './getDidDocumentByTimestamp'
export * from './getDids'
export * from './getNetworkEllipticType'

// Write Operations
export * from './updateAlsoKnownAs'
export * from './updateBaseDocument'
export * from './insertDidDocument'
export * from './insertFirstDidDocument'
