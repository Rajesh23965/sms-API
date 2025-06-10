// middleware/layoutMiddleware.js
const db = require("../models");
const HomeLayout = db.home_layout;
const HomeLayoutUrl = db.home_layout_url;
const Role = db.role;


const layoutMiddleware = async (req, res, next) => {
  try {
    const roleId = req.user?.role_id;
    if (!roleId) {
      res.locals.layout = [];
      return next();
    }

   
    const layouts = await HomeLayout.findAll({
      where: { status: 'active' },
      include: [
        {
          model: Role,
          as: 'roles',
          where: { id: roleId },
          attributes: [],
          through: { attributes: [] },
          required: true 
        },
        {
          model: HomeLayout,
          as: 'children',
          include: [
            {
              model: HomeLayoutUrl,
              as: 'urls',
            },
            {
              model: Role,
              as: 'roles',
              where: { id: roleId },
              attributes: [],
              through: { attributes: [] },
              required: true
            }
          ],
        },
        {
          model: HomeLayoutUrl,
          as: 'urls',
        },
      ],
      order: [['order', 'ASC']],
    });

    // Alternative approach if you want to use the direct access_to field
    /*
    const layouts = await HomeLayout.findAll({
      where: { 
        status: 'active',
        [db.Sequelize.Op.or]: [
          { access_to: roleId },
          { '$roles.id$': roleId } // If you want to check both access_to and many-to-many
        ]
      },
      include: [
        {
          model: HomeLayout,
          as: 'children',
          where: { 
            status: 'active',
            [db.Sequelize.Op.or]: [
              { access_to: roleId },
              { '$roles.id$': roleId }
            ]
          },
          include: [
            {
              model: HomeLayoutUrl,
              as: 'urls',
            },
          ],
          required: false
        },
        {
          model: HomeLayoutUrl,
          as: 'urls',
        },
        {
          model: Role,
          as: 'roles',
          where: { id: roleId },
          attributes: [],
          through: { attributes: [] },
          required: false
        }
      ],
      order: [['order', 'ASC']],
    });
    */

    res.locals.layout = layouts;
    res.locals.currentPath = req.path;
    next();
  } catch (error) {
    console.error('Failed to load layout:', error);
    next(error);
  }
};

module.exports = layoutMiddleware;

