import Decimal from 'decimal.js';

const MAX_DECIMAL_PLACES = 8;

Decimal.set({ rounding: Decimal.ROUND_HALF_UP });

/**
 * Performs arithmetic with fixed decimal precision for the web calculator.
 * @param {string|number} num1
 * @param {string|number} num2
 * @param {string} operation  one of '+', '-', '*', '/'
 * @returns {number}
 * @throws {Error} on division by zero or unknown operation
 */
export function calculate(num1, num2, operation) {
  const a = new Decimal(num1);
  const b = new Decimal(num2);

  let result;
  if (operation === '+') {
    result = a.plus(b);
  } else if (operation === '-') {
    result = a.minus(b);
  } else if (operation === '*') {
    result = a.times(b);
  } else if (operation === '/') {
    if (b.isZero()) {
      throw new Error('Division by zero');
    }
    result = a.dividedBy(b);
  } else {
    throw new Error(`Unknown operation: ${operation}`);
  }

  return result.toDecimalPlaces(MAX_DECIMAL_PLACES).toNumber();
}
