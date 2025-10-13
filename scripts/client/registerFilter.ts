import {
    BigNumberish,
    Signer,
    ZeroHash,
    toUtf8Bytes,
    zeroPadBytes,
} from 'ethers'
import { getEvent } from '../utils/getEvent'
import { checkValidHexadecimal } from '../utils/validation'
import {
    FilterType,
    RegisterFilterParams,
    RegisterFilterResult,
} from './interfaces'
import { getClientFiltering } from '../utils/getClientFiltering'
import { IClientFiltering } from '../../typechain-types'
import type { AddressLike, BytesLike } from 'ethers/lib.esm'

const HEX_PATTERNS = {
    HASH: /^0x[a-zA-Z0-9]{64}$/,
    ADDRESS: /^0x[A-Za-z0-9]{40}$/,
    SIGNATURE: /^0x[a-zA-Z0-9]{8}$/,
} as const

const VALIDATION_CONFIG = {
    HASH: { pattern: HEX_PATTERNS.HASH, length: 66 },
    ADDRESS: { pattern: HEX_PATTERNS.ADDRESS, length: 42 },
    SIGNATURE: { pattern: HEX_PATTERNS.SIGNATURE, length: 10 },
} as const

function validateFilterType(filterType: bigint): FilterType {
    const filter = Number(filterType)
    if (!Number.isInteger(filter) || filter < 0 || filter > 5) {
        throw new Error(
            `El tipo de filtro ${filter} debe ser un entero entre 0 y 5`
        )
    }
    return filter as FilterType
}

function validateHexadecimalFields(params: RegisterFilterParams): void {
    checkValidHexadecimal(
        params.filterId,
        VALIDATION_CONFIG.HASH.pattern,
        VALIDATION_CONFIG.HASH.length,
        `El ID de filtro ${params.filterId} debe ser una cadena hexadecimal válida`
    )

    checkValidHexadecimal(
        params.clientFilteringAddress,
        VALIDATION_CONFIG.ADDRESS.pattern,
        VALIDATION_CONFIG.ADDRESS.length,
        `${params.clientFilteringAddress} debe ser una dirección de contrato válida`
    )
}

function toBytes32(str: string): string {
    if (str.length === 0) return ZeroHash
    const utf8Bytes = toUtf8Bytes(str.slice(0, 32))
    return zeroPadBytes(utf8Bytes, 32)
}

function validateFilterParameters(
    filter: FilterType,
    transactionHash: string,
    contractAddress: string,
    signature: string,
    jsonRpcMethod: string
): void {
    switch (filter) {
        case FilterType.NONE:
            throw new Error(`Tipo de filtro NONE no permitido`)
        case FilterType.TRANSACTION_HASH:
            checkValidHexadecimal(
                transactionHash,
                VALIDATION_CONFIG.HASH.pattern,
                VALIDATION_CONFIG.HASH.length,
                `El transaction hash ${transactionHash} debe ser una cadena hexadecimal válida`
            )
            break
        case FilterType.CONTRACT:
            checkValidHexadecimal(
                contractAddress,
                VALIDATION_CONFIG.ADDRESS.pattern,
                VALIDATION_CONFIG.ADDRESS.length,
                `El address del contrato ${contractAddress} no es válido`
            )
            break
        case FilterType.SIGNATURE:
            checkValidHexadecimal(
                signature,
                VALIDATION_CONFIG.SIGNATURE.pattern,
                VALIDATION_CONFIG.SIGNATURE.length,
                `La signature ${signature} no es válida`
            )
            break
        case FilterType.CONTRACT_AND_SIGNATURE:
            checkValidHexadecimal(
                contractAddress,
                VALIDATION_CONFIG.ADDRESS.pattern,
                VALIDATION_CONFIG.ADDRESS.length,
                `El address del contrato ${contractAddress} no es válido`
            )
            checkValidHexadecimal(
                signature,
                VALIDATION_CONFIG.SIGNATURE.pattern,
                VALIDATION_CONFIG.SIGNATURE.length,
                `La signature ${signature} no es válida`
            )
            break
        case FilterType.JSONRPC_METHOD:
            if (!jsonRpcMethod) {
                throw new Error(
                    `El JSON-RPC method${jsonRpcMethod} debe ser informado`
                )
            }
            break
    }
}

