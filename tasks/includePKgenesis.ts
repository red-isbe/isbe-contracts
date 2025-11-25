import { pkmanagement } from '../scripts/genesisGenerator';
import { task } from 'hardhat/config'

task(
    'genesis:includePK',
    'Include enerate privatekeys in genesis files'
)
    .addParam('templatefile', 'Template JSON file to use for r1 curve')
    .addParam('outputfile', 'Generated Output JSON file for r1 curve')
    .addParam('pkfile', 'File containing private keys to include')
    .addOptionalParam('amount', 'Amount of prefuunding')
    .setAction(async (taskArgs, hre) => {
        const {templatefile,outputfile,pkfile} = taskArgs;

        let prefund:bigint = 999999999999999999999999999999999999999999n;
        if(taskArgs.amount) {
            prefund = BigInt(taskArgs.amount);
        }

        console.info(
            '---------------------------------------------------------------------'
        )
        console.info('🚀    ISBE Genesis Private Key inclusion started...')
        console.info(
            '---------------------------------------------------------------------'
        )
        console.info(`📄 Using r1 template file: ${templatefile}`);
        console.info(`📄 Using r1 output file: ${outputfile}`);
        console.info(`📄 Using private key file: ${pkfile}`);
        console.info(`📄 Using prefund amount: ${prefund}`);

        const pkm:pkmanagement = new pkmanagement(templatefile,pkfile);

        console.info('🚀 Generating genesis file with private keys...');
        await pkm.generate(outputfile, prefund);

        
    });