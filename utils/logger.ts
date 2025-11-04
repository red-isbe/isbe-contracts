/**
 * Debug-aware logging utility
 *
 * Controls verbosity based on DEBUG environment variable or NODE_ENV
 */

// Check if debug mode is enabled
const isDebugEnabled = (): boolean => {
    return (
        process.env.DEBUG === 'true' ||
        process.env.DEBUG === '1' ||
        process.env.NODE_ENV === 'development'
    )
}

/**
 * Logger that respects debug settings
 */
export const logger = {
    /**
     * Log errors only in debug mode
     */
    error: (...args: unknown[]) => {
        if (isDebugEnabled()) {
            console.error(...args)
        }
    },

    /**
     * Log warnings only in debug mode
     */
    warn: (...args: unknown[]) => {
        if (isDebugEnabled()) {
            console.warn(...args)
        }
    },

    /**
     * Log info only in debug mode
     */
    info: (...args: unknown[]) => {
        if (isDebugEnabled()) {
            console.log(...args)
        }
    },

    /**
     * Log debug information only when debug is enabled
     */
    debug: (...args: unknown[]) => {
        if (isDebugEnabled()) {
            console.log('[DEBUG]', ...args)
        }
    },

    /**
     * Log configuration details only in debug mode
     */
    config: (...args: unknown[]) => {
        if (isDebugEnabled()) {
            console.log('[CONFIG]', ...args)
        }
    },

    /**
     * Log success messages only in debug mode
     */
    success: (message: string, details?: unknown) => {
        if (isDebugEnabled()) {
            console.log(`✅ ${message}`)
            if (details) {
                console.log('[DEBUG]', details)
            }
        }
    },

    /**
     * Log configuration summary only in debug mode
     */
    summary: (title: string, data: Record<string, unknown>) => {
        if (isDebugEnabled()) {
            console.log(`📊 ${title}:`)
            Object.entries(data).forEach(([key, value]) => {
                if (Array.isArray(value)) {
                    console.log(
                        `  ${key}: ${value.length} (${value.join(', ')})`
                    )
                } else if (typeof value === 'number') {
                    console.log(`  ${key}: ${value.toLocaleString()}`)
                } else {
                    console.log(`  ${key}: ${value}`)
                }
            })
        }
        // Silent in non-debug mode
    },
}

/**
 * Check if debug mode is currently enabled
 */
export const isDebug = isDebugEnabled

/**
 * Suppress all logging (useful for tests)
 */
export const suppressLogging = () => {
    // Override all logger methods to do nothing
    Object.keys(logger).forEach((key) => {
        if (typeof logger[key as keyof typeof logger] === 'function') {
            ;(logger as Record<string, unknown>)[key] = () => {}
        }
    })
}
