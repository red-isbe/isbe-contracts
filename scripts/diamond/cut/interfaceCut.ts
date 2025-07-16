import { Signer } from 'ethers'
import { getDiamondCut } from '../../utils/getDiamondCut'
import { getEvent } from '../../utils/getEvent'
import { ItemCut } from './interfaces.js'
import { isValidBytesAndLength } from '../../utils/validation'

export async function interfaceCut(
    facetAddresses: string[],
    actions: number[],
    items: string[][],
    diamond: string,
    signer: Signer
): Promise<{
    _interfaceCut: ItemCut[]
}> {
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
