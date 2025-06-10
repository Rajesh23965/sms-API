const db = require("../../models");
const Role = db.role;
const HomeLayout = db.home_layout
const HomeLayoutUrl = db.home_layout_url
const loadRoleUI = async (req, res) => {
    try {
        const role = await Role.findAll({
            include: [
                {
                    model: HomeLayout,
                    as: 'home_layout',
                    attributes: ['title']
                },
                {
                    model: HomeLayoutUrl,
                    as: 'home_layout_url',
                    attributes: ['urls']
                }
            ]
        });

        const home_layouts = await HomeLayout.findAll();
        const home_layout_urls = await HomeLayoutUrl.findAll();

        res.render("role/role", {
            role,
            home_layouts,
            home_layout_urls
        });
    } catch (error) {
        console.error("Internal server error:", error);
        res.redirect("/admin/admin-form");
    }
};


const createOrUpdateRole = async (req, res) => {
    try {
        const { id, name, home_layout_ids } = req.body;

        let role;
        if (id) {
            role = await Role.findByPk(id);
            if (!role) throw new Error("Role not found");
            await role.update({ name });
        } else {
            role = await Role.create({ name });
        }

 
        if (home_layout_ids && Array.isArray(home_layout_ids)) {
            const layoutIds = home_layout_ids.map(Number);

         
            await role.setLayouts([]); 

            // Create new mappings
            await role.addLayouts(layoutIds);
        }

        req.flash("success", "Role saved successfully");
        res.redirect("/admin/admin-form");
    } catch (error) {
        console.error("Failed to create/update role:", error);
        req.flash("error", error.message);
        res.redirect("/admin/admin-form");
    }
};



const deleteRole = async (req, res) => {
    try {
        const { id } = req.params;
        const role = await Role.findByPk(id);
        if (!role) {
            req.flash("error", "Role not found");
            return res.redirect("/admin/admin-form");
        }

        await role.destroy(); // soft delete (because paranoid is true)
        req.flash("success", "Role deleted successfully");
        res.redirect("/admin/admin-form");
    } catch (error) {
        console.error("Failed to delete role:", error);
        req.flash("error", error.message);
        res.redirect("/admin/admin-form");
    }
};



module.exports = {
    loadRoleUI,
    createOrUpdateRole,
    deleteRole
}