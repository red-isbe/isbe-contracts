import { expect } from 'chai'
import { ethers } from 'hardhat'
import { IIsbeFactory, AccessControl } from '../../typechain-types'
import { Signer } from 'ethers'
import { deployGovernance } from '../initialization'

describe('IsbeProxy', function () {
    let admin: Signer
    let isbeFactory: IIsbeFactory
    let accessControl: AccessControl

    async function deployInitial() {
        ;[admin] = await ethers.getSigners()

        await deployIsbeFactory()
    }

    async function deployIsbeFactory() {
        const result = await deployGovernance(admin)

        isbeFactory = await ethers.getContractAt(
            'IIsbeFactory',
            await result.governanceContract.getAddress()
        )

        accessControl = await ethers.getContractAt(
            'AccessControl',
            await result.governanceContract.getAddress()
        )
    }

    beforeEach(async () => {
        await deployInitial()
    })

    describe('IsbeProxy', () => {
        it('GIVEN deployed governance proxy WHEN deploy Zero configuration management THEN it fails', async () => {
            await expect(
                isbeFactory.deployUseCase(
                    '0x0000000000000000000000000000000000000000000000000000000000000000',
                    1,
                    [],
                    false,
                    [],
                    []
                )
            ).to.be.revertedWithCustomError(accessControl, 'EmptyBytes32')
        })

        it('GIVEN deployed governance proxy WHEN deploy Zero configuration management address THEN it fails', async () => {
            await expect(
                isbeFactory.deployUseCase(
                    '0x0000000000000000000000000000000000000000000000000000000000000000',
                    1,
                    [],
                    false,
                    [],
                    []
                )
            ).to.be.revertedWithCustomError(accessControl, 'EmptyBytes32')
        })

        it('GIVEN deployed governance proxy WHEN deploy Zero configuration management address THEN it fails', async () => {
            await expect(
                isbeFactory.deployUseCase(
                    '0x0000000000000000000000000000000000000000000000000000000000000000',
                    1,
                    [],
                    false,
                    [],
                    []
                )
            ).to.be.revertedWithCustomError(accessControl, 'EmptyBytes32')
        })
    })
})
