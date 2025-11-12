/**
 * deploy:selective - Despliegue selectivo de use cases
 *
 * Permite desplegar solo ciertos use cases por categoría o extensión
 */

import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import path from 'path'
import fs from 'fs'

task('deploy:selective', 'Despliegue selectivo de use cases')
    .addOptionalParam(
        'categories',
        'Categorías a desplegar (comma-separated): erc20,erc721,utility,ens,client',
        undefined
    )
    .addOptionalParam(
        'extensions',
        'Extensiones a incluir (comma-separated): burnable,snapshot,capped,enumerable,etc',
        undefined
    )
    .addOptionalParam(
        'selectiveConfig',
        'Archivo JSON de configuración custom',
        undefined
    )
    .addOptionalParam('governance', 'Dirección del Governance Diamond', undefined)
    .addOptionalParam('logLevel', 'Nivel de logging', 'normal')
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        console.log('🎯 ISBE Selective Deployment')
        console.log(`   Network: ${hre.network.name}`)

        if (taskArgs.categories) {
            console.log(`   Categories: ${taskArgs.categories}`)
        }
        if (taskArgs.extensions) {
            console.log(`   Extensions: ${taskArgs.extensions}`)
        }
        if (taskArgs.selectiveConfig) {
            console.log(`   Config file: ${taskArgs.selectiveConfig}`)
        }
        console.log('')

        try {
            let configFile: string | undefined

            // Si se especifica un archivo de configuración, usarlo
            if (taskArgs.selectiveConfig) {
                configFile = taskArgs.selectiveConfig
            }
            // Si se especifican categorías o extensiones, generar archivo temporal
            else if (taskArgs.categories || taskArgs.extensions) {
                configFile = await generateSelectiveConfig(
                    taskArgs.categories,
                    taskArgs.extensions
                )
            } else {
                throw new Error(
                    'Debe especificar --categories, --extensions, o --selective-config'
                )
            }

            // Llamar a deployAllClean con el archivo de configuración
            await hre.run('deployAllClean', {
                configFile,
                logLevel: taskArgs.logLevel,
            })

            console.log('')
            console.log('✅ Despliegue selectivo exitoso')
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error)
            console.error('❌ Error en despliegue selectivo:', errorMessage)
            throw error
        }
    })

interface SelectiveConfig {
    description: string
    version: string
    includeAllBusinessLogics: boolean
    useCaseFilters: {
        enabled: boolean
        categories?: string[]
        includePatterns?: string[]
    }
    metadata?: {
        author: string
        created: string
        purpose: string
    }
}

/**
 * Genera un archivo de configuración temporal basado en categorías y extensiones
 */
async function generateSelectiveConfig(
    categories?: string,
    extensions?: string
): Promise<string> {
    const config: SelectiveConfig = {
        description: 'Selective deployment configuration',
        version: '1.0.0',
        includeAllBusinessLogics: true,
        useCaseFilters: {
            enabled: true,
        },
    }

    // Agregar filtros de categorías
    if (categories) {
        const categoryList = categories.split(',').map((c) => c.trim())
        config.useCaseFilters.categories = categoryList
    }

    // Agregar filtros de extensiones
    if (extensions) {
        const extensionList = extensions.split(',').map((e) => e.trim())
        config.useCaseFilters.includePatterns = extensionList.map(
            (ext) => `w/${ext.charAt(0).toUpperCase() + ext.slice(1)}`
        )
    }

    config.metadata = {
        author: 'ISBE Deploy CLI',
        created: new Date().toISOString(),
        purpose: 'Selective deployment',
    }

    // Escribir archivo temporal
    const tempDir = path.join(process.cwd(), 'deployment-configs')
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true })
    }

    const tempFile = path.join(tempDir, 'selective-temp.json')
    fs.writeFileSync(tempFile, JSON.stringify(config, null, 2))

    console.log(` Generated config: ${tempFile}`)

    return 'selective-temp'
}
