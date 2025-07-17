## IToken

Comparison of ITokenBKP.sol and IToken.sol methods:

| ERC3643 Token Function Signature                        | Present in IToken.sol (via inherited interface) |
| ------------------------------------------------------- | ----------------------------------------------- |
| setName(string calldata)                                | IERC20Extended                                  |
| setSymbol(string calldata)                              | IERC20Extended                                  |
| setOnchainID(address)                                   | IERC20Extended                                  |
| pause()                                                 | IPause                                          |
| unpause()                                               | IPause                                          |
| setAddressFrozen(address,bool)                          | ITokenFreeze                                    |
| freezePartialTokens(address,uint256)                    | ITokenFreeze                                    |
| unfreezePartialTokens(address,uint256)                  | ITokenFreeze                                    |
| setIdentityRegistry(address)                            | IERC3643Infrastructure                          |
| setCompliance(address)                                  | IERC3643Infrastructure                          |
| forcedTransfer(address,address,uint256) returns (bool)  | IERC20Extended                                  |
| mint(address,uint256)                                   | IERC20Extended                                  |
| burn(address,uint256)                                   | IERC20Extended                                  |
| recoveryAddress(address,address,address) returns (bool) | IRecovery                                       |
| batchTransfer(address[],uint256[])                      | IBatches                                        |
| batchForcedTransfer(address[],address[],uint256[])      | IBatches                                        |
| batchMint(address[],uint256[])                          | IBatches                                        |
| batchBurn(address[],uint256[])                          | IBatches                                        |
| batchSetAddressFrozen(address[],bool[])                 | IBatches                                        |
| batchFreezePartialTokens(address[],uint256[])           | IBatches                                        |
| batchUnfreezePartialTokens(address[],uint256[])         | IBatches                                        |
| decimals() view returns (uint8)                         | IERC20Extended                                  |
| name() view returns (string)                            | IERC20Extended                                  |
| onchainID() view returns (address)                      | IERC20Extended                                  |
| symbol() view returns (string)                          | IERC20Extended                                  |
| version() view returns (string)                         | IERC20Extended                                  |
| identityRegistry() view returns (IIdentityRegistry)     | IERC3643Infrastructure                          |
| compliance() view returns (ICompliance)                 | IERC3643Infrastructure                          |
| paused() view returns (bool)                            | IPause                                          |
| isFrozen(address) view returns (bool)                   | ITokenFreeze                                    |
| getFrozenTokens(address) view returns (uint256)         | ITokenFreeze                                    |

All methods from ITokenBKP.sol are present in IToken.sol via its inherited interfaces.

-
