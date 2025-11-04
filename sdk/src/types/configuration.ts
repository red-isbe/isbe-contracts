/**
 * Configuration types for token deployment
 */

export type TokenStandard = 'ERC20' | 'ERC721' | 'ERC3643';

export interface TokenConfiguration {
  configId: string;
  name: string;
  standard: TokenStandard;
  businessLogics: string[];
  features: string[];
  description: string;
}

/**
 * Role definitions from contracts/constants/roles.sol
 */
export const ROLES = {
  DEFAULT_ADMIN_ROLE: '0x0000000000000000000000000000000000000000000000000000000000000000',
  PAUSER_ROLE: '0x65d7a28e3265b37a6474929f336521b332c1681b933f6cb9f3376673440d862a',
  MINTER_ROLE: '0xd8e8f9f9638a19d632dbb79025022db564483265e96ba99b2dd89df138e9cace',
  BURNER_ROLE: '0x9667e80708b6eeeb0053fa0cca44e028ff548e2a9f029edfeac87c118b08b7c8',
  GOVERNANCE_ROLE: '0x71840dc4906352362b0cdaf79870196c8e42acafade72d5d5a6d59291253ceb1',
  UPGRADER_ROLE: '0x189ab7a9244df0848122154315af71fe140f3db0fe014031783b0946b8c9d2e3',
  CONTROLLER_ROLE: '0x7b765e0e932d348852a6f810bfa1ab891e259123f02db8cdcde614c570223357',
} as const;

export type RoleType = keyof typeof ROLES;

export interface RoleAssignment {
  role: string;
  account: string;
}
