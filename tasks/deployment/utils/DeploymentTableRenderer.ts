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

        // Calculate column widths
        const headers = ['#', 'Use Case', 'Type', 'Status', 'Proxy Address']
        const columnWidths = this.calculateColumnWidths(useCases, headers)

        // Render header
        this.renderTableHeader(headers, columnWidths)

        // Render separator
        this.renderTableSeparator(columnWidths)

        // Render rows
        useCases.forEach((useCase, index) => {
            this.renderUseCaseRow(useCase, index + 1, columnWidths)
        })

        // Render final separator
        this.renderTableSeparator(columnWidths)

        // Show summary
        const successful = useCases.filter((uc) => uc.success).length
        const failed = useCases.filter((uc) => !uc.success).length
        console.log(
            `   📊 Total: ${useCases.length} | ✅ Successful: ${successful} | ❌ Failed: ${failed}`
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
                this.truncateString(useCase.config.description, 25),
                this.capitalizeFirst(useCase.config.type),
                useCase.success ? 'Successful' : 'Failed',
                useCase.proxyAddress || 'N/A',
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
        const maxWidths = [3, 30, 15, 10, 42] // Maximum per column
        return maxWidths[columnIndex] || 20
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
        const statusText = useCase.success ? 'Success' : 'Failed'

        const cells = [
            this.padString(index.toString(), widths[0], 'center'),
            this.padString(
                this.truncateString(useCase.config.description, widths[1]),
                widths[1]
            ),
            this.padString(
                this.capitalizeFirst(useCase.config.type),
                widths[2],
                'center'
            ),
            this.padString(`${statusIcon} ${statusText}`, widths[3], 'center'),
            this.padString(useCase.proxyAddress || 'N/A', widths[4]),
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
