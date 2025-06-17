import { expect } from 'chai'
import { ethers } from 'hardhat'
import {
    ReentrancyGuardTestWrapper,
    ReentrancyGuardTestWrapper__factory,
} from '../typechain-types'

describe('ReentrancyGuard', function () {
    let reentrancyGuard: ReentrancyGuardTestWrapper
    let reentrancyGuardFactory: ReentrancyGuardTestWrapper__factory

    const REENTRANT_KEY = ethers.keccak256(
        ethers.toUtf8Bytes('function.reentrant')
    )

    beforeEach(async () => {
        reentrancyGuardFactory = await ethers.getContractFactory(
            'ReentrancyGuardTestWrapper'
        )
        reentrancyGuard = await reentrancyGuardFactory.deploy()
        await reentrancyGuard.waitForDeployment()
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
