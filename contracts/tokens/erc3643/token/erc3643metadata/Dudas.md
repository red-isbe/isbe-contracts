# Dudas a comentar antes de cerrar el módulo

1.  Cuando se inicialicen las facetas, se puede elegir el orden verdad? El tema esta que IERC3643 emite el evento UpdateTokenInformation(name,symbol, decimals, onchainID, version). Nosotros lo emitimos desde el initialize del ERC3643 que solo inicializa realmente onchainID y version. Por lo que para que este evento informe de la inicialización de todos las variables, la inicialización del ERC20 deberia ir primero. Lo estamos planteando bien?

2. Ponemos el modifier whenNotPaused en todas las funciones external (write) de los contratos external