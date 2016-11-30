const assert = require('chai').assert
const { deepEqual } = assert
const {
  map,
  prop,
  curry,
  normalizeToSuccess
} = require('./util')
const { runTest } = require('./run')

const testHandlers = async (fn, payload, actionHandlers, expectedOutput) => {
  let {log} = await runTest(actionHandlers, fn, payload)
  const outputPicker = prop(1)
  const actualOutput = map(outputPicker, log)
  deepEqual(actualOutput, expectedOutput)
}

const testFn = (fn, expected, index = 0, previousOutput = null) => {
  checkForExpectedTypeMismatches(expected)

  const [input, expectedOutput] = expected[index]
  let g
  if (fn.next) {
    g = fn
  } else {
    g = fn(input)
  }

  let normalizedInput
  if (Array.isArray(previousOutput)) {
    normalizedInput = input
  } else {
    normalizedInput = normalizeToSuccess(input)
  }
  let { value: actualOutput, done } = g.next(normalizedInput)
  deepEqual(actualOutput, expectedOutput)
  if (!done || index + 1 < expected.length) {
    testFn(g, expected, index + 1, actualOutput)
  }
}

const checkForExpectedTypeMismatches = (expected) => {
  for (let i = 0; i < expected.length; i++) {
    if (i + 1 >= expected.length) return
    let output = expected[i][1]
    let nextInput = expected[i + 1][0]

    if (Array.isArray(output)) {
      assert(Array.isArray(nextInput), 'If an array of actions is yielded, it will return an array of results.')
    }
  }
}

const testIt = (fn, expected) => {
  return function () {
    let expectedLog = expected()
    testFn(fn, expectedLog)
  }
}

module.exports = {
  testHandlers: curry(testHandlers),
  testFn: curry(testFn),
  testIt: curry(testIt)
}