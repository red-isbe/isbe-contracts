/**
 * Task Registration
 *
 * This file imports all individual task files to register them with Hardhat CLI.
 * It provides a single import point to replace the many individual imports
 * that were previously needed in hardhat.config.ts.
 */

// Business Logic tasks
import './businessLogic/deployIsbeFactory'
import './businessLogic/deployBusinessLogic'
import './businessLogic/getBusinessLogicAddress'
import './businessLogic/getBusinessLogicVersions'
import './businessLogic/getBusinessLogics'

// Diamond pattern tasks
import './diamond/loupe/getFacets'
import './diamond/loupe/getFacetAddress'
import './diamond/loupe/getFacetAddresses'
import './diamond/loupe/getFacetSelectors'
import './diamond/loupe/facetVersion'
import './diamond/cut/diamondCut'
import './diamond/cut/facetUpdates'
import './diamond/cut/interfaceCut'
import "./facetsReport"

// Pause/Unpause tasks
import './globalPause/pauseIsbe'
import './globalPause/unpauseIsbe'
import './pause/pause'
import './pause/unpause'
import './pause/isPaused'
import './pause/authorityLevel'

// Access Control tasks
import './access/accessControl/getRoleAdmin'
import './access/accessControl/getRoleMembers'
import './access/accessControl/getRoleMembersCount'
import './access/accessControl/getRolesByAccount'
import './access/accessControl/getRolesByAccountCount'
import './access/accessControl/grantRole'
import './access/accessControl/hasRole'
import './access/accessControl/renounceRole'
import './access/accessControl/revokeRole'
import './access/accessControl/setRoleAdmin'

// Configuration Management tasks
import './configMgmt/facets'
import './configMgmt/facetAddress'
import './configMgmt/facetAddresses'
import './configMgmt/facetSelectors'
import './configMgmt/facetSupportsInterface'
import './configMgmt/checkConfiguration'
import './configMgmt/getConfig'
import './configMgmt/setConfig'

// Proxy Factory tasks
import './proxyFactory/deployUseCase'
import './proxyFactory/deployUseCaseTo'
import './proxyFactory/getConfigurationByProxy'
import './proxyFactory/getDeployedProxiesByConfiguration'

// Deployment tasks
import './deployTest'
import './deployAll'
import './deployAllClean'

// Extract/Utility tasks
import './extract/byteCode'
import './extract/StorageSlots'

// Example tasks
import './examples/curveAwareTask'
import './examples/curveAwareDeployAll'

// Secp256r1 tasks
import './secp256r1/showAccounts'
import './secp256r1/generateEnv'

// Validation and Verification tasks
import './validation/validateAccounts'
import './verification/verifyBesuDeployment'
import './verification/deploymentStatus'
import './verification/governanceRoles'

// Client filtering
import './client/registerFilter'
import './client/getFiltersLength'
import './client/getFiltersByPage'
import './client/isFilterRegistered'

import './utils/buildConfigurationId'

// Besu Node Manager
import './client/besuNodeManager/getNode'

import './client/besuNodeManager/getTotalValidators'
import './client/besuNodeManager/getPaginatedValidators'
import './client/besuNodeManager/getValidatorState'
import './client/besuNodeManager/isValidator'

import './client/besuNodeManager/getTotalExecutionNodes'
import './client/besuNodeManager/getPaginatedExecutionNodes'
import './client/besuNodeManager/getExecutionNodeState'
import './client/besuNodeManager/isExecutionNode'

import './client/besuNodeManager/getTotalBootNodes'
import './client/besuNodeManager/getPaginatedBootNodes'
import './client/besuNodeManager/getBootNodeState'
import './client/besuNodeManager/isBootNode'

import './client/besuNodeManager/removeExecutionNode'
import './client/besuNodeManager/addExecutionNode'
import './client/besuNodeManager/quarantineExecution'
import './client/besuNodeManager/unquarantineExecution'

import './client/besuNodeManager/addBootNode'
import './client/besuNodeManager/removeBootNode'
import './client/besuNodeManager/quarantineBootNode'
import './client/besuNodeManager/unquarantineBootNode'

import './client/besuNodeManager/addValidator'
import './client/besuNodeManager/addValidatorStandby'
import './client/besuNodeManager/removeValidator'
import './client/besuNodeManager/quarantineValidator'
import './client/besuNodeManager/unquarantineValidator'
import './client/besuNodeManager/standbyValidator'
import './client/besuNodeManager/promoteValidator'
// Trusted Issuers Registry
import './identity/trustedissuersregistry/getIssuer'
import './identity/trustedissuersregistry/getIssuerAttributeRevisions'
import './identity/trustedissuersregistry/getIssuerAttributes'
import './identity/trustedissuersregistry/getIssuers'
import './identity/trustedissuersregistry/getLatestRevisionAttributeId'
import './identity/trustedissuersregistry/getLatestRevisionAttribute'
import './identity/trustedissuersregistry/setAttributeData'
import './identity/trustedissuersregistry/setAttributeMetadata'

// Genesis
import './genesisGeneration'
import './bootstapping'
import './includePKgenesis'

// Anchoring tasks
import './client/anchoring/getRegisteredChains'
import './client/anchoring/getChainMetadata'
import './client/anchoring/getAnchoringStats'
import './client/anchoring/getBlocksInRange'
import './client/anchoring/getLastNBlocks'
import './client/anchoring/isBlockAnchored'
import './client/anchoring/getAnchoredBlock'
import './client/anchoring/getLastAnchoredBlock'
import './client/anchoring/registerChain'
import './client/anchoring/anchorBlock'
import './client/anchoring/anchorBlocksBatch'