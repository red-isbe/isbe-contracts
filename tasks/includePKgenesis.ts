import { pkmanagement } from '../scripts/genesisGenerator';
import { task } from 'hardhat/config'

task(
    'genesis:includePK',
    'Include enerate privatekeys in genesis files'
)
    .addParam('templatefiler1', 'Template JSON file to use for r1 curve')
    .addParam('templatefilek1', 'Template JSON file to use for r1 curve')
    .addParam('outputfiler1', 'Generated Output JSON file for r1 curve')
    .addParam('outputfilek1', 'Generated Output JSON file for r2 curve')
    .addParam('pkfile', 'File containing private keys to include')
    .addOptionalParam('amount', 'Amount of prefuunding')
    .setAction(async (taskArgs, hre) => {
        const {templatefiler1,templatefilek1,outputfiler1,outputfilek1,pkfile} = taskArgs;

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
        console.info(`📄 Using r1 template file: ${templatefiler1}`);
        console.info(`📄 Using k1 template file: ${templatefilek1}`);
        console.info(`📄 Using r1 output file: ${outputfiler1}`);
        console.info(`📄 Using k1 output file: ${outputfilek1}`);
        console.info(`📄 Using private key file: ${pkfile}`);
        console.info(`📄 Using prefund amount: ${prefund}`);

        const pkm:pkmanagement = new pkmanagement(templatefiler1, templatefilek1,pkfile);

        console.info('🚀 Generating k1 genesis file with private keys...');
        await pkm.generateK1(outputfilek1, prefund);
        
        console.info('🚀 Generating r1 genesis file with private keys...')
        await pkm.generateR1(outputfiler1, prefund);
        
    });