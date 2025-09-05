import fs from 'fs'
import path from 'path'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

/**
 * Utility for extracting bytecode from compiled artifacts
 */
export class BytecodeExtractor {
    constructor(private hre: HardhatRuntimeEnvironment) {}

    extractFromArtifact(contractName: string, artifactPath: string): string {
        try {
            // Build the complete artifact path
            const fullArtifactPath = this.buildArtifactPath(
                contractName,
                artifactPath
            )

            // Verify that the file exists
            if (!fs.existsSync(fullArtifactPath)) {
                throw new Error(`Artifact not found: ${fullArtifactPath}`)
            }

            // Read the artifact JSON file
            const artifactContent = fs.readFileSync(fullArtifactPath, 'utf8')
            const artifact = JSON.parse(artifactContent)

            // Extract the bytecode
            if (!artifact.bytecode) {
                throw new Error(
                    `Bytecode not found in the artifact: ${contractName}`
                )
            }

            return artifact.bytecode
        } catch (error) {
            console.error(
                `Error extracting bytecode for ${contractName}:`,
                error.message
            )
            throw error
        }
    }

    private buildArtifactPath(
        contractName: string,
        artifactPath: string
    ): string {
        // Build the artifact path following Hardhat's structure
        // artifacts/contracts/path/ContractName.sol/ContractName.json
        const baseArtifactsPath = path.join(process.cwd(), 'artifacts')
        const contractFileName = `${contractName}.json`

        // Combine the base path with the specific path
        return path.join(baseArtifactsPath, artifactPath, contractFileName)
    }

    validateArtifactExists(
        contractName: string,
        artifactPath: string
    ): boolean {
        const fullPath = this.buildArtifactPath(contractName, artifactPath)
        return fs.existsSync(fullPath)
    }

    extractAllFromDirectory(artifactPath: string): Record<string, string> {
        const artifacts: Record<string, string> = {}
        const fullPath = path.join(process.cwd(), 'artifacts', artifactPath)

        try {
            if (!fs.existsSync(fullPath)) {
                throw new Error(`Directory not found: ${fullPath}`)
            }

            const files = fs.readdirSync(fullPath)

            for (const file of files) {
                if (file.endsWith('.sol')) {
                    const solDir = path.join(fullPath, file)
                    if (fs.statSync(solDir).isDirectory()) {
                        const jsonFiles = fs
                            .readdirSync(solDir)
                            .filter((f) => f.endsWith('.json'))

                        for (const jsonFile of jsonFiles) {
                            const contractName = path.basename(
                                jsonFile,
                                '.json'
                            )
                            try {
                                artifacts[contractName] =
                                    this.extractFromArtifact(
                                        contractName,
                                        artifactPath
                                    )
                            } catch (error) {
                                console.warn(
                                    `Could not extract bytecode for ${contractName}:`,
                                    error.message
                                )
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error(
                `Error extracting artifacts from directory ${artifactPath}:`,
                error.message
            )
            throw error
        }

        return artifacts
    }
}
