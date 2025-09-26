import { BigNumberish, Signer } from 'ethers'
import { ISignatureProvider } from '../../tasks/deployment/providers/ISignatureProvider'
import { getIsbeFactory } from '../utils/getIsbeFactory'
import { getEvent } from '../utils/getEvent'
import { isValidBytes, isValidBytesAndLength } from '../utils/validation'

/**
 * Deploy business logic using signature provider pattern (supports both secp256k1 and secp256r1)
 */
export async function deployBusinessLogic(
    businessId: string,
    bytecode: string,
    factory: string,
    signatureProvider: ISignatureProvider
): Promise<{
    businessId: string
    businessAddress: string
    version: BigNumberish
}> {
    if (!isValidBytesAndLength(businessId, 32))
        throw new Error('Invalid business Id format : ' + businessId)

    if (!isValidBytes(bytecode))
        throw new Error('Invalid byte code format : ' + bytecode)

    console.log(
        `🔐 Using ${signatureProvider.getCurveType()} signature for business logic deployment...`
    )

    const signer = await signatureProvider.getSigner()
    const businessLogicFactory = await getIsbeFactory(factory, signer)

    console.log('📡 Sending deployBusinessLogic transaction...')
    const tx = await businessLogicFactory.deploy(businessId, bytecode)

    console.log('⏳ Waiting for transaction to be mined...')
    const deployedEvent = await getEvent('Deployed', tx, businessLogicFactory)

    const {
        businessId: deployedBusinessId,
        businessAddress,
        version,
    } = deployedEvent.args

    return {
        businessId: deployedBusinessId,
        businessAddress,
        version: version.toString(),
    }
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use the signature provider version above
 */
export async function deployBusinessLogicLegacy(
    businessId: string,
    bytecode: string,
    factory: string,
    signer: Signer
): Promise<{
    businessId: string
    businessAddress: string
    version: BigNumberish
}> {
    console.warn(
        '⚠️  Using legacy deployBusinessLogic - consider switching to signature provider version'
    )

    if (!isValidBytesAndLength(businessId, 32))
        throw new Error('Invalid business Id format : ' + businessId)

    if (!isValidBytes(bytecode))
        throw new Error('Invalid byte code format : ' + bytecode)

    const businessLogicFactory = await getIsbeFactory(factory, signer)
    const tx = await businessLogicFactory.deploy(businessId, bytecode)
    const deployedEvent = await getEvent('Deployed', tx, businessLogicFactory)

    const {
        businessId: deployedBusinessId,
        businessAddress,
        version,
    } = deployedEvent.args

    return {
        businessId: deployedBusinessId,
        businessAddress,
        version: version.toString(),
    }
}
