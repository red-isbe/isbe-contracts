/* -----------------------------------------------------------------------------------
Copyright (c) 2025 Comunidad de Madrid & Alastria
Licensed under the Apache License, Version 2.0 (the "License");
You may not use this file except in compliance with the License.
You may obtain a copy of the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
----------------------------------------------------------------------------------- */
// tasks/deployment/utils/LoggingEnhancements.ts
// Enhanced logging utilities for improved deployment readability

/**
 * Log levels for controlling output verbosity
 */
export enum LogLevel {
    MINIMAL = 0, // Only major steps, errors, and final results
    NORMAL = 1, // Standard level with reduced redundancy
    VERBOSE = 2, // Detailed information (current default)
    DEBUG = 3, // Full debugging information
}

/**
 * Global log level configuration
 */
export class LogConfig {
    private static _level: LogLevel = LogLevel.NORMAL

    static get level(): LogLevel {
        // Check environment variable first
        const envLevel = process.env.LOG_LEVEL?.toUpperCase()
        switch (envLevel) {
            case 'MINIMAL':
                return LogLevel.MINIMAL
            case 'NORMAL':
                return LogLevel.NORMAL
            case 'VERBOSE':
                return LogLevel.VERBOSE
            case 'DEBUG':
                return LogLevel.DEBUG
            default:
                return this._level
        }
    }

    static setLevel(level: LogLevel): void {
        this._level = level
    }

    static isLevel(level: LogLevel): boolean {
        return this.level >= level
    }
}

/**
 * Smart address formatting utilities
 */
export class AddressFormatter {
    /**
     * Format address based on context
     */
    static format(
        address: string,
        context: 'table' | 'deployment' | 'full' = 'deployment'
    ): string {
        if (!address || address === '0x0') return 'N/A'

        switch (context) {
            case 'table':
                return `${address.slice(0, 6)}...${address.slice(-4)}`
            case 'deployment':
                return `${address.slice(0, 10)}...${address.slice(-6)}`
            case 'full':
            default:
                return address
        }
    }

    /**
     * Create clickable address link (for supported terminals)
     */
    static link(address: string, explorerUrl?: string): string {
        if (explorerUrl) {
            return `\x1b]8;;${explorerUrl}/address/${address}\x1b\\${this.format(address)}\x1b]8;;\x1b\\`
        }
        return this.format(address)
    }
}

/**
 * Progress tracking for deployment operations
 */
export class DeploymentProgressTracker {
    private category: string
    private total: number
    private current: number = 0
    private startTime: number
    private items: Array<{
        name: string
        success: boolean
        address?: string
        duration?: number
    }> = []

    constructor(category: string, total: number) {
        this.category = category
        this.total = total
        this.startTime = Date.now()
    }

    /**
     * Log progress with visual progress bar
     */
    logProgress(itemName: string, address?: string): void {
        this.current++
        const percentage = Math.round((this.current / this.total) * 100)
        const completed = Math.round((this.current / this.total) * 10)
        const progressBar = '█'.repeat(completed) + '░'.repeat(10 - completed)

        if (LogConfig.isLevel(LogLevel.NORMAL)) {
            if (address) {
                console.log(
                    `📦 [${this.current}/${this.total}] ${progressBar} ${percentage}% - ${itemName} → ${AddressFormatter.format(address, 'deployment')}`
                )
            } else {
                console.log(
                    `📦 [${this.current}/${this.total}] ${progressBar} ${percentage}% - ${itemName}`
                )
            }
        } else if (LogConfig.isLevel(LogLevel.MINIMAL)) {
            // Only show every 25% or completion
            if (percentage % 25 === 0 || this.current === this.total) {
                console.log(
                    `📦 ${this.category}: ${this.current}/${this.total} (${percentage}%)`
                )
            }
        }

        this.items.push({
            name: itemName,
            success: true,
            address,
            duration: Date.now() - this.startTime,
        })
    }

    /**
     * Log error during deployment
     */
    logError(itemName: string, error: string): void {
        console.error(
            `❌ [${this.current + 1}/${this.total}] Failed: ${itemName} - ${error}`
        )
        this.items.push({
            name: itemName,
            success: false,
        })
    }

