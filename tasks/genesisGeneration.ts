import { task } from 'hardhat/config'
import {
    GenesisAlloc,
    matchContractNames,
    retrieveSlotStructure,
} from '../scripts/genesisGenerator'

task(
    'genesis:generate',
    'Gerate genesis by extracting storage slots from deployment transactions in Hardhat network'
).setAction(async (taskArgs, hre) => {
    hre.network.name = 'hardhat'

    console.log('🚀 DeployAll...')
    const result = await hre.run('deployAll')
    console.log('✅ Deploy all (Done).')

    console.log('🚀 Genesis generation...')
    let slotStructure: GenesisAlloc = await retrieveSlotStructure(hre)
    slotStructure = await matchContractNames(hre, slotStructure)
    console.log(
        '✅ Slot structure retrieved.----------------------------------------------------------'
    )
    console.info(JSON.stringify(slotStructure, null, 2))
    // Optionally, write to a file
    // const fs = require('fs');
    // fs.writeFileSync('genesisAlloc.json', JSON.stringify(slotStructure, null, 2));
    console.log(
        '✅ Genesis generation (Done).----------------------------------------------------------'
    )

    return result // propagate deployAll result if neeeded
})
