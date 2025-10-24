import { expect } from 'chai'
import { ethers } from 'hardhat'
import { ReentrancyGuardTestWrapper } from '../typechain-types'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
// No random generators needed - removed TestConstants import

const randomBytes32 = () => ethers.hexlify(ethers.randomBytes(32))

describe('ReentrancyGuard', function () {
    let reentrancyGuard: ReentrancyGuardTestWrapper

    const REENTRANT_KEY = randomBytes32()

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
