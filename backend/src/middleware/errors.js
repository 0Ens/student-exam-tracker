class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function notFound(req, res) {
  res.status(404).json({ error: 'Not found' });
}

function errorHandler(err, req, res, _next) {
  const status = err.status || 500;
  if (status === 500) {
    console.error(err);
  }
  res.status(status).json({
    error: status === 500 ? 'Internal server error' : err.message,
    ...(err.details && { details: err.details }),
  });
}

module.exports = { HttpError, notFound, errorHandler };
