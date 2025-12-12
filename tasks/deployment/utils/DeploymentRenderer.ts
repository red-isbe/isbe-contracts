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
import { DeployedUseCase } from '../types/DeploymentTypes'

interface RenderingStrategy {
    render(useCases: DeployedUseCase[]): string | void
}

export class TableRenderingStrategy implements RenderingStrategy {
    private readonly columnWidths = {
        index: 3,
        useCase: 50,
        status: 5,
        proxy: 46,
    }

    render(useCases: DeployedUseCase[]): void {
        if (useCases.length === 0) {
            console.log('   📋 No use cases to display')
            return
        }

        const groupedUseCases = this.groupUseCases(useCases)
        let overallIndex = 1

        // Render each group
        Object.entries(groupedUseCases).forEach(([type, cases], groupIndex) => {
            if (groupIndex > 0) console.log('')

            this.renderGroupHeader(type)
            this.renderTableHeader()
            this.renderSeparator()

            cases.forEach((useCase) => {
                this.renderRow(useCase, overallIndex++)
            })
        })

        this.renderSeparator()
        this.renderSummary(useCases)
    }

    private groupUseCases(
        useCases: DeployedUseCase[]
    ): Record<string, DeployedUseCase[]> {
        return useCases.reduce(
            (groups, useCase) => {
                const type = this.getGroupType(useCase)
                groups[type] = groups[type] || []
                groups[type].push(useCase)
                return groups
            },
            {} as Record<string, DeployedUseCase[]>
        )
    }

    private getGroupType(useCase: DeployedUseCase): string {
        const type = useCase.config?.type || 'unknown'
        if (type === 'erc721') {
            const extensionCount =
                (useCase.config?.description.match(/&/g) || []).length + 1
            return useCase.config?.description === 'ERC721 Base'
                ? 'erc721_base'
                : `erc721_${extensionCount}`
        }
        return type
    }

    private renderGroupHeader(type: string): void {
        const formatted = this.formatGroupType(type)
        console.log(`   📦 ${formatted} DEPLOYMENTS`)
    }

    private formatGroupType(type: string): string {
        if (type.startsWith('erc721_')) {
            const [, count] = type.split('_')
            if (count === 'base') return 'ERC721 BASE'
            return `ERC721 WITH ${count} EXTENSION${count !== '1' ? 'S' : ''}`
        }
        return type.toUpperCase()
    }

    private renderTableHeader(): void {
        const headers = ['#', 'Use Case', 'Status', 'Proxy']
        const headerRow = headers
            .map((header, i) => this.padString(header, this.getColumnWidth(i)))
            .join(' | ')
        console.log(`   | ${headerRow} |`)
    }

    private renderSeparator(): void {
        const separator = Object.values(this.columnWidths)
            .map((width) => '-'.repeat(width))
            .join('-+-')
        console.log(`   +-${separator}-+`)
    }

    private renderRow(useCase: DeployedUseCase, index: number): void {
        const cells = [
            this.padString(index.toString(), this.columnWidths.index, 'right'),
            this.padString(
                this.truncateString(
                    useCase.config?.description || 'Unknown',
                    this.columnWidths.useCase
                ),
                this.columnWidths.useCase
            ),
            this.padString(
                useCase.success ? '✅' : '❌',
                this.columnWidths.status,
                'center'
            ),
            this.padString(
                useCase.proxyAddress || 'N/A',
                this.columnWidths.proxy
            ),
        ]

        console.log(`   | ${cells.join(' | ')} |`)
    }

    private renderSummary(useCases: DeployedUseCase[]): void {
        const successful = useCases.filter((uc) => uc.success).length
        const failed = useCases.length - successful
        console.log(
            `\n   📊 Total: ${useCases.length} | ✅ Success: ${successful} | ❌ Failed: ${failed}`
        )
    }

    private padString(
        str: string,
        width: number,
        align: 'left' | 'center' | 'right' = 'left'
    ): string {
        if (str.length >= width) {
            return str.substring(0, width)
        }

        const padding = width - str.length
        switch (align) {
            case 'center': {
                const leftPad = Math.floor(padding / 2)
                const rightPad = padding - leftPad
                return ' '.repeat(leftPad) + str + ' '.repeat(rightPad)
            }
            case 'right':
                return ' '.repeat(padding) + str
            default:
                return str + ' '.repeat(padding)
        }
    }

    private truncateString(str: string, maxLength: number): string {
        if (str.length <= maxLength) return str
        return str.substring(0, maxLength - 3) + '...'
    }

    private getColumnWidth(index: number): number {
        return Object.values(this.columnWidths)[index] || 20
    }
}

export class JSONRenderingStrategy implements RenderingStrategy {
    render(useCases: DeployedUseCase[]): string {
        const data = {
            timestamp: new Date().toISOString(),
            total: useCases.length,
            successful: useCases.filter((uc) => uc.success).length,
            failed: useCases.filter((uc) => !uc.success).length,
            useCases: useCases.map((uc) => ({
                name: uc.config.description,
                type: uc.config.type,
                configurationId: uc.config.configurationId,
                proxyAddress: uc.proxyAddress,
                success: uc.success,
                error: uc.error?.message,
                businessLogicsCount: uc.config.businessLogicKeys.length,
            })),
        }

        return JSON.stringify(data, null, 2)
    }
}

export class DeploymentRenderer {
    private strategy: RenderingStrategy

    constructor(format: 'table' | 'json' = 'table') {
        this.strategy = this.createStrategy(format)
    }

    setFormat(format: 'table' | 'json'): void {
        this.strategy = this.createStrategy(format)
    }

    render(useCases: DeployedUseCase[]): string | void {
        return this.strategy.render(useCases)
    }

    private createStrategy(format: 'table' | 'json'): RenderingStrategy {
        switch (format) {
            case 'json':
                return new JSONRenderingStrategy()
            case 'table':
            default:
                return new TableRenderingStrategy()
        }
    }
}
