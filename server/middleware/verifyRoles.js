const verifyRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req?.role) return res.status(401).json({ message: 'Unauthorized' });
        const rolesArray = [...allowedRoles];
        // for only one role (CURRENT)
        result = rolesArray.includes(req.role)
        if (!result) return res.status(401).json({ message: 'Unauthorized' });
        next();
    }
}

module.exports = verifyRoles