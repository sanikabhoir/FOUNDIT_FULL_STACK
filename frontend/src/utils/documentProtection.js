// src/utils/documentProtection.js
// ============ SENSITIVE DOCUMENT HANDLING SYSTEM ============

// Sensitive document types to detect
const SENSITIVE_DOCUMENT_TYPES = {
  PASSPORT: ['passport', 'travel document'],
  AADHAR: ['aadhar', 'aadhaar', 'national id'],
  DRIVING_LICENSE: ['driving license', 'dl', 'driver license'],
  PAN_CARD: ['pan', 'pan card', 'tax id'],
  VOTER_ID: ['voter', 'voter id', 'voting card'],
  BANK_STATEMENT: ['bank statement', 'account statement'],
  CHEQUE: ['cheque', 'check', 'bank cheque'],
  CREDIT_CARD: ['credit card', 'debit card'],
  ID_CARD: ['id card', 'identity card', 'employee id'],
  MEDICAL: ['medical', 'prescription', 'health record'],
  INSURANCE: ['insurance', 'policy', 'insurance card']
};

// Patterns to detect sensitive data
const SENSITIVE_PATTERNS = {
  AADHAR: /\d{4}\s?\d{4}\s?\d{4}/g,
  PAN: /[A-Z]{5}[0-9]{4}[A-Z]{1}/g,
  PASSPORT: /[A-Z]{1}[0-9]{7}/g,
  BANK_ACCOUNT: /\b\d{9,18}\b/g,
  CREDIT_CARD: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
  PHONE: /\b\d{10}\b|\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
  EMAIL: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  SSN: /\d{3}-\d{2}-\d{4}/,
  DATE_OF_BIRTH: /\b(0?[1-9]|[12]\d|3[01])[-/](0?[1-9]|1[012])[-/](19|20)?\d{2}\b/g
};

// ============ EXPORTED FUNCTIONS ============

export const detectDocumentType = (itemName, description) => {
  const textToAnalyze = `${itemName} ${description}`.toLowerCase();
  
  for (const [docType, keywords] of Object.entries(SENSITIVE_DOCUMENT_TYPES)) {
    for (const keyword of keywords) {
      if (textToAnalyze.includes(keyword)) {
        return {
          type: docType,
          isSensitive: true
        };
      }
    }
  }
  
  return {
    type: 'REGULAR',
    isSensitive: false
  };
};

export const detectSensitiveData = (text) => {
  const detected = {
    hasAadhar: false,
    hasPAN: false,
    hasPassport: false,
    hasBankAccount: false,
    hasCreditCard: false,
    hasPhone: false,
    hasEmail: false,
    hasSSN: false,
    hasDOB: false,
    sensitivityLevel: 'none', // none, low, medium, high
    matches: [],
    suggestions: []
  };
  
  const textLower = text.toLowerCase();
  
  if (SENSITIVE_PATTERNS.AADHAR.test(textLower)) {
    detected.hasAadhar = true;
    detected.matches.push('Aadhar number');
    detected.suggestions.push('Replace with: "Found ID document (numbers hidden)"');
  }
  
  if (SENSITIVE_PATTERNS.PAN.test(textLower)) {
    detected.hasPAN = true;
    detected.matches.push('PAN card');
    detected.suggestions.push('Replace with: "Found tax ID card"');
  }
  
  if (SENSITIVE_PATTERNS.PASSPORT.test(textLower)) {
    detected.hasPassport = true;
    detected.matches.push('Passport number');
    detected.suggestions.push('Replace with: "Found passport (details private)"');
  }
  
  if (SENSITIVE_PATTERNS.BANK_ACCOUNT.test(textLower)) {
    detected.hasBankAccount = true;
    detected.matches.push('Bank account number');
    detected.suggestions.push('Replace with: "Found bank document"');
  }
  
  if (SENSITIVE_PATTERNS.CREDIT_CARD.test(textLower)) {
    detected.hasCreditCard = true;
    detected.matches.push('Credit card number');
    detected.suggestions.push('Replace with: "Found card (details hidden)"');
  }
  
  if (SENSITIVE_PATTERNS.PHONE.test(textLower)) {
    detected.hasPhone = true;
    detected.matches.push('Phone number');
    detected.suggestions.push('Replace with: "XXX-XXX-XXXX" in description');
  }
  
  if (SENSITIVE_PATTERNS.EMAIL.test(textLower)) {
    detected.hasEmail = true;
    detected.matches.push('Email address');
    detected.suggestions.push('Replace with: "xxxx@domain.com"');
  }
  
  if (SENSITIVE_PATTERNS.SSN.test(textLower)) {
    detected.hasSSN = true;
    detected.matches.push('Social security number');
    detected.suggestions.push('Replace with: "XXX-XX-XXXX"');
  }
  
  if (SENSITIVE_PATTERNS.DATE_OF_BIRTH.test(textLower)) {
    detected.hasDOB = true;
    detected.matches.push('Date of birth');
    detected.suggestions.push('You can keep this - just be aware it\'s visible');
  }
  
  // Determine sensitivity level
  if (detected.matches.length === 0) {
    detected.sensitivityLevel = 'none';
  } else if (detected.hasAadhar || detected.hasPAN || detected.hasPassport || detected.hasBankAccount || detected.hasCreditCard || detected.hasSSN) {
    detected.sensitivityLevel = 'high';
  } else if (detected.hasPhone || detected.hasEmail) {
    detected.sensitivityLevel = 'medium';
  } else {
    detected.sensitivityLevel = 'low';
  }
  
  return detected;
};

