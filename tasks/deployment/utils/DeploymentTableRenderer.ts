import { DeployedUseCase } from '../types/DeploymentTypes'

/**
 * Utility for rendering formatted tables of deployment results
 */
export class DeploymentTableRenderer {
    /**
     * Renders a table with deployed use cases and their proxy addresses
     */
    renderUseCasesTable(useCases: DeployedUseCase[]): void {
        if (useCases.length === 0) {
            console.log('   📋 No use cases to display')
            return
        }

        // Group use cases by type
        const groupedUseCases = this.groupUseCasesByType(useCases)

        // Calculate column widths
        const headers = ['#', 'Use Case', 'Status', 'Proxy']
        const columnWidths = this.calculateColumnWidths(useCases, headers)

        // Initialize counter for overall numbering
        let overallIndex = 1

        // Render each group
        Object.entries(groupedUseCases).forEach(([type, cases], groupIndex) => {
            // Add group header
            if (groupIndex > 0) console.log('')
            console.log(`   📦 ${this.formatGroupHeader(type)}`)

            // Render header for this group
            this.renderTableHeader(headers, columnWidths)
            this.renderTableSeparator(columnWidths)

            // Render rows for this group
            cases.forEach((useCase) => {
                this.renderUseCaseRow(useCase, overallIndex++, columnWidths)
            })
        })

        // Render final separator
        this.renderTableSeparator(columnWidths)

        // Show final summary with progress bar
        const successful = useCases.filter((uc) => uc.success).length
        const failed = useCases.filter((uc) => !uc.success).length
        const progress = this.getProgressBar(successful, useCases.length)
        console.log(`\n   📊 Deployment Progress: ${progress}`)
        console.log(
            `   ✨ Total: ${useCases.length} | ✅ Success: ${successful} | ❌ Failed: ${failed}`
        )
    }

    private calculateColumnWidths(
        useCases: DeployedUseCase[],
        headers: string[]
    ): number[] {
        // Minimum widths based on headers
        const minWidths = headers.map((header) => header.length)

        // Adjust based on content
        const widths = [...minWidths]

        useCases.forEach((useCase, index) => {
            const rowData = [
                (index + 1).toString(),
                useCase.config?.description || 'Unknown Use Case', // full description for width calc
                useCase.success ? '✅' : '❌', // compact status
                useCase.proxyAddress || 'N/A', // full proxy address
            ]

            rowData.forEach((cell, colIndex) => {
                if (cell.length > widths[colIndex]) {
                    widths[colIndex] = Math.min(
                        cell.length,
                        this.getMaxColumnWidth(colIndex)
                    )
                }
            })
        })

        return widths
    }

    private getMaxColumnWidth(columnIndex: number): number {
        // Increase Use Case and Proxy columns; shrink Status
        const maxWidths = [3, 50, 5, 46] // [#, Use Case, Status, Proxy]
        return maxWidths[columnIndex] || 20
    }

    private groupUseCasesByType(
        useCases: DeployedUseCase[]
    ): Record<string, DeployedUseCase[]> {
        const groups: Record<string, DeployedUseCase[]> = {}

        useCases.forEach((useCase) => {
            const type = useCase.config?.type || 'Unknown'
            if (type === 'erc721') {
                // Count extensions in the description
                const extensionCount =
                    (useCase.config?.description.match(/&/g) || []).length + 1
                if (useCase.config?.description === 'ERC721 Base') {
                    groups['erc721_base'] = [useCase]
                } else if (useCase.config?.description === 'ERC721 Complete') {
                    groups['erc721_complete'] = [useCase]
                } else {
                    const groupKey = `erc721_${extensionCount}`
                    if (!groups[groupKey]) {
                        groups[groupKey] = []
                    }
                    groups[groupKey].push(useCase)
                }
            } else {
                if (!groups[type]) {
                    groups[type] = []
                }
                groups[type].push(useCase)
            }
        })

        // Sort the ERC721 groups by extension count
        const sortedGroups: Record<string, DeployedUseCase[]> = {}
        Object.keys(groups).filter((k) => k.startsWith('erc721'))
        const nonErc721Types = Object.keys(groups).filter(
            (k) => !k.startsWith('erc721')
        )

        // First add base
        if (groups['erc721_base']) {
            sortedGroups['erc721_base'] = groups['erc721_base']
        }

        // Get all groups and sort them by extension count
        const erc721GroupKeys = Object.keys(groups)
            .filter((key) => key.startsWith('erc721_'))
            .sort((a, b) => {
                const aNum = parseInt(a.split('_')[1]) || 0
                const bNum = parseInt(b.split('_')[1]) || 0
                return aNum - bNum
            })

        // Add all groups in order
        erc721GroupKeys.forEach((key) => {
            if (key !== 'erc721_base' && groups[key]) {
                sortedGroups[key] = groups[key].sort((a, b) =>
                    (a.config?.description || '').localeCompare(
                        b.config?.description || ''
                    )
                )
            }
        })

        // Add non-ERC721 groups
        nonErc721Types.forEach((key) => {
            sortedGroups[key] = groups[key]
        })

        return sortedGroups
    }

