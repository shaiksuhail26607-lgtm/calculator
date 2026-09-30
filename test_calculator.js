/**
 * Automated Verification Test Suite for Calculator Logic
 */
const fs = require('fs');

// Extract Calculator class definition from script.js
const scriptContent = fs.readFileSync('script.js', 'utf8');
const classDefinition = scriptContent.substring(
  scriptContent.indexOf('class Calculator'),
  scriptContent.indexOf('// ==========================================================================')
);

// Mock DOM elements
class MockElement {
  constructor() {
    this.innerText = '';
    this.classList = {
      classes: new Set(),
      add(cls) { this.classes.add(cls); },
      remove(cls) { this.classes.delete(cls); },
      contains(cls) { return this.classes.has(cls); }
    };
    this.style = {};
  }
}

// Global mocks for Node environment
global.document = {
  querySelectorAll: () => []
};

// Evaluate the Calculator class in test scope
const evalContext = new Function('MockElement', `${classDefinition}; return Calculator;`);
const Calculator = evalContext(MockElement);

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passed++;
  } else {
    console.error(`[FAIL] ${testName}`);
    failed++;
  }
}

function runTests() {
  console.log('--- RUNNING CALCULATOR VERIFICATION TESTS ---');

  const prevEl = new MockElement();
  const currEl = new MockElement();
  const calc = new Calculator(prevEl, currEl);

  // Test 1: Initial state
  assert(calc.currentOperand === '0', 'Initial currentOperand is 0');
  assert(currEl.innerText === '0', 'Initial display shows 0');

  // Test 2: Basic input & decimals
  calc.appendNumber('5');
  assert(calc.currentOperand === '5', 'Append number 5');
  calc.appendNumber('.');
  calc.appendNumber('2');
  assert(calc.currentOperand === '5.2', 'Append decimal point and 2 -> 5.2');
  calc.appendNumber('.'); // Multiple decimal test
  assert(calc.currentOperand === '5.2', 'Prevent duplicate decimal points');

  // Test 3: Clear (AC)
  calc.clear();
  assert(calc.currentOperand === '0', 'AC resets currentOperand to 0');
  assert(calc.previousOperand === '', 'AC clears previousOperand');

  // Test 4: Addition (5 + 3 = 8)
  calc.appendNumber('5');
  calc.chooseOperation('+');
  assert(calc.previousOperand === '5', 'Operand 5 stored in previousOperand');
  assert(calc.operation === '+', 'Operator + selected');
  calc.appendNumber('3');
  calc.compute();
  assert(calc.currentOperand === '8', '5 + 3 evaluates to 8');
  assert(currEl.innerText === '8', 'Display shows 8');

  // Test 5: Subtraction (10 - 4 = 6)
  calc.clear();
  calc.appendNumber('1');
  calc.appendNumber('0');
  calc.chooseOperation('-');
  calc.appendNumber('4');
  calc.compute();
  assert(calc.currentOperand === '6', '10 - 4 evaluates to 6');

  // Test 6: Multiplication (7 * 6 = 42)
  calc.clear();
  calc.appendNumber('7');
  calc.chooseOperation('*');
  calc.appendNumber('6');
  calc.compute();
  assert(calc.currentOperand === '42', '7 * 6 evaluates to 42');

  // Test 7: Division (20 / 4 = 5)
  calc.clear();
  calc.appendNumber('2');
  calc.appendNumber('0');
  calc.chooseOperation('/');
  calc.appendNumber('4');
  calc.compute();
  assert(calc.currentOperand === '5', '20 / 4 evaluates to 5');

  // Test 8: Division by Zero Prevention
  calc.clear();
  calc.appendNumber('1');
  calc.appendNumber('5');
  calc.chooseOperation('/');
  calc.appendNumber('0');
  calc.compute();
  assert(calc.hasError === true, 'Division by zero triggers error state');
  assert(calc.currentOperand === 'Cannot divide by 0', 'Display shows "Cannot divide by 0"');
  assert(currEl.classList.contains('error'), 'Error CSS class applied');

  // Test 9: Recovery after error
  calc.appendNumber('9');
  assert(calc.currentOperand === '9', 'Input after error recovers cleanly');
  assert(calc.hasError === false, 'Error state reset on new entry');

  // Test 10: Operator Chaining (5 + 3 * 2 = 16)
  calc.clear();
  calc.appendNumber('5');
  calc.chooseOperation('+');
  calc.appendNumber('3');
  calc.chooseOperation('*'); // Should evaluate 5 + 3 = 8 and set op *
  assert(calc.previousOperand === '8', 'Chained operator computes intermediate 5 + 3 = 8');
  assert(calc.operation === '*', 'Pending operator is now *');
  calc.appendNumber('2');
  calc.compute();
  assert(calc.currentOperand === '16', 'Chained operation 8 * 2 evaluates to 16');

  // Test 11: Consecutive operator change (5 + then user changes to *)
  calc.clear();
  calc.appendNumber('5');
  calc.chooseOperation('+');
  assert(calc.operation === '+', 'Initial operator +');
  calc.chooseOperation('*');
  assert(calc.operation === '*', 'Operator smoothly changed to * without error');
  calc.appendNumber('4');
  calc.compute();
  assert(calc.currentOperand === '20', 'Evaluation 5 * 4 = 20 after operator change');

  // Test 12: Floating point precision (0.1 + 0.2 = 0.3)
  calc.clear();
  calc.appendNumber('0');
  calc.appendNumber('.');
  calc.appendNumber('1');
  calc.chooseOperation('+');
  calc.appendNumber('0');
  calc.appendNumber('.');
  calc.appendNumber('2');
  calc.compute();
  assert(calc.currentOperand === '0.3', '0.1 + 0.2 evaluates precisely to 0.3 (no IEEE 754 artifact)');

  // Test 13: Backspace / Delete
  calc.clear();
  calc.appendNumber('1');
  calc.appendNumber('2');
  calc.appendNumber('3');
  calc.delete();
  assert(calc.currentOperand === '12', 'Delete removes last digit 3 -> 12');
  calc.delete();
  assert(calc.currentOperand === '1', 'Delete removes last digit 2 -> 1');
  calc.delete();
  assert(calc.currentOperand === '0', 'Delete removes last digit 1 -> 0');

  // Test 14: Percentage
  calc.clear();
  calc.appendNumber('5');
  calc.appendNumber('0');
  calc.percentage();
  assert(calc.currentOperand === '0.5', '50% evaluates to 0.5');

  console.log(`\nRESULTS: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
