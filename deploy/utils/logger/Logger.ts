/**
 * Logger - Sistema de logging con niveles
 */

import { LogLevel } from '../../types'

export class Logger {
    private static currentLevel: LogLevel = LogLevel.NORMAL

    /**
     * Configura el nivel de logging
     */
    static setLevel(level: LogLevel): void {
        this.currentLevel = level
    }

    /**
     * Obtiene el nivel actual
     */
    static getLevel(): LogLevel {
        return this.currentLevel
    }

    /**
     * Verifica si un nivel está habilitado
     */
    static isLevel(level: LogLevel): boolean {
        const levels = [
            LogLevel.MINIMAL,
            LogLevel.NORMAL,
            LogLevel.VERBOSE,
            LogLevel.DEBUG,
        ]
        const currentIndex = levels.indexOf(this.currentLevel)
        const checkIndex = levels.indexOf(level)
        return checkIndex <= currentIndex
    }

    /**
     * Log minimal - Solo mensajes críticos
     */
    static minimal(message: string): void {
        if (this.isLevel(LogLevel.MINIMAL)) {
            console.log(message)
        }
    }

    /**
     * Log normal - Mensajes estándar
     */
    static log(message: string): void {
        if (this.isLevel(LogLevel.NORMAL)) {
            console.log(message)
        }
    }

    /**
     * Log verbose - Información detallada
     */
    static verbose(message: string): void {
        if (this.isLevel(LogLevel.VERBOSE)) {
            console.log(message)
        }
    }

    /**
     * Log debug - Máximo detalle
     */
    static debug(message: string, data?: unknown): void {
        if (this.isLevel(LogLevel.DEBUG)) {
            console.log(message)
            if (data) {
                console.log(JSON.stringify(data, null, 2))
            }
        }
    }

    /**
     * Log de error (siempre se muestra)
     */
    static error(message: string, error?: Error | unknown): void {
        console.error(`❌ ${message}`)
        if (error && this.isLevel(LogLevel.DEBUG)) {
            console.error(error)
        }
    }

    /**
     * Log de warning (siempre se muestra)
     */
    static warn(message: string): void {
        console.warn(`⚠️  ${message}`)
    }

    /**
     * Log de success (siempre se muestra)
     */
    static success(message: string): void {
        console.log(`✅ ${message}`)
    }

    /**
     * Log de sección (según nivel)
     */
    static section(title: string, subtitle?: string): void {
        if (this.isLevel(LogLevel.NORMAL)) {
            console.log(`\n🏗️  ${title.toUpperCase()}`)
            if (subtitle && this.isLevel(LogLevel.VERBOSE)) {
                console.log(`   ${subtitle}`)
            }
        }
    }

    /**
     * Log de información de red
     */
    static networkInfo(
        network: string,
        curve: string,
        deployer: string
    ): void {
        if (this.isLevel(LogLevel.NORMAL)) {
            console.log(`\n🔐 DEPLOYMENT CONFIGURATION:`)
            console.log(`   • Network: ${network}`)
            console.log(`   • Signature curve: ${curve}`)
            console.log(`   • Deployer: ${deployer}`)
            console.log(`   • Log level: ${this.currentLevel}`)
        }
    }

    /**
     * Log de tabla (para resúmenes)
     */
    static table(data: Record<string, unknown>[]): void {
        if (this.isLevel(LogLevel.NORMAL)) {
            console.table(data)
        }
    }

    /**
     * Log de progreso inline
     */
    static progress(current: number, total: number, item?: string): void {
        if (this.isLevel(LogLevel.NORMAL)) {
            const percentage = Math.round((current / total) * 100)
            const message = item
                ? `   [${current}/${total}] ${percentage}% - ${item}`
                : `   [${current}/${total}] ${percentage}%`
            process.stdout.write(`\r${message}`)
            if (current === total) {
                process.stdout.write('\n')
            }
        }
    }

    /**
     * Limpiar línea de progreso
     */
    static clearProgress(): void {
        process.stdout.write('\r\x1b[K')
    }
}
