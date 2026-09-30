/**
 * Browser Calculator Application
 * Logic implemented strictly without eval() using state variables, switch statements, and parseFloat().
 * Reference: MDN Web Docs - EventTarget.addEventListener, switch, parseFloat, Number.EPSILON
 */

class Calculator {
  /**
   * @param {HTMLElement} previousOperandElement
   * @param {HTMLElement} currentOperandElement
   */
  constructor(previousOperandElement, currentOperandElement) {
    this.previousOperandElement = previousOperandElement;
    this.currentOperandElement = currentOperandElement;
    this.clear();
  }

  /**
   * Resets all internal states to initial defaults (Clear / AC)
   */
  clear() {
    this.currentOperand = '0';
    this.previousOperand = '';
    this.operation = undefined;
    this.shouldResetScreen = false;
    this.hasError = false;
    this.updateDisplay();
  }

  /**
   * Removes the last entered character (Backspace / DEL)
   */
  delete() {
    if (this.hasError) {
      this.clear();
      return;
    }

    if (this.shouldResetScreen) {
      return;
    }

    if (this.currentOperand === '0') {
      return;
    }

    // If only one character or negative single digit, revert to '0'
    if (
      this.currentOperand.length === 1 ||
      (this.currentOperand.length === 2 && this.currentOperand.startsWith('-'))
    ) {
      this.currentOperand = '0';
    } else {
      this.currentOperand = this.currentOperand.slice(0, -1);
    }

    this.updateDisplay();
  }

  /**
   * Appends numeric character or decimal point to the current operand
   * @param {string} number
   */
  appendNumber(number) {
    // If calculator is in error state or just evaluated an expression, reset for fresh entry
    if (this.hasError || this.shouldResetScreen) {
      if (number === '.') {
        this.currentOperand = '0.';
      } else {
        this.currentOperand = number.toString();
      }
      this.hasError = false;
      this.shouldResetScreen = false;
      this.updateDisplay();
      return;
    }

    // Prevent multiple decimal points
    if (number === '.' && this.currentOperand.includes('.')) {
      return;
    }

    // Prevent duplicate leading zeros (e.g., '00')
    if (this.currentOperand === '0' && number !== '.') {
      this.currentOperand = number.toString();
    } else {
      this.currentOperand += number.toString();
    }

    this.updateDisplay();
  }

  /**
   * Handles operator selection and operator chaining (e.g., 5 + 3 * 2)
   * @param {string} operation ('+', '-', '*', '/')
   */
  chooseOperation(operation) {
    if (this.hasError) {
      this.clear();
    }

    // If an operator was already chosen and the user selects another operator
    // before typing a new number, update the pending operation
    if (this.currentOperand === '' && this.previousOperand !== '') {
      this.operation = operation;
      this.updateDisplay();
      return;
    }

    // Operator Chaining:
    // If a previous operand and operation already exist, evaluate the intermediate result first
    if (this.previousOperand !== '') {
      const success = this.compute();
      if (!success) return; // Halt if division by zero or calculation error occurred
    }

    this.operation = operation;
    this.previousOperand = this.currentOperand;
    this.currentOperand = '';
    this.shouldResetScreen = false;
    this.updateDisplay();
  }

  /**
   * Evaluates percentage of the current operand
   */
  percentage() {
    if (this.hasError || this.currentOperand === '') return;

    const current = parseFloat(this.currentOperand);
    if (isNaN(current)) return;

    // Convert to percentage: current / 100
    const result = this.roundResult(current / 100);
    this.currentOperand = result.toString();
    this.updateDisplay();
  }

  /**
   * Computes the mathematical result of the previous and current operands using switch statements.
   * No eval() is used.
   * @returns {boolean} True if computation succeeded, false otherwise
   */
  compute() {
    if (this.hasError) return false;

    const prev = parseFloat(this.previousOperand);
    const curr = parseFloat(this.currentOperand);

    // If either operand is missing or invalid, do not execute
    if (isNaN(prev) || isNaN(curr)) {
      return false;
    }

    let computation;

    // Core arithmetic logic using switch statement
    switch (this.operation) {
      case '+':
        computation = prev + curr;
        break;
      case '-':
        computation = prev - curr;
        break;
      case '*':
        computation = prev * curr;
        break;
      case '/':
        // Division-by-zero protection: display error instead of Infinity or NaN
        if (curr === 0) {
          this.currentOperand = 'Cannot divide by 0';
          this.previousOperand = '';
          this.operation = undefined;
          this.hasError = true;
          this.shouldResetScreen = true;
          this.updateDisplay();
          return false;
        }
        computation = prev / curr;
        break;
      default:
        return false;
    }

    // Correct floating-point inaccuracies (e.g., 0.1 + 0.2 = 0.3)
    computation = this.roundResult(computation);

    this.currentOperand = computation.toString();
    this.operation = undefined;
    this.previousOperand = '';
    this.shouldResetScreen = true;
    this.updateDisplay();
    return true;
  }

  /**
   * Helper to eliminate IEEE 754 floating point precision artifacts
   * @param {number} num
   * @returns {number}
   */
  roundResult(num) {
    return Math.round((num + Number.EPSILON) * 1e10) / 1e10;
  }

  /**
   * Returns human-readable mathematical symbol for display
   * @param {string} op
   * @returns {string}
   */
  getDisplayOperator(op) {
    switch (op) {
      case '+': return '+';
      case '-': return '−';
      case '*': return '×';
      case '/': return '÷';
      default: return '';
    }
  }