    /**
     * Generate summary of deployment progress
     */
    getSummary(): {
        successful: number
        failed: number
        totalDuration: number
    } {
        const successful = this.items.filter((item) => item.success).length
        const failed = this.items.filter((item) => !item.success).length
        const totalDuration = Date.now() - this.startTime

        return { successful, failed, totalDuration }
    }

    /**
     * Print final summary
     */
    printSummary(): void {
        const summary = this.getSummary()
        const durationSeconds = (summary.totalDuration / 1000).toFixed(2)

        if (summary.failed === 0) {
            console.log(
                `✅ ${this.category}: ${summary.successful}/${this.total} successful (${durationSeconds}s)`
            )
        } else {
            console.log(
                `⚠️  ${this.category}: ${summary.successful}/${this.total} successful, ${summary.failed} failed (${durationSeconds}s)`
            )
        }
    }
}

/**
 * Validation results aggregator
 */
export class ValidationSummary {
    private results: Array<{
        category: string
        success: boolean
        message: string
        details?: string
        warning?: boolean
    }> = []

    /**
     * Add validation result
     */
    addResult(
        category: string,
        success: boolean,
        message: string,
        details?: string,
        warning: boolean = false
    ): void {
        this.results.push({
            category,
            success,
            message,
            details,
            warning,
        })
    }

    /**
     * Add successful validation
     */
    addSuccess(category: string, message: string, details?: string): void {
        this.addResult(category, true, message, details)
    }

    /**
     * Add failed validation
     */
    addFailure(category: string, message: string, details?: string): void {
        this.addResult(category, false, message, details)
    }

    /**
     * Add warning validation
     */
    addWarning(category: string, message: string, details?: string): void {
        this.addResult(category, true, message, details, true)
    }

    /**
     * Print consolidated summary
     */
    printSummary(): void {
        const successful = this.results.filter(
            (r) => r.success && !r.warning
        ).length
        const failed = this.results.filter((r) => !r.success).length
        const warnings = this.results.filter((r) => r.warning).length

        console.log('\n📋 VALIDATION RESULTS SUMMARY:')
        console.log('================================')

        if (LogConfig.isLevel(LogLevel.NORMAL)) {
            // Group results by success/failure
            const successes = this.results.filter(
                (r) => r.success && !r.warning
            )
            const failures = this.results.filter((r) => !r.success)
            const warningResults = this.results.filter((r) => r.warning)

            if (successes.length > 0) {
                console.log('✅ SUCCESSFUL VALIDATIONS:')
                successes.forEach((result) => {
                    console.log(`   • ${result.category}: ${result.message}`)
                })
            }

            if (warningResults.length > 0) {
                console.log('\n⚠️  WARNINGS:')
                warningResults.forEach((result) => {
                    console.log(`   • ${result.category}: ${result.message}`)
                })
            }

            if (failures.length > 0) {
                console.log('\n❌ FAILED VALIDATIONS:')
                failures.forEach((result) => {
                    console.log(`   • ${result.category}: ${result.message}`)
                    if (result.details && LogConfig.isLevel(LogLevel.VERBOSE)) {
                        console.log(`     Details: ${result.details}`)
                    }
                })
            }
        }

        // Summary line
        const statusIcon = failed === 0 ? '✅' : '❌'
        console.log(
            `\n${statusIcon} Summary: ${successful} successful, ${warnings} warnings, ${failed} failed`
        )

        if (failed === 0 && warnings === 0) {
            console.log('🎉 All validations passed!')
        }
    }

    /**
     * Check if all validations passed
     */
    allPassed(): boolean {
        return this.results.every((r) => r.success)
    }

    /**
     * Get validation counts
     */
    getCounts(): { successful: number; failed: number; warnings: number } {
        return {
            successful: this.results.filter((r) => r.success && !r.warning)
                .length,
            failed: this.results.filter((r) => !r.success).length,
            warnings: this.results.filter((r) => r.warning).length,
        }
    }
}

/**
 * Enhanced logging utilities
 */
