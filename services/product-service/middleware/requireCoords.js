/**
 * Middleware: Require GPS coordinates in request body.
 * Returns 400 if latitude or longitude are missing.
 * Optionally accepts a list of roles that are exempt from this check.
 */
const requireCoords = (...exemptRoles) => {
    return (req, res, next) => {
        // Allow exempt roles to bypass the check
        if (exemptRoles.length > 0 && req.user && exemptRoles.includes(req.user.role)) {
            return next();
        }

        const { latitude, longitude } = req.body;
        if (latitude == null || longitude == null) {
            return res.status(400).json({
                message: 'GPS coordinates (latitude, longitude) are required for this action.'
            });
        }
        next();
    };
};

module.exports = requireCoords;
