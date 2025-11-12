/**
 * Re-export ISignatureProvider del sistema existente
 *
 * Este archivo simplemente re-exporta la interfaz existente en tasks/deployment/providers
 * para mantener compatibilidad con el nuevo sistema de deploy
 */

// Re-exportar la interfaz existente
export type { ISignatureProvider } from '../../tasks/deployment/providers/ISignatureProvider'