    private formatGroupHeader(type: string): string {
        let formatted: string
        if (type.startsWith('erc721_')) {
            const parts = type.split('_')
            if (parts[1] === 'base') {
                formatted = 'ERC721 BASE'
            } else if (parts[1] === '1') {
                formatted = 'ERC721 WITH 1 EXTENSION'
            } else if (parts[1] === '2') {
                formatted = 'ERC721 WITH 2 EXTENSIONS'
            } else if (parts[1] === '3') {
                formatted = 'ERC721 WITH 3 EXTENSIONS'
            } else if (parts[1] === '4') {
                formatted = 'ERC721 WITH 4 EXTENSIONS'
            } else if (parts[1] === '5') {
                formatted = 'ERC721 WITH 5 EXTENSIONS'
            } else if (parts[1] === '6') {
                formatted = 'ERC721 WITH 6 EXTENSIONS'
            } else if (parts[1] === 'complete') {
                formatted = 'ERC721 COMPLETE'
            } else {
                formatted = 'ERC721'
            }
        } else {
            formatted = type.toUpperCase().replace('_', ' ')
        }
        const count = this.getProgressBar()
        return `${formatted} DEPLOYMENTS ${count}`
    }

    private getProgressBar(current: number = 0, total: number = 0): string {
        const width = 20
        const progress =
            total > 0 ? Math.floor((current / total) * width) : width
        const filled = '█'.repeat(progress)
        const empty = '░'.repeat(width - progress)
        return `[${filled}${empty}]`
    }

    private renderTableHeader(headers: string[], widths: number[]): void {
        const headerRow = headers
            .map((header, index) =>
                this.padString(header, widths[index], 'center')
            )
            .join(' | ')

        console.log(`   | ${headerRow} |`)
    }

    private renderTableSeparator(widths: number[]): void {
        const separator = widths.map((width) => '-'.repeat(width)).join('-+-')
        console.log(`   +-${separator}-+`)
    }

    private renderUseCaseRow(
        useCase: DeployedUseCase,
        index: number,
        widths: number[]
    ): void {
        const statusIcon = useCase.success ? '✅' : '❌'

        const cells = [
            this.padString(index.toString(), widths[0], 'right'),
            this.padString(
                this.truncateString(
                    useCase.config?.description || 'Unknown Use Case',
                    widths[1]
                ),
                widths[1]
            ),
            this.padString(`${statusIcon}`, widths[2], 'center'),
            this.padString(useCase.proxyAddress || 'N/A', widths[3], 'left'),
        ]

        const row = cells.join(' | ')
        console.log(`   | ${row} |`)
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

        // ❌ Before - Lexical declarations without braces
        switch (align) {
            case 'center': {
                const leftPad = Math.floor(padding / 2)
                const rightPad = padding - leftPad
                return ' '.repeat(leftPad) + str + ' '.repeat(rightPad)
            }
            case 'right': {
                return ' '.repeat(padding) + str
            }
            default: {
                return str + ' '.repeat(padding)
            }
        }
    }

    private truncateString(str: string, maxLength: number): string {
        if (str.length <= maxLength) {
            return str
        }
        return str.substring(0, maxLength - 3) + '...'
    }

    private capitalizeFirst(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
    }

    /**
     * Renders a simplified table with just names and addresses
     */
    renderSimpleUseCasesTable(useCases: DeployedUseCase[]): void {
        console.log('\n📋 USE CASES AND PROXIES TABLE:')
        console.log('====================================')

        if (useCases.length === 0) {
            console.log('   ℹ️  No deployed use cases')
            return
        }

        const successfulUseCases = useCases.filter((uc) => uc.success)

        if (successfulUseCases.length === 0) {
            console.log('   ❌ No successful use cases to display')
            return
        }

        // Calculate maximum width for alignment
        const maxNameLength = Math.max(
            ...successfulUseCases.map((uc) => uc.config.description.length),
            20 // minimum
        )

        console.log(`   ${'Use Case'.padEnd(maxNameLength)} | Proxy Address`)
        console.log(`   ${'-'.repeat(maxNameLength)}-+-${'-'.repeat(42)}`)

        successfulUseCases.forEach((useCase) => {
            const name = useCase.config.description.padEnd(maxNameLength)
            const address = useCase.proxyAddress || 'N/A'
            console.log(`   ${name} | ${address}`)
        })

        console.log(`   ${'-'.repeat(maxNameLength)}-+-${'-'.repeat(42)}`)
        console.log(
            `   📊 Total successful proxies: ${successfulUseCases.length}`
        )
    }

    /**
     * Exports use case information to JSON format
     */
    exportUseCasesToJSON(useCases: DeployedUseCase[]): string {
        const exportData = {
            timestamp: new Date().toISOString(),
            network: 'current', // Can be passed as a parameter
            total: useCases.length,
            successful: useCases.filter((uc) => uc.success).length,
            failed: useCases.filter((uc) => !uc.success).length,
            useCases: useCases.map((uc) => ({
                name: uc.config.description,
                type: uc.config.type,
                configurationId: uc.config.configurationId,
                proxyAddress: uc.proxyAddress,
                success: uc.success,
                error: uc.error,
                businessLogicsCount: uc.config.businessLogicKeys.length,
            })),
        }

        return JSON.stringify(exportData, null, 2)
    }
}
