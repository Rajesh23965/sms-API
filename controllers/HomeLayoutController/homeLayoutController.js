const db = require("../../models");
const HomeLayout = db.home_layout;
const HomeLayoutUrl = db.home_layout_url;
const Role = db.role;

const loadAddHomeLayout = async (req, res) => {
    try {
        // Fetch existing layouts and roles to populate dropdowns
        const layouts = await HomeLayout.findAll({
            where: {
                status: 'active',
            },
            order: [['order', 'ASC']],
            include: [
                {
                    model: HomeLayoutUrl,
                    as: 'urls'
                },
                { model: Role, as: 'roles', attributes: ['id', 'name'] },
                {
                    model: HomeLayout,
                    as: 'parent',
                    attributes: ['title']
                }
            ]
        });
     
        const roles = await Role.findAll();

        res.render("homeLayout/homelayout", {
            layouts,
            roles,
            currentLayout: null
        });
    } catch (error) {
        console.error("Failed to load home layout page", error);
        req.flash("error", "Failed to load home layout page");
        res.redirect("/home-layout/form");
    }
}

const loadEditHomeLayout = async (req, res) => {
    try {
        const layoutId = req.params.id;

        const [layouts, roles, currentLayout] = await Promise.all([
            HomeLayout.findAll({
                where: { status: 'active' },
                order: [['order', 'ASC']]
            }),
            Role.findAll(),
            HomeLayout.findByPk(layoutId, {
                include: [{
                    model: HomeLayoutUrl,
                    as: 'urls'
                }]
            })
        ]);

        if (!currentLayout) {
            req.flash("error", "Layout not found");
            return res.redirect("/home-layout/form");
        }

        res.render("homeLayout/homelayout", {
            layouts,
            roles,
            currentLayout
        });
    } catch (error) {
        console.error("Failed to load edit layout", error);
        req.flash("error", "Failed to load layout for editing");
        res.redirect("/home-layout/form");
    }
}

const createAndUpdateHomeLayout = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id, title, icon, access_to, parent_id, status, order, urls } = req.body;

        let layout;
        if (id) {
            // Update existing layout
            layout = await HomeLayout.findByPk(id, { transaction });
            if (!layout) {
                throw new Error("Layout not found");
            }

            layout.title = title;
            layout.icon = icon;
            layout.access_to = access_to;
            layout.parent_id = parent_id || null;
            layout.status = status;
            layout.order = order;

            await layout.save({ transaction });

            // Update URLs - first delete existing ones
            await HomeLayoutUrl.destroy({
                where: { layout_id: id },
                transaction
            });
        } else {
            // Create new layout
            layout = await HomeLayout.create({
                title,
                icon,
                access_to,
                parent_id: parent_id || null,
                status,
                order
            }, { transaction });
        }

        // Add URLs if provided
        if (urls && urls.length > 0) {
            const urlRecords = urls.map(url => ({
                layout_id: layout.id,
                url: url
            }));
            await HomeLayoutUrl.bulkCreate(urlRecords, { transaction });
        }

        await transaction.commit();
        req.flash("success", `Layout ${id ? 'updated' : 'created'} successfully`);
        res.redirect("/home-layout/form");
    } catch (error) {
        await transaction.rollback();
        console.log("Failed to create/update layout", error);
        req.flash("error", error.message);
        res.redirect("/home-layout/add");
    }
}

const deleteHomeLayout = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id } = req.params;

        // First delete URLs
        await HomeLayoutUrl.destroy({
            where: { layout_id: id },
            transaction
        });

        // Then delete the layout
        await HomeLayout.destroy({
            where: { id },
            transaction
        });

        await transaction.commit();
        req.flash("success", "Layout deleted successfully");
        res.redirect("/home-layout/form");
    } catch (error) {
        await transaction.rollback();
        console.log("Failed to delete layout", error);
        req.flash("error", "Failed to delete layout");
        res.redirect("/home-layout/form");
    }
}

const getHomeLayouts = async (req, res) => {
    try {
        const layouts = await HomeLayout.findAll({
            where: {
                status: 'active',
            },
            order: [['order', 'ASC']],
            include: [
                {
                    model: HomeLayoutUrl,
                    as: 'urls'
                },
                {
                    model: Role,
                    as: 'role',
                    attributes: ['name']
                },
                {
                    model: HomeLayout,
                    as: 'parent',
                    attributes: ['title']
                }
            ]
        });

        res.json({
            success: true,
            data: layouts
        });
    } catch (error) {
        console.error("Failed to fetch layouts", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch layouts"
        });
    }
}

module.exports = {
    loadAddHomeLayout,
    loadEditHomeLayout,
    createAndUpdateHomeLayout,
    deleteHomeLayout,
    getHomeLayouts
};