/**
 * Authorization Middleware
 * Checks if the authenticated user has one of the allowed roles.
 * Must be used AFTER the auth middleware.
 *
 * Usage: router.post('/route', auth, authorize('Manufacturer', 'Distributor'), handler)
 */
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: `Access denied. Required role: ${allowedRoles.join(' or ')}`
            });
        }

        next();
    };
};

module.exports = authorize;
