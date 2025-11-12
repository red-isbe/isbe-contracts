/**
 * deploy:governance - Despliegue solo de Governance Diamond
 *
 * Wrapper sobre deployIsbeFactory para una interfaz más clara
 */

import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

task('deploy:governance', 'Desplegar solo Governance Diamond (ISBE Factory)')
    .addOptionalParam('logLevel', 'Nivel de logging', 'normal')
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        console.log('🏛️  ISBE Governance Deployment')
        console.log(`   Network: ${hre.network.name}`)
        console.log('')

        try {
            // Llamar a la task existente deployIsbeFactory
            const result = await hre.run('deployIsbeFactory', {
                logLevel: taskArgs.logLevel,
            })

            console.log('')
            console.log('✅ Governance Diamond desplegado exitosamente')
            console.log(`   Address: ${result.address || result}`)
            console.log(`   Documentación: deploy/01-governance/README.md`)

            return result
        } catch (error) {
            console.error('❌ Error en despliegue de governance:', error instanceof Error ? error.message : String(error))
            throw error
        }
    })
