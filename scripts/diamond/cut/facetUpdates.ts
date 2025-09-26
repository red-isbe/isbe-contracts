import { Signer } from 'ethers'
import { ISignatureProvider } from '../../../tasks/deployment/providers/ISignatureProvider'
import { getDiamondCut } from '../../utils/getDiamondCut'
import { getEvent } from '../../utils/getEvent'
import { ItemCut } from './interfaces.js'
import { isValidBytesAndLength, isValidBytes } from '../../utils/validation'

/**
 * Facet updates using signature provider pattern (supports both secp256k1 and secp256r1)
 */
export async function facetUpdates(
    facetAddresses: string[],
    init: string,
    calldata: string,
    diamond: string,
    signatureProvider: ISignatureProvider
): Promise<{
    _interfaceCut: ItemCut[]
    _diamondCut: ItemCut[]
    _init: string
    _calldata: string
}> {
    for (let i = 0; i < facetAddresses.length; i++) {
        if (!isValidBytesAndLength(facetAddresses[i], 20))
            throw new Error(
                'Invalid facet address format : ' + facetAddresses[i]
            )
    }

    if (!isValidBytes(init)) throw new Error('Invalid init format : ' + init)
    if (!isValidBytes(calldata))
        throw new Error('Invalid calldata format : ' + calldata)

    console.log(
        `🔐 Using ${signatureProvider.getCurveType()} signature for facet updates...`
    )

    const signer = await signatureProvider.getSigner()
    const diamondCut = await getDiamondCut(diamond, signer)

    console.log('📡 Sending facetUpdates transaction...')
    const tx = await diamondCut.facetUpdates(facetAddresses, init, calldata)

    console.log('⏳ Waiting for transaction to be mined...')
    const interfaceUpdateEvent = await getEvent(
        'InterfacesUpdate',
        tx,
        diamondCut
    )
    const diamondCutEvent = await getEvent('DiamondCut', tx, diamondCut)

    const { _interfaceCut } = interfaceUpdateEvent.args

    const { _diamondCut, _init, _calldata } = diamondCutEvent.args

    return {
        _interfaceCut,
        _diamondCut,
        _init,
        _calldata,
    }
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use the signature provider version above
 */
export async function facetUpdatesLegacy(
    facetAddresses: string[],
    init: string,
    calldata: string,
    diamond: string,
    signer: Signer
): Promise<{
    _interfaceCut: ItemCut[]
    _diamondCut: ItemCut[]
    _init: string
    _calldata: string
}> {
    console.warn(
        '⚠️  Using legacy facetUpdates - consider switching to signature provider version'
    )

    for (let i = 0; i < facetAddresses.length; i++) {
        if (!isValidBytesAndLength(facetAddresses[i], 20))
            throw new Error(
                'Invalid facet address format : ' + facetAddresses[i]
            )
    }

    if (!isValidBytes(init)) throw new Error('Invalid init format : ' + init)
    if (!isValidBytes(calldata))
        throw new Error('Invalid calldata format : ' + calldata)

    const diamondCut = await getDiamondCut(diamond, signer)
    const tx = await diamondCut.facetUpdates(facetAddresses, init, calldata)

    const interfaceUpdateEvent = await getEvent(
        'InterfacesUpdate',
        tx,
        diamondCut
    )
    const diamondCutEvent = await getEvent('DiamondCut', tx, diamondCut)

    const { _interfaceCut } = interfaceUpdateEvent.args
    const { _diamondCut, _init, _calldata } = diamondCutEvent.args

    return {
        _interfaceCut,
        _diamondCut,
        _init,
        _calldata,
    }
}
