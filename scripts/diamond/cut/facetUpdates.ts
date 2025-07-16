import { Signer } from 'ethers'
import { getDiamondCut } from '../../utils/getDiamondCut'
import { getEvent } from '../../utils/getEvent'
import { ItemCut } from './interfaces.js'
import { isValidBytesAndLength, isValidBytes } from '../../utils/validation'

export async function facetUpdates(
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
