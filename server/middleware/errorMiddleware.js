const errorHandler = (err, req, res, next) => {
  console.error('API Error:', err);

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(
      (error) => error.message
    );

    return res.status(400).json({
      success: false,
      message: 'Validation failed.',
      errors,
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid resource ID.',
    });
  }

  if (err.code === 11000) {
    const duplicateFields = Object.keys(
      err.keyPattern || {}
    );

    return res.status(409).json({
      success: false,
      message: 'A record with this value already exists.',
      fields: duplicateFields,
    });
  }

  return res.status(
    err.statusCode || 500
  ).json({
    success: false,
    message:
      err.statusCode
        ? err.message
        : 'An unexpected server error occurred.',
  });
};

module.exports = {
  errorHandler,
};