import { task } from 'hardhat/config'
import {
    GenesisAlloc,
    GenesisValidation,
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


task(
    'genesis:validate',
    'Validate genesis deployment'
).setAction(async (taskArgs, hre) => {
   
    const validation:GenesisValidation = new GenesisValidation(hre, "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6");

    await validation.validate();

    console.log(
        '✅ Genesis validation (Done).----------------------------------------------------------'
    )

    return // propagate deployAll result if neeeded
})
