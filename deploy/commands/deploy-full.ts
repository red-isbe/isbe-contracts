/**
 * deploy:full - Despliegue completo del sistema
 *
 * Este comando es un wrapper que llama a deployAllClean existente
 * con una interfaz más intuitiva y documentada
 */

import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

interface DeployArgs {
    logLevel: string
    precommit: boolean
    noDeployUseCases?: boolean
    configFile?: string
}

task('deploy:full', 'Despliegue completo del sistema ISBE')
    .addOptionalParam(
        'preset',
        'Preset de use cases: minimal, essentials, complete',
        'complete'
    )
    .addOptionalParam(
        'logLevel',
        'Nivel de logging: minimal, normal, verbose, debug',
        'normal'
    )
    .addFlag('precommit', 'Ejecutar validaciones completas post-despliegue')
    .addFlag('noUseCases', 'No desplegar use cases (solo configuraciones)')
    .addOptionalParam(
        'configFile',
        'Archivo JSON de configuración selectiva',
        undefined
    )
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        console.log('')

        // Mapear argumentos al formato de deployAllClean
        const deployArgs: DeployArgs = {
            logLevel: taskArgs.logLevel,
            precommit: taskArgs.precommit || false,
        }

        // Si se especifica no desplegar use cases
        if (taskArgs.noUseCases) {
            deployArgs.noDeployUseCases = true
        }

        // Si se especifica un archivo de configuración
        if (taskArgs.configFile) {
            deployArgs.configFile = taskArgs.configFile
        }

        try {
            // Llamar a la task existente deployAllClean
            await hre.run('deployAllClean', deployArgs)

            console.log('')
            console.log('✅ Despliegue completo exitoso')
            console.log(
                `   Documentación: deploy/docs/02-deployment-phases.md`
            )
        } catch (error) {
            console.error('❌ Error en despliegue completo:', error instanceof Error ? error.message : error)
            throw error
        }
    })
