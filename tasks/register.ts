/* -----------------------------------------------------------------------------------
Copyright (c) 2025 Comunidad de Madrid & Alastria
Licensed under the Apache License, Version 2.0 (the "License");
You may not use this file except in compliance with the License.
You may obtain a copy of the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
----------------------------------------------------------------------------------- */
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
import './facetsReport'

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
import './secp256r1/generateEnv.smtp'

// Validation and Verification tasks
import './validation/validateAccounts'
import './verification/verifyBesuDeployment'
import './verification/deploymentStatus'
import './verification/governanceRoles'

// Client filtering
import './client/filtering/registerFilter'
import './client/filtering/updateFilter'
import './client/filtering/getFiltersLength'
import './client/filtering/getFiltersByPage'
import './client/filtering/isFilterRegistered'

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

// Network Directory - Write Operations
import './client/networkDirectory/createNetwork'
import './client/networkDirectory/updateNetwork'
import './client/networkDirectory/deleteNetwork'
import './client/networkDirectory/setResource'
import './client/networkDirectory/deleteResource'

// Network Directory - Read Operations
import './client/networkDirectory/getNetwork'
import './client/networkDirectory/getAllNetworks'
import './client/networkDirectory/getNetworksByAlgorithm'
import './client/networkDirectory/getNetworksCount'
import './client/networkDirectory/getNetworksPaginated'
import './client/networkDirectory/getResourceKeys'
import './client/networkDirectory/getResourceKeysPaginated'
import './client/networkDirectory/getResourceCount'

// TimeStamping Registry - Write Operations
import './client/timestamping/stamp'
import './client/timestamping/stampWithSignature'

// TimeStamping Registry - Read Operations
import './client/timestamping/isOriginalHashRegistered'
import './client/timestamping/isTsaHashRegistered'
import './client/timestamping/isExternalReferenceIdRegistered'
import './client/timestamping/getTsrRecordFromOriginalHash'
import './client/timestamping/getStampedSize'
import './client/timestamping/getPaginatedStamped'

// ENS Registry - Read Operations
import './ens/owner'
import './ens/resolver'
import './ens/ttl'
import './ens/recordExists'
import './ens/isApprovedForAll'

// ENS Registry - Write Operations
import './ens/setOwner'
import './ens/setResolver'
import './ens/setTTL'
import './ens/setApprovalForAll'
import './ens/setSubnodeOwner'
import './ens/setSubnodeRecord'
import './ens/setRecord'

// DID Document Detailed - Read Operations
import './didDocument/getDidDocument'
import './didDocument/getDidDocumentByTimestamp'
import './didDocument/getDids'
import './didDocument/getNetworkEllipticType'

// DID Document Detailed - Initialization
import './didDocument/initializeDiDRegistry'

// DID Document Detailed - Write Operations
import './didDocument/updateAlsoKnownAs'
import './didDocument/updateBaseDocument'
import './didDocument/insertDidDocument'
import './didDocument/insertFirstDidDocument'

// Access Control DID - Read Operations
import './accessControlDid/hasRoleForDid'
import './accessControlDid/getRolesByDid'
import './accessControlDid/getRolesByDidLength'
import './accessControlDid/getDidRoleMembers'
import './accessControlDid/getRoleMembersCountForDids'

// Access Control DID - Write Operations
import './accessControlDid/grantDidRole'
import './accessControlDid/revokeDidRole'

// DID Controller - Read Operations
import './didController/checkControllerByBytes'
import './didController/checkControllerByDid'
import './didController/getDidsByController'

// DID Controller - Write Operations
import './didController/addController'
import './didController/revokeController'

// DID Verification Method - Write Operations
import './didVerificationMethod/addVerificationMethod'
import './didVerificationMethod/revokeVerificationMethod'
import './didVerificationMethod/expireVerificationMethod'
import './didVerificationMethod/rollVerificationMethod'

// DID Verification Relationship - Read/Write Operations
import './didVerificationRelationship/addVerificationRelationship'
import './didVerificationRelationship/getDidsByVerificationRelationship'

// DID Registry Query - Read Operations
import './didRegistryQuery/didOf'
import './didRegistryQuery/isKnownDid'

// Trusted Issuers Registry
import './identity/trustedissuersregistry/getIssuer'
import './identity/trustedissuersregistry/getIssuerAttributeRevisions'
import './identity/trustedissuersregistry/getIssuerAttributes'
import './identity/trustedissuersregistry/getIssuers'
import './identity/trustedissuersregistry/getLatestRevisionAttributeId'
import './identity/trustedissuersregistry/getLatestRevisionAttribute'
import './identity/trustedissuersregistry/setAttributeData'
import './identity/trustedissuersregistry/setAttributeMetadata'

// shamir secret sharing tooling
import './secret-sharing/sss.generate'
import './secret-sharing/sss.generates.smtp'
import './secret-sharing/sss.recover'

// ERC20 Token Operations

// Native Token Operations
import './native/transfer'

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

import './assign-roles'
import './decode-error'
