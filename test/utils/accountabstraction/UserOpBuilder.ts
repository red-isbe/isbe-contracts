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
-------------------------------------------------------------- */
import { ethers } from 'hardhat'
import type { Signer } from 'ethers'
import { IEntryPoint } from 'typechain-types/contracts/accountabstraction/entrypoint/IEntryPoint'
import { PackedUserOperationStruct } from 'typechain-types/@account-abstraction/contracts/interfaces/IEntryPoint'
import {
    CONFIGURATION_ID_ACCOUNT_ABSTRACTION_SMART_ACCOUNT,
    CONFIGURATION_MANAGER_ROLE,
    DEFAULT_ADMIN_ROLE,
    ISBE_ROLE,
} from '../../../utils/constants'

type UserOpOverrides = {
    nonce?: bigint
    initCode?: string
    callData?: string

    callGasLimit?: bigint
    verificationGasLimit?: bigint
    preVerificationGas?: bigint

    maxFeePerGas?: bigint
    maxPriorityFeePerGas?: bigint

    paymasterAndData?: string
    signature?: string
}

type UserOp = Required<UserOpOverrides> & { sender: string }

export class UserOpBuilder {
    private op: UserOp

    constructor(
        private readonly entryPoint: IEntryPoint,
        private readonly signer: Signer,
        sender: string,
        overrides: UserOpOverrides = {}
    ) {
        this.op = {
            ...UserOpBuilder.defaults(),
            sender,
            ...overrides,
        }
    }

    static defaults(): Required<UserOpOverrides> {
        return {
            nonce: 0n,
            initCode: '0x',
            callData: '0x',
            callGasLimit: 1_000_000n,
            verificationGasLimit: 1_000_000n,
            preVerificationGas: 50_000n,
            maxFeePerGas: 1_000_000_000n,
            maxPriorityFeePerGas: 1_000_000_000n,
            paymasterAndData: '0x',
            signature: '0x',
        }
    }

    withSender(sender: string) {
        this.op.sender = sender
        return this
    }

    withNonce(n: bigint) {
        this.op.nonce = n
        return this
    }

    withInitCode(initCode: string) {
        this.op.initCode = initCode
        return this
    }

    withShortInitCode(initCode: string = '0x1234567890abcd1234') {
        this.op.initCode = initCode
        return this
    }

    withCallData(callData: string) {
        this.op.callData = callData
        return this
    }

    withPaymasterAndData(config: {
        paymaster: string
        validationGasLimit?: bigint
        postOpGasLimit?: bigint
        paymasterData?: string
    }) {
        const defaultValidationGasLimit = ethers.toBeHex(1_000_000n, 16)
        const defaultPostOpGasLimit = ethers.toBeHex(1_000_000n, 16)

        const encodedAddress = ethers.getBytes(config.paymaster)
        const encodedValidation = config.validationGasLimit
            ? ethers.toBeHex(config.validationGasLimit, 16)
            : defaultValidationGasLimit
        const encodedPostOp = config.postOpGasLimit
            ? ethers.toBeHex(config.postOpGasLimit, 16)
            : defaultPostOpGasLimit
        const encodedData = config.paymasterData
            ? ethers.getBytes(config.paymasterData)
            : '0x'

        const paymasterAndData = ethers.concat([
            encodedAddress,
            encodedValidation,
            encodedPostOp,
            encodedData,
        ])
        this.op.paymasterAndData = paymasterAndData
        return this
    }

    withGasLimits(config: {
        call?: bigint
        verification?: bigint
        preVerification?: bigint
    }) {
        if (config.call !== undefined) this.op.callGasLimit = config.call
        if (config.verification !== undefined)
            this.op.verificationGasLimit = config.verification
        if (config.preVerification !== undefined)
            this.op.preVerificationGas = config.preVerification
        return this
    }

    withGasFees(config: {
        maxFeePerGas?: bigint
        maxPriorityFeePerGas?: bigint
    }) {
        if (config.maxFeePerGas !== undefined)
            this.op.maxFeePerGas = config.maxFeePerGas
        if (config.maxPriorityFeePerGas !== undefined)
            this.op.maxPriorityFeePerGas = config.maxPriorityFeePerGas
        return this
    }

