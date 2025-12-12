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
import { EventEmitter } from 'events'
import {
    TokenConfiguration,
    DeploymentResult,
    DeploymentEnvironment,
    DeploymentStrategy,
    DeploymentEvent,
} from '../types/configuration'

export class DeploymentQueue {
    private queue: TokenConfiguration[] = []
    private events = new EventEmitter()
    private processing = false

    constructor(
        private strategy: DeploymentStrategy,
        private env: DeploymentEnvironment
    ) {}

    addToQueue(config: TokenConfiguration): void {
        this.queue.push(config)
        this.events.emit('queueUpdated', this.getProgress())
    }

    addListener(event: string, listener: (...args: unknown[]) => void): void {
        this.events.addListener(event, listener)
    }

    removeListener(
        event: string,
        listener: (...args: unknown[]) => void
    ): void {
        this.events.removeListener(event, listener)
    }

    getProgress(): DeploymentProgress {
        return {
            total: this.queue.length,
            completed: 0,
            failed: 0,
            inProgress: this.processing ? 1 : 0,
        }
    }

    async processQueue(
        options: {
            concurrent?: number
            retries?: number
        } = {}
    ): Promise<DeploymentResult[]> {
        const { concurrent = 1, retries = 3 } = options
        const results: DeploymentResult[] = []
        this.processing = true

        try {
            // Process in batches based on concurrency
            for (let i = 0; i < this.queue.length; i += concurrent) {
                const batch = this.queue.slice(i, i + concurrent)
                const batchResults = await Promise.all(
                    batch.map((config) =>
                        this.processDeployment(config, retries)
                    )
                )
                results.push(...batchResults)
            }
        } finally {
            this.processing = false
        }

        this.events.emit('queueCompleted', results)
        return results
    }

    private async processDeployment(
        config: TokenConfiguration,
        retries: number
    ): Promise<DeploymentResult> {
        let attempt = 0
        let lastError: Error | undefined

        this.emitDeploymentEvent('start', config)

        while (attempt < retries) {
            try {
                const result = await this.strategy.deploy(config, this.env)
                this.emitDeploymentEvent('success', config)
                return result
            } catch (error) {
                lastError = error as Error
                attempt++
                if (attempt < retries) {
                    await new Promise((resolve) =>
                        setTimeout(resolve, 1000 * attempt)
                    )
                }
            }
        }

        const result: DeploymentResult = {
            success: false,
            configurationId: config.id,
            error: lastError,
        }

        this.emitDeploymentEvent('error', config, lastError)
        return result
    }

    private emitDeploymentEvent(
        type: DeploymentEvent['type'],
        config: TokenConfiguration,
        error?: Error
    ): void {
        this.events.emit('deploymentEvent', {
            type,
            useCaseConfig: config,
            error,
        })
    }
}
