/**
 * ISBE Deploy Commands
 *
 * Comandos CLI que reutilizan las tasks existentes con una interfaz más intuitiva
 */

// Import all commands to register them
import './deploy-full'
import './deploy-governance'
import './deploy-selective'
import './deploy-validate'

// Los comandos se registran automáticamente al importarse

// Export for programmatic use if needed
export const COMMANDS = [
    'deploy:full',
    'deploy:governance',
    'deploy:selective',
    'deploy:validate',
] as const

export type DeployCommand = (typeof COMMANDS)[number]
