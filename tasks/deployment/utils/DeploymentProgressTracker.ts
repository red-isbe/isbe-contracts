import { LogConfig, LogLevel } from './LoggingEnhancements'

/**
 * Progress tracking for deployments with visual feedback
 */
export class DeploymentProgressTracker {
    private current = 0
    private startTime: number

    constructor(
        private name: string,
        private total: number,
        private silent = false
    ) {
        this.startTime = Date.now()
        if (!silent) {
            console.log(`\n📦 Deploying ${total} ${name}...`)
        }
    }

    increment(): void {
        this.current++
        if (!this.silent && LogConfig.isLevel(LogLevel.VERBOSE)) {
            this.printProgress()
        }
    }

    printSummary(): void {
        if (this.silent) return

        const duration = ((Date.now() - this.startTime) / 1000).toFixed(2)
        console.log(
            `\n📊 Progress: ${this.getProgressBar()} ${this.current}/${
                this.total
            } (${duration}s)`
        )
    }

    private getProgressBar(): string {
        const width = 20
        const progress = Math.floor((this.current / this.total) * width)
        const filled = '█'.repeat(progress)
        const empty = '░'.repeat(width - progress)
        return `[${filled}${empty}]`
    }

    private printProgress(): void {
        const percent = Math.floor((this.current / this.total) * 100)
        const progress = this.getProgressBar()
        console.log(
            `   ${progress} ${percent}% (${this.current}/${this.total})`
        )
    }
}
