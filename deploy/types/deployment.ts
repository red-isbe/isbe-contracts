/**
 * Deployment-specific types
 */

import { DeploymentPhase, LogLevel, Network, CurveType } from './index'

export interface BaseDeploymentOptions {
    network: Network
    logLevel?: LogLevel
    debug?: boolean
    skipValidation?: boolean
}

export interface PhaseDeploymentOptions extends BaseDeploymentOptions {
    phase: DeploymentPhase
    governanceAddress?: string
}

export interface DeploymentContext {
    network: Network
    curveType: CurveType
    deployer: string
    governanceAddress?: string
    logLevel: LogLevel
    debug: boolean
}

export interface DeploymentStep {
    name: string
    phase: DeploymentPhase
    description: string
    execute: () => Promise<void>
    rollback?: () => Promise<void>
}

export interface DeploymentPlan {
    steps: DeploymentStep[]
    context: DeploymentContext
    validateBefore: boolean
    validateAfter: boolean
}
