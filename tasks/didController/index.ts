/**
 * @file index.ts
 * @description Exports all DidControllerFacet tasks
 * @module tasks/didController
 */

// Read Operations
export * from './checkControllerByBytes'
export * from './checkControllerByDid'
export * from './getDidsByController'

// Write Operations
export * from './addController'
export * from './revokeController'
