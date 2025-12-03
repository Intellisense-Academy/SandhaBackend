const { validatePassword } = require('../utils/passwordHelper');

// Validate user registration data
function validateRegistration(req, res, next) {
  const { name, contactNumber, email, password, confirmPassword } = req.body;
  
  const errors = [];
  
  // Name validation
  if (!name || name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }
  
  // Contact number validation
  if (!contactNumber || contactNumber.trim().length < 10) {
    errors.push('Valid contact number is required (10 digits minimum)');
  }
  
  // Email validation - simple regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    errors.push('Valid email is required');
  }
  
  // Password validation
  const passwordResult = validatePassword(password, confirmPassword);
  if (passwordResult.errors.length > 0) {
    errors.push(...passwordResult.errors);
  }
  
  // If there are errors, return them
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }
  
  // If validation passes, continue to next middleware
  next();
}

// Validate email format for login
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

module.exports = {
  validateRegistration,
  validateEmail
};