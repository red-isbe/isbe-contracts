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
import fs from 'fs'
import path from 'path'
import { DeployedUseCase, DeploymentResult } from '../types/DeploymentTypes'

/**
 * Utility for exporting deployment tables to different formats
 */
export class TableExporter {
    /**
     * Exports deployment results to a JSON file
     */
    exportToJSON(result: DeploymentResult, filename?: string): string {
        const exportData = {
            deployment: {
                timestamp: result.summary.startTime.toISOString(),
                duration: result.summary.endTime
                    ? result.summary.endTime.getTime() -
                      result.summary.startTime.getTime()
                    : null,
                success: result.summary.success,
                network: process.env.HARDHAT_NETWORK || 'unknown',
            },
            governance: {
                address: result.governance?.address || null,
                success: !!result.governance,
            },
            businessLogics: {
                total: result.businessLogics.length,
                successful: result.businessLogics.filter((bl) => bl.success)
                    .length,
                failed: result.businessLogics.filter((bl) => !bl.success)
                    .length,
                items: result.businessLogics.map((bl) => ({
                    description: bl.config.description,
                    key: bl.config.key,
                    address: bl.address,
                    success: bl.success,
                    error: bl.error,
                })),
            },
            useCases: {
                total: result.useCases.length,
                successful: result.useCases.filter((uc) => uc.success).length,
                failed: result.useCases.filter((uc) => !uc.success).length,
                items: result.useCases.map((uc) => ({
                    name: uc.config.description,
                    type: uc.config.type,
                    configurationId: uc.config.configurationId,
                    proxyAddress: uc.proxyAddress,
                    success: uc.success,
                    error: uc.error,
                    businessLogicsCount: uc.config.businessLogicKeys.length,
                })),
            },
        }

        const outputFilename =
            filename || `deployment-result-${Date.now()}.json`
        const outputPath = path.join(
            process.cwd(),
            'deployments',
            outputFilename
        )

        // Create directory if it doesn't exist
        const deploymentsDir = path.join(process.cwd(), 'deployments')
        if (!fs.existsSync(deploymentsDir)) {
            fs.mkdirSync(deploymentsDir, { recursive: true })
        }

        fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2))

        console.log(`\n💾 Results exported to: ${outputPath}`)
        return outputPath
    }

    /**
     * Exports only the use cases table to CSV
     */
    exportUseCasesToCSV(
        useCases: DeployedUseCase[],
        filename?: string
    ): string {
        const headers = [
            'Name',
            'Type',
            'Configuration ID',
            'Proxy Address',
            'Success',
            'Error',
        ]
        const csvContent = [
            headers.join(','),
            ...useCases.map((uc) =>
                [
                    `"${uc.config.description}"`,
                    uc.config.type,
                    uc.config.configurationId,
                    uc.proxyAddress || 'N/A',
                    uc.success.toString(),
                    `"${uc.error || ''}"`,
                ].join(',')
            ),
        ].join('\n')

        const outputFilename = filename || `use-cases-${Date.now()}.csv`
        const outputPath = path.join(
            process.cwd(),
            'deployments',
            outputFilename
        )

        // Create directory if it doesn't exist
        const deploymentsDir = path.join(process.cwd(), 'deployments')
        if (!fs.existsSync(deploymentsDir)) {
            fs.mkdirSync(deploymentsDir, { recursive: true })
        }

        fs.writeFileSync(outputPath, csvContent)

        console.log(`\n📊 Use cases exported to CSV: ${outputPath}`)
        return outputPath
    }

    /**
     * Exports a markdown table with the use cases
     */
    exportUseCasesToMarkdown(
        useCases: DeployedUseCase[],
        filename?: string
    ): string {
        const markdownContent = [
            '# Deployed Use Cases',
            '',
            `Generated on: ${new Date().toISOString()}`,
            '',
            '## Summary',
            '',
            `- Total: ${useCases.length}`,
            `- Successful: ${useCases.filter((uc) => uc.success).length}`,
            `- Failed: ${useCases.filter((uc) => !uc.success).length}`,
            '',
            '## Use Cases Table',
            '',
            '| # | Name | Type | Status | Proxy Address |',
            '|---|--------|------|--------|-------------------|',
        ]

        useCases.forEach((uc, index) => {
            const status = uc.success ? '✅ Successful' : '❌ Failed'
            const address = uc.proxyAddress || 'N/A'
            markdownContent.push(
                `| ${index + 1} | ${uc.config.description} | ${uc.config.type} | ${status} | \`${address}\` |`
            )
        })

        if (useCases.some((uc) => !uc.success)) {
            markdownContent.push('', '## Errors', '')

            useCases
                .filter((uc) => !uc.success)
                .forEach((uc, index) => {
                    markdownContent.push(
                        `### ${index + 1}. ${uc.config.description}`,
                        '',
                        `**Error**: ${uc.error}`,
                        `**Configuration ID**: \`${uc.config.configurationId}\``,
                        ''
                    )
                })
        }

        const outputFilename = filename || `use-cases-${Date.now()}.md`
        const outputPath = path.join(
            process.cwd(),
            'deployments',
            outputFilename
        )

        // Create directory if it doesn't exist
        const deploymentsDir = path.join(process.cwd(), 'deployments')
        if (!fs.existsSync(deploymentsDir)) {
            fs.mkdirSync(deploymentsDir, { recursive: true })
        }

        fs.writeFileSync(outputPath, markdownContent.join('\n'))

        console.log(`\n📄 Documentation generated: ${outputPath}`)
        return outputPath
    }
}
