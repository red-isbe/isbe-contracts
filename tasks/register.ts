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
import './diamond/cut/diamondCut'
import './diamond/cut/facetUpdates'
import './diamond/cut/interfaceCut'

// Pause/Unpause tasks
import './globalPause/pauseIsbe'
import './globalPause/unpauseIsbe'
import './pause/pause'
import './pause/unpause'
import './pause/isPaused'

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
import './configMgmt/getConfig'
import './configMgmt/setConfig'

// Proxy Factory tasks
import './proxyFactory/deployUseCase'
import './proxyFactory/deployUseCaseTo'
import './proxyFactory/getConfigurationByProxy'

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
