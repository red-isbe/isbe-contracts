import { PackedUserOperationStruct } from 'typechain-types/contracts/accountabstraction/MockEntryPoint'
import { ethers } from 'hardhat'
import { Signer } from 'ethers'
import { IEntryPoint } from 'typechain-types'

export abstract class UserOperationUtils {
    static async generateSignedUserOperation(
        signer: Signer,
        entryPoint: IEntryPoint,
        sender: string
    ): Promise<{ userOp: PackedUserOperationStruct; hash: string }> {
        const nonce = await entryPoint.getNonce(sender, 0)
        const userOp = this.generateUnsignedUserOperation('0x', sender, nonce)

        const hash = await entryPoint.getUserOpHash(userOp)

        userOp.signature = await signer.signMessage(ethers.toBeArray(hash))

        return { userOp, hash }
    }

    private static generateUnsignedUserOperation(
        callData: string,
        sender: string,
        nonce: bigint
    ): PackedUserOperationStruct {
        const verificationGasLimit = 200_000n
        const callGasLimit = verificationGasLimit
        const maxPriorityFeePerGas = ethers.parseUnits('10', 'gwei')
        const maxFeePerGas = ethers.parseUnits('5', 'gwei')

        return {
            sender: sender,
            nonce: nonce,
            initCode: '0x',
            callData: callData,
            accountGasLimits: this.pack128(verificationGasLimit, callGasLimit),
            preVerificationGas: verificationGasLimit,
            gasFees: this.pack128(maxPriorityFeePerGas, maxFeePerGas),
            paymasterAndData: '0x',
            signature: '0x',
        } as PackedUserOperationStruct
    }

    private static pack128 = (hi: bigint, lo: bigint) =>
        ethers.toBeHex((hi << 128n) | lo, 32)
}