function validateBlockNumbers(initialBlock: bigint, endBlock: bigint): void {
    if (initialBlock !== undefined && initialBlock < 0) {
        throw new Error(`${initialBlock} debe ser un bloque inicial válido`)
    }
    if (endBlock !== undefined && endBlock < 0) {
        throw new Error(`${endBlock} debe ser un bloque final válido`)
    }
    if (
        initialBlock !== undefined &&
        endBlock !== undefined &&
        initialBlock > endBlock
    ) {
        throw new Error(`${initialBlock} debe ser menor que ${endBlock}`)
    }
}

function normalizeRegisterFilterParams(
    filterIdOrParams: string | RegisterFilterParams,
    filterType?: bigint,
    transactionHash?: string,
    contractAddress?: string,
    signature?: string,
    jsonRpcMethod?: string,
    initialBlock?: bigint,
    endBlock?: bigint,
    clientFilteringAddress?: string,
    signer?: Signer
): RegisterFilterParams {
    return typeof filterIdOrParams === 'string'
        ? {
              filterId: filterIdOrParams,
              filterType: filterType!,
              transactionHash: transactionHash!,
              contractAddress: contractAddress!,
              signature: signature!,
              jsonRpcMethod: jsonRpcMethod!,
              initialBlock: initialBlock!,
              endBlock: endBlock!,
              clientFilteringAddress: clientFilteringAddress!,
              signer: signer!,
          }
        : filterIdOrParams
}

export async function registerFilter(
    params: RegisterFilterParams
): Promise<RegisterFilterResult>
export async function registerFilter(
    filterId: string,
    filterType: bigint,
    transactionHash: string,
    contractAddress: string,
    signature: string,
    jsonRpcMethod: string,
    initialBlock: bigint,
    endBlock: bigint,
    clientFilteringAddress: string,
    signer: Signer
): Promise<RegisterFilterResult>
export async function registerFilter(
    filterIdOrParams: string | RegisterFilterParams,
    filterType?: bigint,
    transactionHash?: string,
    contractAddress?: string,
    signature?: string,
    jsonRpcMethod?: string,
    initialBlock?: bigint,
    endBlock?: bigint,
    clientFilteringAddress?: string,
    signer?: Signer
): Promise<RegisterFilterResult> {
    const params = normalizeRegisterFilterParams(
        filterIdOrParams,
        filterType,
        transactionHash,
        contractAddress,
        signature,
        jsonRpcMethod,
        initialBlock,
        endBlock,
        clientFilteringAddress,
        signer
    )

    const validatedFilterType = validateFilterType(params.filterType)

    validateHexadecimalFields(params)
    validateFilterParameters(
        validatedFilterType,
        params.transactionHash,
        params.contractAddress,
        params.signature,
        params.jsonRpcMethod
    )
    validateBlockNumbers(params.initialBlock, params.endBlock)

    const clientFiltering = await getClientFiltering(
        params.clientFilteringAddress,
        params.signer
    )

    const contractFilterData = {
        filterId: params.filterId as BytesLike,
        filterType: validatedFilterType as BigNumberish,
        transactionHash: params.transactionHash as BytesLike,
        contractAddress: params.contractAddress as AddressLike,
        signature: params.signature as BytesLike,
        jsonRpcMethod: toBytes32(params.jsonRpcMethod) as BytesLike,
        initialBlock: params.initialBlock as BigNumberish,
        endBlock: params.endBlock as BigNumberish,
    } as IClientFiltering.FilterStruct

    const tx = await clientFiltering.registerFilter(contractFilterData)

    const filterRegisteredEvent = await getEvent(
        'FilterRegistered',
        tx,
        clientFiltering
    )

    const {
        filterId,
        filterType: eventFilterType,
        transactionHash: eventTransactionHash,
        contractAddress: eventContractAddress,
        signature: eventSignature,
        jsonRpcMethod: eventJsonRpcMethod,
        initialBlock: eventInitialBlock,
        endBlock: eventEndBlock,
    } = filterRegisteredEvent.args

    return {
        filterId,
        filterType: Number(eventFilterType),
        transactionHash: eventTransactionHash,
        contractAddress: eventContractAddress,
        signature: eventSignature,
        jsonRpcMethod: eventJsonRpcMethod,
        initialBlock: Number(eventInitialBlock),
        endBlock: Number(eventEndBlock),
    }
}
