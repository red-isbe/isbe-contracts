/**
 * Base error class for all ISBE-related errors
 * Provides a foundation for more specific error types
 */
export class IsbeError extends Error {
    constructor(
        message: string,
        public code?: string,
        public context?: Record<string, unknown>
    ) {
        super(message)
        this.name = this.constructor.name

        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor)
        }
    }

    /**
     * Convert error to JSON for logging/debugging
     */
    toJSON(): Record<string, unknown> {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            context: this.context,
            stack: this.stack,
        }
    }
}

/**
 * Error thrown when input validation fails
 */
export class ValidationError extends IsbeError {
    constructor(
        field: string,
        value: unknown,
        expected: string,
        suggestions?: string[]
    ) {
        const message = `Invalid ${field}: ${value}. Expected: ${expected}`
        super(message, 'VALIDATION_ERROR', {
            field,
            value,
            expected,
            suggestions,
        })
    }

    /**
     * Create a validation error with suggestions for fixing the issue
     */
    static withSuggestions(
        field: string,
        value: unknown,
        expected: string,
        suggestions: string[]
    ): ValidationError {
        return new ValidationError(field, value, expected, suggestions)
    }
}

/**
 * Error thrown when blockchain transaction operations fail
 */
export class TransactionError extends IsbeError {
    constructor(
        message: string,
        public txHash?: string,
        public blockNumber?: number,
        public gasUsed?: string,
        public gasPrice?: string
    ) {
        super(message, 'TRANSACTION_ERROR', {
            txHash,
            blockNumber,
            gasUsed,
            gasPrice,
        })
    }

    /**
     * Create a transaction error with full transaction context
     */
    static withContext(
        message: string,
        txHash: string,
        blockNumber: number,
        gasUsed?: string,
        gasPrice?: string
    ): TransactionError {
        return new TransactionError(
            message,
            txHash,
            blockNumber,
            gasUsed,
            gasPrice
        )
    }

    /**
     * Create a transaction error for timeout scenarios
     */
    static timeout(txHash: string, timeoutMs: number): TransactionError {
        return new TransactionError(
            `Transaction timed out after ${timeoutMs}ms`,
            txHash,
            undefined,
            undefined,
            undefined
        )
    }
}

/**
 * Error thrown when smart contract interaction fails
 */
export class ContractInteractionError extends IsbeError {
    constructor(
        message: string,
        public contractAddress: string,
        public methodName?: string,
        public args?: unknown[]
    ) {
        const fullMessage = methodName
            ? `Contract interaction failed at ${contractAddress}:${methodName}: ${message}`
            : `Contract interaction failed at ${contractAddress}: ${message}`

        super(fullMessage, 'CONTRACT_INTERACTION_ERROR', {
            contractAddress,
            methodName,
            args,
        })
    }

    /**
     * Create a contract interaction error for method calls
     */
    static methodCall(
        contractAddress: string,
        methodName: string,
        args: unknown[],
        message: string
    ): ContractInteractionError {
        return new ContractInteractionError(
            message,
            contractAddress,
            methodName,
            args
        )
    }

    /**
     * Create a contract interaction error for deployment failures
     */
    static deployment(
        contractAddress: string,
        message: string
    ): ContractInteractionError {
        return new ContractInteractionError(
            message,
            contractAddress,
            'constructor'
        )
    }
}

/**
 * Error thrown when network-related operations fail
 */
export class NetworkError extends IsbeError {
    constructor(
        message: string,
        public networkName: string,
        public chainId?: number,
        public rpcUrl?: string
    ) {
        super(`Network error on ${networkName}: ${message}`, 'NETWORK_ERROR', {
            networkName,
            chainId,
            rpcUrl,
        })
    }

    /**
     * Create a network error for connection failures
     */
    static connectionFailed(
        networkName: string,
        rpcUrl: string,
        originalError?: Error
    ): NetworkError {
        const message = originalError
            ? `Connection failed: ${originalError.message}`
            : 'Connection failed'
        return new NetworkError(message, networkName, undefined, rpcUrl)
    }

    /**
     * Create a network error for unsupported chain
     */
    static unsupportedChain(
        chainId: number,
        supportedChains: number[]
    ): NetworkError {
        return new NetworkError(
            `Unsupported chain ID ${chainId}. Supported chains: ${supportedChains.join(', ')}`,
            'unknown',
            chainId
        )
    }
}

/**
 * Error thrown when configuration is invalid or missing
 */
export class ConfigurationError extends IsbeError {
    constructor(
        message: string,
        public configPath?: string,
        public requiredFields?: string[]
    ) {
        super(message, 'CONFIGURATION_ERROR', { configPath, requiredFields })
    }

