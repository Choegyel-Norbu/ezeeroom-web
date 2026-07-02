/**
 * BankType enum for Bhutanese banks
 * Contains all major banks and financial institutions in Bhutan
 */

export const BankType = {
  // Commercial Banks
  BOB: {
    code: "BOB",
    name: "Bank of Bhutan",
    shortName: "BOB",
    accountNumberLength: { min: 9, max: 9 },
    accountNumberPattern: /^\d{9}$/
  },
  BNB: {
    code: "BNB", 
    name: "Bhutan National Bank",
    shortName: "BNB",
    accountNumberLength: { min: 9, max: 9 },
    accountNumberPattern: /^\d{9}$/
  },
  DPNB: {
    code: "DPNB",
    name: "Druk PNB Bank", 
    shortName: "DPNB",
    accountNumberLength: { min: 12, max: 12 },
    accountNumberPattern: /^\d{12}$/
  },
  
  // Development Finance Institutions
  BDB: {
    code: "BDB",
    name: "Bhutan Development Bank",
    shortName: "BDB",
    accountNumberLength: { min: 12, max: 12 },
    accountNumberPattern: /^\d{12}$/
  },
  
  // Mobile Financial Services
  TBANK: {
    code: "TBANK",
    name: "T-Bank",
    shortName: "T-Bank",
    accountNumberLength: { min: 9, max: 9 },
    accountNumberPattern: /^\d{9}$/
  },
  DKBANK: {
    code: "DKBANK",
    name: "Digital Kidu Bank",
    shortName: "DK Bank",
    accountNumberLength: { min: 12, max: 12 },
    accountNumberPattern: /^\d{12}$/
  }
};

/**
 * Get all bank options for select dropdowns
 * @returns {Array} Array of bank objects with value, label, and description
 */
export const getBankOptions = () => {
  return Object.values(BankType).map(bank => ({
    value: bank.code,
    label: bank.name,
    description: bank.shortName
  }));
};

/**
 * Get bank name by code
 * @param {string} code - Bank code
 * @returns {string} Bank name or "Unknown Bank" if not found
 */
export const getBankNameByCode = (code) => {
  const bank = Object.values(BankType).find(b => b.code === code);
  return bank ? bank.name : "Unknown Bank";
};

/**
 * Get bank short name by code
 * @param {string} code - Bank code
 * @returns {string} Bank short name or "Unknown" if not found
 */
export const getBankShortNameByCode = (code) => {
  const bank = Object.values(BankType).find(b => b.code === code);
  return bank ? bank.shortName : "Unknown";
};

/**
 * Get bank validation rules by code
 * @param {string} code - Bank code
 * @returns {Object} Bank validation rules or default rules if not found
 */
export const getBankValidationRules = (code) => {
  const bank = Object.values(BankType).find(b => b.code === code);
  return bank ? {
    minLength: bank.accountNumberLength.min,
    maxLength: bank.accountNumberLength.max,
    pattern: bank.accountNumberPattern
  } : {
    minLength: 8,
    maxLength: 20,
    pattern: /^\d{8,20}$/
  };
};

/**
 * Validate bank account number
 * @param {string} accountNumber - Account number to validate
 * @param {string} bankCode - Bank code
 * @returns {Object} Validation result with isValid and error message
 */
export const validateBankAccountNumber = (accountNumber, bankCode) => {
  if (!accountNumber || !bankCode) {
    return { isValid: false, error: "Account number and bank type are required" };
  }

  const rules = getBankValidationRules(bankCode);
  
  // Check if account number contains only digits
  if (!/^\d+$/.test(accountNumber)) {
    return { isValid: false, error: "Account number must contain only numbers" };
  }

  // Check length constraints
  if (accountNumber.length < rules.minLength) {
    return { 
      isValid: false, 
      error: `Account number must be at least ${rules.minLength} digits long` 
    };
  }

  if (accountNumber.length > rules.maxLength) {
    return { 
      isValid: false, 
      error: `Account number cannot exceed ${rules.maxLength} digits` 
    };
  }

  // Check pattern match
  if (!rules.pattern.test(accountNumber)) {
    return { 
      isValid: false, 
      error: `Invalid account number format for selected bank` 
    };
  }

  return { isValid: true, error: null };
};

/**
 * Get maximum allowed length for account number input
 * @param {string} bankCode - Bank code
 * @returns {number} Maximum allowed length
 */
export const getMaxAccountNumberLength = (bankCode) => {
  const rules = getBankValidationRules(bankCode);
  return rules.maxLength;
};

export default BankType;