    build(): UserOp {
        return { ...this.op }
    }

    pack(): PackedUserOperationStruct {
        const op = this.op
        const accountGasLimits = pack128(
            op.verificationGasLimit,
            op.callGasLimit
        )
        const gasFees = pack128(op.maxFeePerGas, op.maxPriorityFeePerGas)

        return {
            sender: op.sender,
            nonce: op.nonce,
            initCode: op.initCode,
            callData: op.callData,
            accountGasLimits,
            preVerificationGas: op.preVerificationGas,
            gasFees,
            paymasterAndData: op.paymasterAndData,
            signature: op.signature,
        }
    }

    async sign(packed?: PackedUserOperationStruct) {
        const userOp = packed ?? this.pack()
        const userOpHash = await this.entryPoint.getUserOpHash(userOp)
        userOp.signature = await this.signer.signMessage(
            ethers.getBytes(userOpHash)
        )
        return { userOp, userOpHash }
    }

    async depositToEntryPoint(amountEth: string) {
        await this.entryPoint.depositTo(this.op.sender, {
            value: ethers.parseEther(amountEth),
        })
    }
}

export function pack128(hi: bigint, lo: bigint) {
    return ethers.toBeHex((hi << 128n) | lo, 32)
}

type Addresses = {
    isbeFactoryAddress: string
    entryPointAddress: string
    smartAccountOwnerAddress: string
    ownableFacetAddress: string
    smartAccountFacetAddress: string
    pauseFacetAddress: string
    accessControlFacetAddress: string
}

export async function predictSmartAccountAddress(
    salt: string,
    addresses: Addresses
) {
    const VERSION = 1
    const {
        OwnableBase__factory,
        SmartAccountFacet__factory,
        IAccessControlEoa__factory,
        ISBEPauseFacet__factory,
    } = await import('../../../typechain-types')

    const args = {
        configurationManagement: addresses.isbeFactoryAddress,
        configurationId: CONFIGURATION_ID_ACCOUNT_ABSTRACTION_SMART_ACCOUNT,
        version: VERSION,
        init: [
            addresses.ownableFacetAddress,
            addresses.smartAccountFacetAddress,
            addresses.pauseFacetAddress,
            addresses.accessControlFacetAddress,
        ],
        data: [
            OwnableBase__factory.createInterface().encodeFunctionData(
                'initializeOwnable',
                [addresses.smartAccountOwnerAddress]
            ),
            SmartAccountFacet__factory.createInterface().encodeFunctionData(
                'initializeSmartAccount',
                [addresses.entryPointAddress]
            ),
            ISBEPauseFacet__factory.createInterface().encodeFunctionData(
                'initializePause',
                [false]
            ),
            IAccessControlEoa__factory.createInterface().encodeFunctionData(
                'initializeAccessControl',
                [
                    [
                        {
                            role: DEFAULT_ADMIN_ROLE,
                            members: [addresses.entryPointAddress],
                        },
                        {
                            role: ISBE_ROLE,
                            members: [addresses.isbeFactoryAddress],
                        },
                        {
                            role: CONFIGURATION_MANAGER_ROLE,
                            members: [addresses.isbeFactoryAddress],
                        },
                    ],
                ]
            ),
        ],
    }
    const abiCoder = new ethers.AbiCoder()
    const encodedArgs = abiCoder.encode(
        [
            'tuple(address configurationManagement, bytes32 configurationId, uint256 version, address[] init, bytes[] data)',
        ],
        [args]
    )

    const IsbeProxyFactory = await ethers.getContractFactory('IsbeProxy')
    const initCodeHash = ethers.keccak256(
        ethers.concat([IsbeProxyFactory.bytecode, encodedArgs])
    )

    return ethers.getCreate2Address(
        addresses.isbeFactoryAddress,
        salt,
        initCodeHash
    )
}
