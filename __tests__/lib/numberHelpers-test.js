import 'react-native';
import React from 'react';
import {
  formatLargeNumber,
  validatePercentage,
  increment,
  decrement,
  parseNumberInput,
  isNumber,
  isNonzeroNumber,
  isIntegerGreaterThanZero,
  isNumberGreaterThanZero
} from './../lib/numberHelpers';
// } from 'RetroluxMobile/app/lib/numberHelpers';

import renderer from 'react-test-renderer';

// formatLargeNumber TESTS
describe('formatLargeNumber()', () => {
  test('formatLargeNumber(0) returns "0"', () => {
    expect(formatLargeNumber(0)).toBe("0")
  })
  test('formatLargeNumber("") returns undefined', () => {
    expect(formatLargeNumber("")).toBe(undefined)
  })
  test('formatLargeNumber() returns undefined', () => {
    expect(formatLargeNumber()).toBe(undefined)
  })
  test('formatLargeNumber(10000) returns "10,000"', () => {
    expect(formatLargeNumber(10000)).toBe("10,000")
  })
  test('formatLargeNumber(1000) returns "1,000"', () => {
    expect(formatLargeNumber(1000)).toBe("1,000")
  })
  test('formatLargeNumber(2000000000) returns "2,000,000,000"', () => {
    expect(formatLargeNumber(2000000000)).toBe("2,000,000,000")
  })
})

// validatePercentage TESTS
describe('validatePercentage()', () => {
  test('validatePercentage(0) returns true', () => {
    expect(validatePercentage(0)).resolves.toBe(true)
  })
  test('validatePercentage(100) returns true', () => {
    expect(validatePercentage(100)).resolves.toBe(true)
  })
  test('validatePercentage(50) returns true', () => {
    expect(validatePercentage(50)).resolves.toBe(true)
  })
  test('validatePercentage("string") returns false', () => {
    expect(validatePercentage("string")).resolves.toBe(false)
  })
  test('validatePercentage(1000) returns false', () => {
    expect(validatePercentage(1000)).resolves.toBe(false)
  })
  test('validatePercentage(-1) returns false', () => {
    expect(validatePercentage(-1)).resolves.toBe(false)
  })
})

// increment TESTS
describe('increment()', () => {
  test('adds to number passed as arg', () => {
    expect(increment(1)).toBe(2)
  })
  test('adds to number passed as string arg', () => {
    expect(increment('1')).toBe(2)
  })
  test('it rounds floats', () => {
    expect(increment(0.1)).toBe(1)
    expect(increment(1.1)).toBe(2)
  })
  test('treats null as 0', () => {
    expect(increment(null)).toBe(1)
  })
  test('treats empty string as 0', () => {
    expect(increment('')).toBe(1)
  })
})

// decrement TESTS
describe('decrement()', () => {
  test('decreases a number passed as arg', () => {
    expect(decrement(1)).toBe(0)
  })
  test('will not go lower than zero', () => {
    expect(decrement(0)).toBe(0)
  })
  test('decreases a number passed as string arg', () => {
    expect(decrement('1')).toBe(0)
  })
  test('it rounds floats', () => {
    expect(decrement(3.1)).toBe(2)
  })
  test('treats null as 0', () => {
    expect(decrement(null)).toBe(0)
  })
  test('treats empty string as 0', () => {
    expect(decrement('')).toBe(0)
  })
})

// parseNumberInput TESTS
describe('parseNumberInput()', () => {
  test('returns numbers as is', () => {
    expect(parseNumberInput(1)).toBe(1)
  })
  test('adds to number passed as string arg', () => {
    expect(parseNumberInput('1')).toBe(1)
  })
  test('it rounds floats', () => {
    expect(parseNumberInput(0.1)).toBe(0)
    expect(parseNumberInput(1.1)).toBe(1)
  })
  test('treats null as 0', () => {
    expect(parseNumberInput(null)).toBe(0)
  })
  test('treats empty string as 0', () => {
    expect(parseNumberInput('')).toBe(0)
  })
})

// isNumber TESTS
describe('isNumber()', () => {
  test('returns true if valid number', () => {
    expect(isNumber(1)).toBe(true)
  })
  test('returns true if valid number string', () => {
    expect(isNumber('1')).toBe(true)
  })
  test('returns false if float string', () => {
    expect(isNumber('1.0')).toBe(false)
  })
  test('returns false if string has comma', () => {
    expect(isNumber('1,000')).toBe(false)
  })
  test('returns false if string has letters and symbols', () => {
    expect(isNumber('1A&')).toBe(false)
  })
})

describe('isNonzeroNumber()', () => {
  test('returns true if valid number', () => {
    expect(isNonzeroNumber(1)).toBe(true)
  })
  test('returns true if valid number string', () => {
    expect(isNonzeroNumber('1')).toBe(true)
  })
  test('returns false if string has comma', () => {
    expect(isNonzeroNumber('1,000')).toBe(false)
  })
  test('returns false if string has letters and symbols', () => {
    expect(isNonzeroNumber('1A&')).toBe(false)
  })
  test('returns false if string is 0', () => {
    expect(isNonzeroNumber('0')).toBe(false)
  })
  test('returns false if arg is int 0', () => {
    expect(isNonzeroNumber(0)).toBe(false)
  })
  test('returns false if arg is float 0', () => {
    expect(isNonzeroNumber(0.0)).toBe(false)
  })
})

// integer and >= 0
describe('isIntegerGreaterThanZero()', () => {
  test('returns true if valid number string', () => {
    expect(isIntegerGreaterThanZero('145')).toBe(true)
  })
  test('returns false if string is float', () => {
    expect(isIntegerGreaterThanZero('1.01')).toBe(false)
  })
  test('returns false if string is negative', () => {
    expect(isIntegerGreaterThanZero('-11')).toBe(false)
  })
  test('returns false if string has comma', () => {
    expect(isIntegerGreaterThanZero('1,001')).toBe(false)
  })
  test('returns false if string not number', () => {
    expect(isIntegerGreaterThanZero('1.0.01')).toBe(false)
  })
  test('returns false if string not number', () => {
    expect(isIntegerGreaterThanZero('1we32a1')).toBe(false)
  })
  test('returns false if string not number', () => {
    expect(isIntegerGreaterThanZero('hello')).toBe(false)
  })
  test('returns true if 0', () => {
    expect(isIntegerGreaterThanZero('0')).toBe(true)
  })
  test('returns true if blank', () => {
    expect(isIntegerGreaterThanZero('')).toBe(true)
  })
})

// number and >= 0
describe('isNumberGreaterThanZero()', () => {
  test('returns true if valid number string', () => {
    expect(isNumberGreaterThanZero('145')).toBe(true)
  })
  test('returns true if string is float', () => {
    expect(isNumberGreaterThanZero('1.01')).toBe(true)
  })
  test('returns false if string is negative', () => {
    expect(isNumberGreaterThanZero('-11')).toBe(false)
  })
  test('returns false if string has comma', () => {
    expect(isNumberGreaterThanZero('1,001')).toBe(false)
  })
  test('returns false if string not number', () => {
    expect(isNumberGreaterThanZero('1.0.01')).toBe(false)
  })
  test('returns false if string not number', () => {
    expect(isNumberGreaterThanZero('1we32a1')).toBe(false)
  })
  test('returns false if string not number', () => {
    expect(isNumberGreaterThanZero('hello')).toBe(false)
  })
  test('returns true if 0', () => {
    expect(isNumberGreaterThanZero('0')).toBe(true)
  })
  test('returns true if blank', () => {
    expect(isNumberGreaterThanZero('')).toBe(true)
  })
})
