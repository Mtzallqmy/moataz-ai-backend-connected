export function ok(res, data, status = 200) {
  return res.status(status).json({
    success: true,
    data,
    timestamp: new Date().toISOString(),
  });
}

export function fail(res, status, code, message, details = undefined) {
  return res.status(status).json({
    error: { code, message, details },
    timestamp: new Date().toISOString(),
  });
}

export function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}