    /**
     * Create a configuration error for missing required fields
     */
    static missingRequired(
        configPath: string,
        missingFields: string[]
    ): ConfigurationError {
        return new ConfigurationError(
            `Missing required configuration fields: ${missingFields.join(', ')}`,
            configPath,
            missingFields
        )
    }

    /**
     * Create a configuration error for invalid values
     */
    static invalidValue(
        configPath: string,
        field: string,
        value: unknown,
        expected: string
    ): ConfigurationError {
        return new ConfigurationError(
            `Invalid configuration value for ${field}: ${value}. Expected: ${expected}`,
            configPath,
            [field]
        )
    }
}

/**
 * Error thrown when signature operations fail
 */
export class SignatureError extends IsbeError {
    constructor(
        message: string,
        public curveType?: 'secp256k1' | 'secp256r1',
        public publicKey?: string
    ) {
        super(message, 'SIGNATURE_ERROR', { curveType, publicKey })
    }

    /**
     * Create a signature error for verification failures
     */
    static verificationFailed(
        curveType: 'secp256k1' | 'secp256r1',
        publicKey?: string
    ): SignatureError {
        return new SignatureError(
            'Signature verification failed',
            curveType,
            publicKey
        )
    }

    /**
     * Create a signature error for unsupported curve types
     */
    static unsupportedCurve(curveType: string): SignatureError {
        return new SignatureError(
            `Unsupported curve type: ${curveType}. Supported: secp256k1, secp256r1`,
            undefined,
            undefined
        )
    }
}

/**
 * Error thrown when file system operations fail
 */
export class FileSystemError extends IsbeError {
    constructor(
        message: string,
        public filePath: string,
        public operation: 'read' | 'write' | 'delete' | 'create' | 'access'
    ) {
        super(
            `File system error (${operation}): ${message}`,
            'FILESYSTEM_ERROR',
            { filePath, operation }
        )
    }

    /**
     * Create a file system error for file not found
     */
    static fileNotFound(filePath: string): FileSystemError {
        return new FileSystemError(
            `File not found: ${filePath}`,
            filePath,
            'read'
        )
    }

    /**
     * Create a file system error for permission denied
     */
    static permissionDenied(
        filePath: string,
        operation: FileSystemError['operation']
    ): FileSystemError {
        return new FileSystemError(
            `Permission denied: ${filePath}`,
            filePath,
            operation
        )
    }
}

/**
 * Error thrown when timeout operations occur
 */
export class TimeoutError extends IsbeError {
    constructor(
        message: string,
        public timeoutMs: number,
        public operation?: string
    ) {
        super(`Timeout after ${timeoutMs}ms: ${message}`, 'TIMEOUT_ERROR', {
            timeoutMs,
            operation,
        })
    }

    /**
     * Create a timeout error for specific operations
     */
    static forOperation(operation: string, timeoutMs: number): TimeoutError {
        return new TimeoutError(`${operation} timed out`, timeoutMs, operation)
    }
}

/**
 * Utility type guard to check if an error is an ISBE error
 */
export function isIsbeError(error: unknown): error is IsbeError {
    return error instanceof IsbeError
}

/**
 * Utility function to extract error message safely
 */
export function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message
    }
    return String(error)
}

/**
 * Utility function to create error context for logging
 */
export function createErrorContext(
    error: unknown,
    additionalContext?: Record<string, unknown>
): Record<string, unknown> {
    const baseContext = {
        timestamp: new Date().toISOString(),
        ...additionalContext,
    }

    if (isIsbeError(error)) {
        return {
            ...baseContext,
            ...error.toJSON(),
        }
    }

    if (error instanceof Error) {
        return {
            ...baseContext,
            name: error.name,
            message: error.message,
            stack: error.stack,
        }
    }

    return {
        ...baseContext,
        error: String(error),
    }
}

/**
 * Error aggregation for batch operations
 */
export class BatchError extends IsbeError {
    constructor(
        message: string,
        public errors: Error[],
        public successCount: number,
        public failureCount: number
    ) {
        super(message, 'BATCH_ERROR', {
            successCount,
            failureCount,
            totalErrors: errors.length,
        })
    }

    /**
     * Create a batch error from multiple errors
     */
    static fromErrors(
        operation: string,
        errors: Error[],
        successCount: number
    ): BatchError {
        return new BatchError(
            `Batch ${operation} completed with ${errors.length} failures out of ${successCount + errors.length} operations`,
            errors,
            successCount,
            errors.length
        )
    }

    /**
     * Get all error messages
     */
    getAllErrorMessages(): string[] {
        return this.errors.map(getErrorMessage)
    }
}
