import { expect } from 'chai'
import { ethers } from 'hardhat'
import { ReentrancyGuardTestWrapper } from '../typechain-types'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { TestConstants } from './testUtils'

describe('ReentrancyGuard', function () {
    let reentrancyGuard: ReentrancyGuardTestWrapper

    const REENTRANT_KEY = TestConstants.randomBytes32()

    async function deployFixture() {
        const reentrancyGuardFactory = await ethers.getContractFactory(
            'ReentrancyGuardTestWrapper'
        )
        const reentrancyGuardInstance = await reentrancyGuardFactory.deploy()
        await reentrancyGuardInstance.waitForDeployment()

        return {
            reentrancyGuard: reentrancyGuardInstance,
        }
    }

    beforeEach(async () => {
        const contracts = await loadFixture(deployFixture)
        reentrancyGuard = contracts.reentrancyGuard
    })

    it('GIVEN a normal call WHEN no reentrancy THEN call succeeds', async () => {
        await expect(reentrancyGuard.callProtected(REENTRANT_KEY))
            .to.emit(reentrancyGuard, 'ProtectedCalled')
            .withArgs(REENTRANT_KEY)
    })

    it('GIVEN a reentrant call WHEN using same key THEN it reverts with ReentrantNotAllowed', async () => {
        await expect(reentrancyGuard.forceReentrantFail(REENTRANT_KEY))
            .to.be.revertedWithCustomError(
                reentrancyGuard,
                'ReentrantNotAllowed'
            )
            .withArgs(REENTRANT_KEY)
    })
})