  /**
   * Formats numbers with localized thousands separators while preserving decimals
   * @param {string|number} numberStr
   * @returns {string}
   */
  formatDisplayNumber(numberStr) {
    if (numberStr === '' || numberStr == null) return '';
    if (this.hasError) return numberStr;
    if (numberStr === '-') return '-';

    const stringVal = numberStr.toString();
    const parts = stringVal.split('.');
    const integerPart = parseFloat(parts[0]);
    const decimalPart = parts[1];

    let integerDisplay;
    if (isNaN(integerPart)) {
      integerDisplay = '';
    } else {
      integerDisplay = integerPart.toLocaleString('en', { maximumFractionDigits: 0 });
    }

    if (decimalPart != null) {
      return `${integerDisplay}.${decimalPart}`;
    } else {
      return integerDisplay;
    }
  }

  /**
   * Updates DOM elements with latest values and adjusts font scaling if needed
   */
  updateDisplay() {
    if (this.hasError) {
      this.currentOperandElement.innerText = this.currentOperand;
      this.previousOperandElement.innerText = '';
      this.currentOperandElement.classList.add('error');
      this.highlightActiveOperator(null);
      return;
    }

    this.currentOperandElement.classList.remove('error');

    // Primary display shows current operand or holds the previous value when waiting for next entry
    if (this.currentOperand === '') {
      if (this.previousOperand !== '') {
        this.currentOperandElement.innerText = this.formatDisplayNumber(this.previousOperand);
      } else {
        this.currentOperandElement.innerText = '0';
      }
    } else {
      this.currentOperandElement.innerText = this.formatDisplayNumber(this.currentOperand);
    }

    // Secondary display shows previous operand and chosen operator
    if (this.operation != null && this.previousOperand !== '') {
      this.previousOperandElement.innerText = `${this.formatDisplayNumber(this.previousOperand)} ${this.getDisplayOperator(this.operation)}`;
      this.highlightActiveOperator(this.operation);
    } else {
      this.previousOperandElement.innerText = '';
      this.highlightActiveOperator(null);
    }

    // Adjust font size dynamically for long numbers
    this.adjustFontSize();
  }

  /**
   * Visually highlights the active operator button if an operation is pending
   * @param {string|null} op
   */
  highlightActiveOperator(op) {
    const operatorButtons = document.querySelectorAll('.btn-operator');
    operatorButtons.forEach((btn) => {
      if (op && btn.dataset.operator === op && this.currentOperand === '') {
        btn.classList.add('is-active');
      } else {
        btn.classList.remove('is-active');
      }
    });
  }

  /**
   * Dynamically downscales font size if display exceeds width
   */
  adjustFontSize() {
    const textLength = this.currentOperandElement.innerText.length;
    if (textLength > 14) {
      this.currentOperandElement.style.fontSize = '1.35rem';
    } else if (textLength > 9) {
      this.currentOperandElement.style.fontSize = '1.75rem';
    } else {
      this.currentOperandElement.style.fontSize = '2.25rem';
    }
  }
}

// ==========================================================================
// Event Listeners Initialization (No inline onclick in HTML)
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  const previousOperandElement = document.getElementById('previousOperand');
  const currentOperandElement = document.getElementById('currentOperand');
  const keypad = document.getElementById('keypad');

  const calculator = new Calculator(previousOperandElement, currentOperandElement);

  // Click Event Listener on Keypad (Event Delegation)
  keypad.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;

    if (button.dataset.number != null) {
      calculator.appendNumber(button.dataset.number);
    } else if (button.dataset.operator != null) {
      calculator.chooseOperation(button.dataset.operator);
    } else if (button.dataset.action != null) {
      const action = button.dataset.action;
      switch (action) {
        case 'clear':
          calculator.clear();
          break;
        case 'delete':
          calculator.delete();
          break;
        case 'equals':
          calculator.compute();
          break;
        case 'percentage':
          calculator.percentage();
          break;
      }
    }
  });

  // Physical Keyboard Support
  window.addEventListener('keydown', (event) => {
    const key = event.key;

    // Number keys (0-9) and decimal point (.)
    if ((key >= '0' && key <= '9') || key === '.') {
      calculator.appendNumber(key);
      animateButtonByKey(`[data-number="${key}"]`);
    }
    // Arithmetic Operator keys (+, -, *, /)
    else if (key === '+' || key === '-' || key === '*' || key === '/') {
      calculator.chooseOperation(key);
      animateButtonByKey(`[data-operator="${key}"]`);
    }
    // Equals / Enter
    else if (key === 'Enter' || key === '=') {
      event.preventDefault();
      calculator.compute();
      animateButtonByKey('[data-action="equals"]');
    }
    // Backspace / Delete
    else if (key === 'Backspace') {
      event.preventDefault();
      calculator.delete();
      animateButtonByKey('[data-action="delete"]');
    }
    // Escape or 'c' / 'C' for Clear
    else if (key === 'Escape' || key.toLowerCase() === 'c') {
      calculator.clear();
      animateButtonByKey('[data-action="clear"]');
    }
    // Percentage (%)
    else if (key === '%') {
      calculator.percentage();
      animateButtonByKey('[data-action="percentage"]');
    }
  });

  /**
   * Triggers active visual feedback when pressing keyboard shortcuts
   * @param {string} selector
   */
  function animateButtonByKey(selector) {
    const btn = document.querySelector(selector);
    if (!btn) return;
    btn.classList.add('is-active');
    setTimeout(() => {
      btn.classList.remove('is-active');
    }, 120);
  }
});
