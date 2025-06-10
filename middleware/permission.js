const { roles, permissions, role_permissions } = require("../models");

const checkPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      const user = req.user; 
      
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Get user roles
      const userRoles = await user.getRoles({
        include: [{
          model: permissions,
          through: { attributes: [] }
        }]
      });

    
      const hasPermission = userRoles.some(role => 
        role.permissions.some(permission => 
          permission.name === requiredPermission
        )
      );

      if (!hasPermission) {
        return res.status(403).json({ message: "Forbidden - Insufficient permissions" });
      }

      next();
    } catch (error) {
      console.error("Permission check error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
};

module.exports = checkPermission;