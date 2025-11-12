/**
 * Registro de comandos de deploy
 *
 * Este archivo debe ser importado en hardhat.config.ts para registrar
 * todos los comandos CLI del nuevo sistema de deploy
 */

// Importar todos los comandos para registrarlos
import './commands'

console.log(' ISBE Deploy commands registered')
console.log('   Available commands:')
console.log('   - deploy:full')
console.log('   - deploy:governance')
console.log('   - deploy:selective')
console.log('   - deploy:validate')
console.log('')
console.log('   Run: npx hardhat deploy:full --help')
console.log('')
