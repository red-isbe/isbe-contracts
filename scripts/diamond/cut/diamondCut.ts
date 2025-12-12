/* -----------------------------------------------------------------------------------
Copyright (c) 2025 Comunidad de Madrid & Alastria
Licensed under the Apache License, Version 2.0 (the "License");
You may not use this file except in compliance with the License.
You may obtain a copy of the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
----------------------------------------------------------------------------------- */
import { Signer } from 'ethers'
import { ISignatureProvider } from '../../../tasks/deployment/providers/ISignatureProvider'
import { getDiamondCut } from '../../utils/getDiamondCut'
import { getEvent } from '../../utils/getEvent'
import { ItemCut } from './interfaces.js'
import { isValidBytesAndLength, isValidBytes } from '../../utils/validation'

/**
 * Diamond cut using signature provider pattern (supports both secp256k1 and secp256r1)
 */
export async function diamondCut(
    facetAddresses: string[],
    actions: number[],
    items: string[][],
    init: string,
    calldata: string,
    diamond: string,
    signatureProvider: ISignatureProvider
): Promise<{
    _diamondCut: ItemCut[]
    _init: string
    _calldata: string
}> {
    if (facetAddresses.length != actions.length)
        throw Error('facet addresses and actions length not the same')
    if (facetAddresses.length != items.length)
        throw Error('facet addresses and items length not the same')

    if (!isValidBytes(init)) throw new Error('Invalid init format : ' + init)
    if (!isValidBytes(calldata))
        throw new Error('Invalid calldata format : ' + calldata)

    console.log(
        `🔐 Using ${signatureProvider.getCurveType()} signature for diamond cut...`
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

    console.log('📡 Sending diamondCut transaction...')
    const tx = await diamondCut.diamondCut(cut, init, calldata)

    console.log('⏳ Waiting for transaction to be mined...')
    const diamondCutEvent = await getEvent('DiamondCut', tx, diamondCut)

    const { _diamondCut, _init, _calldata } = diamondCutEvent.args

    return {
        _diamondCut,
        _init,
        _calldata,
    }
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use the signature provider version above
 */
export async function diamondCutLegacy(
    facetAddresses: string[],
    actions: number[],
    items: string[][],
    init: string,
    calldata: string,
    diamond: string,
    signer: Signer
): Promise<{
    _diamondCut: ItemCut[]
    _init: string
    _calldata: string
}> {
    console.warn(
        '⚠️  Using legacy diamondCut - consider switching to signature provider version'
    )

    if (facetAddresses.length != actions.length)
        throw Error('facet addresses and actions length not the same')
    if (facetAddresses.length != items.length)
        throw Error('facet addresses and items length not the same')

    if (!isValidBytes(init)) throw new Error('Invalid init format : ' + init)
    if (!isValidBytes(calldata))
        throw new Error('Invalid calldata format : ' + calldata)

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

    const tx = await diamondCut.diamondCut(cut, init, calldata)
    const diamondCutEvent = await getEvent('DiamondCut', tx, diamondCut)

    const { _diamondCut, _init, _calldata } = diamondCutEvent.args

    return {
        _diamondCut,
        _init,
        _calldata,
    }
}
