import { ERC20_RESOLVER_KEYS } from '../resolverKeys'
import { ARTIFACT_PATHS, CONTRACT_NAMES } from '../configurationIds'

export const ERC20_DEFINITIONS = [
    {
        description: CONTRACT_NAMES.ERC20,
        key: ERC20_RESOLVER_KEYS.ERC20,
        contractName: CONTRACT_NAMES.ERC20,
        artifactPath: ARTIFACT_PATHS.ERC20,
    },
    {
        description: CONTRACT_NAMES.ERC20_SNAPSHOT,
        key: ERC20_RESOLVER_KEYS.SNAPSHOT,
        contractName: CONTRACT_NAMES.ERC20_SNAPSHOT,
        artifactPath: ARTIFACT_PATHS.ERC20_SNAPSHOT,
    },
    {
        description: CONTRACT_NAMES.ERC20_BURNABLE,
        key: ERC20_RESOLVER_KEYS.BURNABLE,
        contractName: CONTRACT_NAMES.ERC20_BURNABLE,
        artifactPath: ARTIFACT_PATHS.ERC20_BURNABLE,
    },
    {
        description: CONTRACT_NAMES.ERC20_CAPPED,
        key: ERC20_RESOLVER_KEYS.CAPPED,
        contractName: CONTRACT_NAMES.ERC20_CAPPED,
        artifactPath: ARTIFACT_PATHS.ERC20_CAPPED,
    },
    {
        description: CONTRACT_NAMES.ERC20_CONTROLLER,
        key: ERC20_RESOLVER_KEYS.CONTROLLER,
        contractName: CONTRACT_NAMES.ERC20_CONTROLLER,
        artifactPath: ARTIFACT_PATHS.ERC20_CONTROLLER,
    },
]
