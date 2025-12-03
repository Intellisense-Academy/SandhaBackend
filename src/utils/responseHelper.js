// Helper functions for sending responses
function successResponse(res, message, data = null, statusCode = 200) {
  const response = {
    success: true,
    message
  };
  
  if (data) response.data = data;
  
  return res.status(statusCode).json(response);
}

function errorResponse(res, message, errors = [], statusCode = 400) {
  return res.status(statusCode).json({
    success: false,
    message,
    errors: Array.isArray(errors) ? errors : [errors]
  });
}

function serverErrorResponse(res, error) {
  console.error('Server Error:', error);
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
}

module.exports = {
  successResponse,
  errorResponse,
  serverErrorResponse
};