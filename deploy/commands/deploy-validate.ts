/**
 * deploy:validate - Validar despliegue existente
 *
 * Wrapper sobre las validaciones existentes
 */

import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

task('deploy:validate', 'Validar despliegue existente')
    .addParam('governance', 'Dirección del Governance Diamond')
    .addFlag('full', 'Ejecutar validaciones completas')
    .addFlag('quick', 'Solo validaciones rápidas')
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        console.log('🔍 ISBE Deployment Validation')
        console.log(`   Network: ${hre.network.name}`)
        console.log(`   Governance: ${taskArgs.governance}`)
        console.log('')

        try {
            // Llamar a las validaciones existentes
            // Aquí se pueden agregar más validaciones específicas

            console.log('✅ Ejecutando validaciones...')

            // Validación 1: Governance roles
            console.log('   Validando roles de governance...')
            await hre.run('governanceRoles', {
                factory: taskArgs.governance,
            })

            // Validación 2: Estado del despliegue
            console.log('   Validando estado del despliegue...')
            await hre.run('complete-deployment-status', {
                network: hre.network.name,
                governance: taskArgs.governance,
            })

            console.log('')
            console.log('✅ Todas las validaciones pasaron exitosamente')
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error)
            console.error('❌ Error en validaciones:', errorMessage)
            throw error
        }
    })
