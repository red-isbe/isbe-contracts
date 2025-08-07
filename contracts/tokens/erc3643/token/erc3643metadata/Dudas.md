# Dudas a comentar antes de cerrar el módulo

1. En algunas interfaces vemos que se ha añadido el initialize que luego se expone en su contrato externo. Por ejemplo el initializeCap en IERC20Capped. Debemos añadirla en nuestra interface? O solo implementar el metodo en el contrato externo y ya?

2.  Cuando se inicialicen las facetas, se puede elegir el orden verdad? El tema esta que IERC3643 emite el evento UpdateTokenInformation(name,symbol, decimals, onchainID, version). Nosotros lo emitimos desde el initialize del ERC3643 que solo inicializa realmente onchainID y version. Por lo que para que este evento informe de la inicialización de todos las variables, la inicialización del ERC20 deberia ir primero. Lo estamos planteando bien?

3. Ponemos el modifier whenNotPaused en todas las funciones external (write) de los contratos external