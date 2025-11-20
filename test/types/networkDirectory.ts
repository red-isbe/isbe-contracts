import { EllipticType } from './identity'

export const Stage = {
    NONE: 0,
    DEV: 1,
    PRE: 2,
    PROD: 3,
} as const
export type Stage = (typeof Stage)[keyof typeof Stage]

export interface Resource {
    resourceId: string
    resource: string
}

// Define specific types for your event structure
export interface NetworkData {
    chainId: bigint
    name: string
    algorithm: EllipticType
    symbol: string
    stage: Stage
    resources: Resource[]
}

export interface UpdateNetworkData {
    chainId: bigint
    name: string
    algorithm: EllipticType
    symbol: string
    stage: Stage
}
