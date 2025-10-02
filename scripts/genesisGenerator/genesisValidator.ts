import { Provider } from "ethers";



export async function getFacetsValidate(diamond: string, provider: Provider):Promise<{
    facets: {
        facetAddress: string
        functionSelectors: string[]
    }[]
}> {
     const diamondLoupe = await getDiamondLoupe(diamond, provider)
    
        const result = await diamondLoupe.facets()
    
        return {
            facets: result,
        }

}

async function getDiamondLoupe(diamondAddress: string, provider: Provider) {
      const { IDiamondLoupe__factory } = await import('../../typechain-types')
        return IDiamondLoupe__factory.connect(diamondAddress, provider);
}

export const LOUPE_ABI = [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "addr",
          "type": "address"
        }
      ],
      "name": "AddressZero",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "bytes4",
          "name": "_items",
          "type": "bytes4"
        }
      ],
      "name": "CannotAddItemToDiamondThatAlreadyExists",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "bytes4[]",
          "name": "_items",
          "type": "bytes4[]"
        }
      ],
      "name": "CannotAddItemsToZeroAddress",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "bytes4",
          "name": "_item",
          "type": "bytes4"
        }
      ],
      "name": "CannotRemoveImmutableItem",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "bytes4",
          "name": "_item",
          "type": "bytes4"
        }
      ],
      "name": "CannotRemoveItemThatDoesNotExist",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "bytes4",
          "name": "_item",
          "type": "bytes4"
        }
      ],
      "name": "CannotReplaceImmutableItems",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "bytes4",
          "name": "_item",
          "type": "bytes4"
        }
      ],
      "name": "CannotReplaceItemThatDoesNotExists",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "bytes4",
          "name": "_item",
          "type": "bytes4"
        }
      ],
      "name": "CannotReplaceItemWithTheSameItemFromTheSameFacet",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "bytes4[]",
          "name": "_items",
          "type": "bytes4[]"
        }
      ],
      "name": "CannotReplaceItemsFromFacetWithZeroAddress",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "EmptyBytes",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "EmptyBytes32",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "EmptyString",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "EmptyUint",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "bytes4",
          "name": "_functionSelector",
          "type": "bytes4"
        }
      ],
      "name": "FunctionNotFound",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_initializationContractAddress",
          "type": "address"
        },
        {
          "internalType": "bytes",
          "name": "_calldata",
          "type": "bytes"
        },
        {
          "internalType": "bytes",
          "name": "_error",
          "type": "bytes"
        }
      ],
      "name": "InitializationFunctionReverted",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_before",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "_after",
          "type": "uint256"
        }
      ],
      "name": "InvalidDates",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_contractAddress",
          "type": "address"
        },
        {
          "internalType": "string",
          "name": "_message",
          "type": "string"
        }
      ],
      "name": "NoBytecodeAtAddress",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_facetAddress",
          "type": "address"
        }
      ],
      "name": "NoItemsProvidedForUpdate",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "a",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "b",
          "type": "uint256"
        }
      ],
      "name": "NotSameLength",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_facetAddress",
          "type": "address"
        }
      ],
      "name": "RemoveFacetAddressMustBeZeroAddress",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "UnimplementedMethod",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "facetAddress",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "position",
          "type": "uint256"
        }
      ],
      "name": "ZeroItem",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "businessIdIntrospection",
      "outputs": [
        {
          "internalType": "bytes32",
          "name": "businessId_",
          "type": "bytes32"
        }
      ],
      "stateMutability": "pure",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes4",
          "name": "_functionSelector",
          "type": "bytes4"
        }
      ],
      "name": "facetAddress",
      "outputs": [
        {
          "internalType": "address",
          "name": "facetAddress_",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "facetAddresses",
      "outputs": [
        {
          "internalType": "address[]",
          "name": "facetAddresses_",
          "type": "address[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_facet",
          "type": "address"
        }
      ],
      "name": "facetFunctionSelectors",
      "outputs": [
        {
          "internalType": "bytes4[]",
          "name": "functionSelectors_",
          "type": "bytes4[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "facets",
      "outputs": [
        {
          "components": [
            {
              "internalType": "address",
              "name": "facetAddress",
              "type": "address"
            },
            {
              "internalType": "bytes4[]",
              "name": "functionSelectors",
              "type": "bytes4[]"
            }
          ],
          "internalType": "struct IDiamondLoupe.Facet[]",
          "name": "facets_",
          "type": "tuple[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "interfacesIntrospection",
      "outputs": [
        {
          "internalType": "bytes4[]",
          "name": "interfaces_",
          "type": "bytes4[]"
        }
      ],
      "stateMutability": "pure",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "selectorsIntrospection",
      "outputs": [
        {
          "internalType": "bytes4[]",
          "name": "selectors_",
          "type": "bytes4[]"
        }
      ],
      "stateMutability": "pure",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes4",
          "name": "_interfaceId",
          "type": "bytes4"
        }
      ],
      "name": "supportsInterface",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ]; 