export function isValidBytes(input: string): boolean {
    if (!/^0x[0-9a-fA-F]+$/.test(input)) {
        return false
    }

    const hexPart = input.slice(2)
    return hexPart.length % 2 === 0
}

export function isValidBytesAndLength(
    input: string,
    byteLength: number
): boolean {
    if (!isValidBytes(input)) {
        return false
    }

    // Check if length matches exactly the required byte length
    return input.length === 2 + byteLength * 2
}

export function checkValidHexadecimal(
    input: string = '',
    regExp: RegExp,
    length: number = 1,
    errorMessage: string = ''
) {
    const differentLength = input.length - length !== 0
    const notAdjustedToRegEx = !regExp.test(input)
    if (notAdjustedToRegEx || differentLength) throw new Error(errorMessage)
}