export class EnhancedLogger {
    /**
     * Log network and curve information once per deployment
     */
    static logNetworkInfo(
        networkName: string,
        curveType: string,
        address: string
    ): void {
        if (LogConfig.isLevel(LogLevel.NORMAL)) {
            console.log(`🔐 DEPLOYMENT CONFIGURATION:`)
            console.log(`   • Network: ${networkName}`)
            console.log(`   • Signature curve: ${curveType}`)
            console.log(
                `   • Deployer: ${AddressFormatter.format(address, 'full')}`
            )
            console.log(`   • Log level: ${LogLevel[LogConfig.level]}`)
        }
    }

    /**
     * Log section headers with improved formatting
     */
    static logSection(title: string, subtitle?: string): void {
        if (LogConfig.isLevel(LogLevel.NORMAL)) {
            console.log(`\n🏗️ ${title.toUpperCase()}`)
            if (subtitle) {
                console.log(`   ${subtitle}`)
            }
        }
    }

    /**
     * Log transaction with smart verbosity
     */
    static logTransaction(
        contractName: string,
        address: string,
        txHash: string,
        blockNumber?: number
    ): void {
        if (LogConfig.isLevel(LogLevel.VERBOSE)) {
            console.log(`   ⏳ Transaction: ${txHash}`)
            if (blockNumber) {
                console.log(`   ✅ Confirmed in block ${blockNumber}`)
            }
            console.log(`   ✅ ${contractName} deployed at: ${address}`)
        } else if (LogConfig.isLevel(LogLevel.NORMAL)) {
            console.log(
                `📦 ${contractName} → ${AddressFormatter.format(address, 'deployment')}${blockNumber ? ` (block ${blockNumber})` : ''}`
            )
        }
        // MINIMAL level shows nothing for individual transactions
    }

    /**
     * Log with conditional verbosity
     */
    static log(level: LogLevel, message: string): void {
        if (LogConfig.isLevel(level)) {
            console.log(message)
        }
    }

    /**
     * Always log errors regardless of level
     */
    static error(message: string, details?: string): void {
        console.error(`❌ ${message}`)
        if (details && LogConfig.isLevel(LogLevel.NORMAL)) {
            console.error(`   ${details}`)
        }
    }

    /**
     * Log warnings based on level
     */
    static warn(message: string, details?: string): void {
        if (LogConfig.isLevel(LogLevel.NORMAL)) {
            console.warn(`⚠️  ${message}`)
            if (details && LogConfig.isLevel(LogLevel.VERBOSE)) {
                console.warn(`   ${details}`)
            }
        }
    }
}

/**
 * Deployment timing utilities
 */
export class DeploymentTimer {
    private startTime: number
    private stepTimes: Map<string, number> = new Map()
    private currentStep?: string

    constructor() {
        this.startTime = Date.now()
    }

    /**
     * Start timing a step
     */
    startStep(stepName: string): void {
        if (this.currentStep) {
            this.endStep()
        }
        this.currentStep = stepName
        this.stepTimes.set(stepName, Date.now())
    }

    /**
     * End current step timing
     */
    endStep(): void {
        if (this.currentStep) {
            const startTime = this.stepTimes.get(this.currentStep)
            if (startTime) {
                const duration = Date.now() - startTime
                this.stepTimes.set(this.currentStep, duration)
                EnhancedLogger.log(
                    LogLevel.VERBOSE,
                    `   ⏱️  Step '${this.currentStep}' completed in ${(duration / 1000).toFixed(2)}s`
                )
            }
            this.currentStep = undefined
        }
    }

    /**
     * Get total deployment time
     */
    getTotalTime(): number {
        return Date.now() - this.startTime
    }

    /**
     * Print timing summary
     */
    printSummary(): void {
        const totalSeconds = (this.getTotalTime() / 1000).toFixed(2)
        console.log(`\n⏱️  DEPLOYMENT TIMING: ${totalSeconds}s total`)

        if (LogConfig.isLevel(LogLevel.VERBOSE)) {
            console.log('   Step breakdown:')
            for (const [step, duration] of this.stepTimes) {
                if (typeof duration === 'number' && duration > 0) {
                    const seconds = (duration / 1000).toFixed(2)
                    console.log(`   • ${step}: ${seconds}s`)
                }
            }
        }
    }
}
