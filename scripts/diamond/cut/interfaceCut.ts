import { Signer } from 'ethers'
import { ISignatureProvider } from '../../../tasks/deployment/providers/ISignatureProvider'
import { getDiamondCut } from '../../utils/getDiamondCut'
import { getEvent } from '../../utils/getEvent'
import { ItemCut } from './interfaces.js'
import { isValidBytesAndLength } from '../../utils/validation'

/**
 * Interface cut using signature provider pattern (supports both secp256k1 and secp256r1)
 */
export async function interfaceCut(
    facetAddresses: string[],
    actions: number[],
    items: string[][],
    diamond: string,
    signatureProvider: ISignatureProvider
): Promise<{
    _interfaceCut: ItemCut[]
}> {
    if (facetAddresses.length != actions.length)
        throw Error('facet addresses and actions length not the same')
    if (facetAddresses.length != items.length)
        throw Error('facet addresses and items length not the same')

    console.log(
        `🔐 Using ${signatureProvider.getCurveType()} signature for interface cut...`
    )

    const signer = await signatureProvider.getSigner()
    const diamondCut = await getDiamondCut(diamond, signer)

    const cut: ItemCut[] = []

    for (let i = 0; i < facetAddresses.length; i++) {
        if (!isValidBytesAndLength(facetAddresses[i], 20))
            throw new Error(
                'Invalid facet address format : ' + facetAddresses[i]
            )

        for (let j = 0; j < items[i].length; j++) {
            if (!isValidBytesAndLength(items[i][j], 4))
                throw new Error('Invalid item format : ' + items[i][j])
        }

        cut.push({
            facetAddress: facetAddresses[i],
            action: actions[i],
            items: items[i],
        })
    }

    console.log('📡 Sending interfaceCut transaction...')
    const tx = await diamondCut.interfaceCut(cut)

    console.log('⏳ Waiting for transaction to be mined...')
    const interfaceUpdateEvent = await getEvent(
        'InterfacesUpdate',
        tx,
        diamondCut
    )

    const { _interfaceCut } = interfaceUpdateEvent.args

    return {
        _interfaceCut,
    }
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use the signature provider version above
 */
export async function interfaceCutLegacy(
    facetAddresses: string[],
    actions: number[],
    items: string[][],
    diamond: string,
    signer: Signer
): Promise<{
    _interfaceCut: ItemCut[]
}> {
    console.warn(
        '⚠️  Using legacy interfaceCut - consider switching to signature provider version'
    )

    if (facetAddresses.length != actions.length)
        throw Error('facet addresses and actions length not the same')
    if (facetAddresses.length != items.length)
        throw Error('facet addresses and items length not the same')

    const diamondCut = await getDiamondCut(diamond, signer)

    const cut: ItemCut[] = []

    for (let i = 0; i < facetAddresses.length; i++) {
        if (!isValidBytesAndLength(facetAddresses[i], 20))
            throw new Error(
                'Invalid facet address format : ' + facetAddresses[i]
            )

        for (let j = 0; j < items[i].length; j++) {
            if (!isValidBytesAndLength(items[i][j], 4))
                throw new Error('Invalid item format : ' + items[i][j])
        }

        cut.push({
            facetAddress: facetAddresses[i],
            action: actions[i],
            items: items[i],
        })
    }

    const tx = await diamondCut.interfaceCut(cut)
    const interfaceUpdateEvent = await getEvent(
        'InterfacesUpdate',
        tx,
        diamondCut
    )

    const { _interfaceCut } = interfaceUpdateEvent.args

    return {
        _interfaceCut,
    }
}
