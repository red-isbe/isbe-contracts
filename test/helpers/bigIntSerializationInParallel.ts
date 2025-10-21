// Fix for BigInt serialization in parallel test execution with workerpool
// This is needed when using Mocha with parallel mode in Node.js 20+
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(BigInt.prototype as any).toJSON = function () {
    return this.toString()
}
