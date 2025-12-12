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