export const redactSensitiveData = (text) => {
  let redacted = text;
  
  redacted = redacted.replace(SENSITIVE_PATTERNS.AADHAR, 'XXXX XXXX XXXX');
  redacted = redacted.replace(SENSITIVE_PATTERNS.PAN, 'XXXXX0000X');
  redacted = redacted.replace(SENSITIVE_PATTERNS.PASSPORT, 'X0000000');
  redacted = redacted.replace(SENSITIVE_PATTERNS.BANK_ACCOUNT, (match) => 'XXXX' + match.slice(-4));
  redacted = redacted.replace(SENSITIVE_PATTERNS.CREDIT_CARD, (match) => {
    const digitsOnly = match.replace(/\D/g, '');
    return 'XXXX XXXX XXXX ' + digitsOnly.slice(-4);
  });
  redacted = redacted.replace(SENSITIVE_PATTERNS.PHONE, 'XXX-XXX-XXXX');
  redacted = redacted.replace(SENSITIVE_PATTERNS.EMAIL, (match) => {
    const domain = match.split('@')[1];
    return 'xxxx@' + domain;
  });
  redacted = redacted.replace(SENSITIVE_PATTERNS.SSN, 'XXX-XX-XXXX');
  redacted = redacted.replace(SENSITIVE_PATTERNS.DATE_OF_BIRTH, 'XX/XX/XXXX');
  
  return redacted;
};

export const validateWithGuidance = (itemName, description, aiDescription) => {
  const docType = detectDocumentType(itemName, description);
  const dataDetection = detectSensitiveData(`${itemName} ${description}`);
  
  const isGovernmentDoc = ['PASSPORT', 'AADHAR', 'DRIVING_LICENSE', 'PAN_CARD', 'VOTER_ID'].includes(docType.type);
  
  const validation = {
    allowed: true,
    hasWarnings: false,
    hasHighSensitivity: dataDetection.sensitivityLevel === 'high',
    documentType: docType.type,
    sensitiveData: dataDetection,
    suggestions: [],
    message: ''
  };
  
  if (isGovernmentDoc && itemName.toLowerCase().includes(docType.type.toLowerCase())) {
    validation.message = `You're reporting a ${docType.type}. That's fine! We recommend:\n\n`;
    validation.message += `1. Don't include specific numbers (passport/ID numbers, etc.)\n`;
    validation.message += `2. Focus on identifying features (color, condition, distinguishing marks)\n`;
    validation.message += `3. We'll help find the owner through other matching criteria\n`;
    validation.hasWarnings = true;
    validation.suggestions = [
      `Describe the ${docType.type} without personal numbers`,
      'Mention only the document type and visible features',
      'The owner will identify themselves when matching'
    ];
  }
  
  if (dataDetection.matches.length > 0) {
    validation.hasWarnings = true;
    
    if (dataDetection.sensitivityLevel === 'high') {
      validation.message += `We detected highly sensitive information: ${dataDetection.matches.join(', ')}\n\n`;
      validation.message += `This will be automatically masked before storage for privacy:\n`;
      dataDetection.suggestions.forEach(s => {
        validation.message += `• ${s}\n`;
      });
    } else if (dataDetection.sensitivityLevel === 'medium') {
      validation.message += `We found: ${dataDetection.matches.join(', ')}\n`;
      validation.message += `These will be redacted for privacy protection.\n`;
    }
  }
  
  if (!validation.message) {
    validation.message = 'Your submission looks good!';
  }
  
  return validation;
};

export const prepareSafeSubmission = (itemName, description, aiDescription, autoRedact = true) => {
  let safeItemName = itemName;
  let safeDescription = description;
  let wasRedacted = false;
  
  const dataDetection = detectSensitiveData(`${itemName} ${description}`);
  
  if (autoRedact && dataDetection.sensitivityLevel === 'high') {
    safeItemName = redactSensitiveData(itemName);
    safeDescription = redactSensitiveData(description);
    wasRedacted = true;
  } else if (autoRedact && dataDetection.sensitivityLevel === 'medium') {
    safeDescription = redactSensitiveData(description);
    wasRedacted = true;
  }
  
  return {
    success: true,
    itemName: safeItemName,
    description: safeDescription,
    wasRedacted,
    sensitivityLevel: dataDetection.sensitivityLevel,
    detectedData: dataDetection.matches
  };
};

export const getAlertMessage = (validation) => {
  if (!validation.hasWarnings) {
    return {
      type: 'success',
      title: 'Ready to Submit',
      message: validation.message,
      icon: '✓',
      color: 'green',
      canProceed: true
    };
  }
  
  if (validation.hasHighSensitivity) {
    return {
      type: 'warning',
      title: '🔒 Protecting Your Privacy',
      message: validation.message,
      icon: '⚠️',
      color: 'yellow',
      canProceed: true,
      note: 'We\'ll automatically hide sensitive numbers before storing'
    };
  }
  
  return {
    type: 'info',
    title: 'ℹ️ Please Review',
    message: validation.message,
    icon: 'ℹ️',
    color: 'blue',
    canProceed: true,
    note: 'You can still submit - sensitive data will be protected'
  };
};

export const highlightSensitiveData = (text) => {
  let highlighted = text;
  
  highlighted = highlighted.replace(SENSITIVE_PATTERNS.AADHAR, '<mark class="sensitive-aadhar">$&</mark>');
  highlighted = highlighted.replace(SENSITIVE_PATTERNS.PHONE, '<mark class="sensitive-phone">$&</mark>');
  highlighted = highlighted.replace(SENSITIVE_PATTERNS.EMAIL, '<mark class="sensitive-email">$&</mark>');
  
  return highlighted;
};