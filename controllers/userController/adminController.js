const db = require("../../models");
const Admin = db.admins;
const School = db.schoolinfo
const bcrypt = require('bcryptjs');
const Role = db.role;
const HomeLayout = db.home_layout;
const HomeLayoutUrl = db.home_layout_url;
// Load admin form with enhanced error handling
const loadAdminForm = async (req, res) => {
    try {
        const errorFields = req.session.errorFields || [];
        const error = req.session.error || [];
        const oldInput = req.session.oldInput || {};
        const success = req.session.success || "";
        req.session.errorFields = null;
        req.session.oldInput = null;
        req.session.success = null;
        req.session.error = null;
        let admin = {
            id: 0,
            name: '',
            email: '',
            password: '',
            super_admin: false,
            status: 'active',
            school_id: null,
            role_id: null,
            layout_ids: []
        };

        const schools = await School.findAll();
        const home_layouts = await HomeLayout.findAll();
        const home_layout_urls = await HomeLayoutUrl.findAll();
        const roles = await Role.findAll({
            include: [
                {
                    model: HomeLayout,
                    as: 'layouts',
                    attributes: ['id', 'title'],
                    through: { attributes: [] },

                }
            ]
        });


        if (req.params.id) {
            admin = await Admin.findByPk(req.params.id);
            if (!admin) {
                req.flash('error', 'Admin not found');
                return res.redirect('/admin/admin-list');
            }

            // Fetch layouts of this admin's role
            if (admin.role_id) {
                const role = await Role.findByPk(admin.role_id, {
                    include: [{ model: HomeLayout, as: 'layouts', through: { attributes: [] } }]
                });
                admin.layout_ids = role.layouts.map(layout => layout.id);
            }
        }

        res.render("admin/adminform", {
            admin,
            home_layouts,
            home_layout_urls,
            roles,
            schools,
            editMode: !!req.params.id,
            messages: req.flash(),
            errorFields,
            oldInput,
            success,
            error,

        });
    } catch (error) {
        console.error(error);
        req.flash('error', 'Failed to load admin form');
        res.redirect('/admin/admin-list');
    }
};



const saveAdmin = async (req, res) => {
    try {
        const {
            id, name, email, password, super_admin,
            status, school_id, role_id, layout_ids
        } = req.body;
        const errorFields = [];
        const errorMessages = [];

        if (!name) {
            errorFields.push('name');
            errorMessages.push('Name is required');
        }

        if (!email) {
            errorFields.push('email');
            errorMessages.push('Email is required');
        }

        if (!id && !password) {
            errorFields.push('password');
            errorMessages.push('Password is required for new admin');
        }

        if (errorMessages.length > 0) {
            // Store errors and old input in session
            req.session.error = errorMessages;
            req.session.errorFields = errorFields;
            req.session.oldInput = req.body;

            return res.redirect('back');
        }

        const adminData = {
            name,
            email,
            super_admin: super_admin === 'on',
            status,
            school_id: school_id || null,
            role_id: role_id || null
        };

        if (id && id !== '0') {
            const admin = await Admin.findByPk(id);
            if (!admin) {
                req.session.error = ['Admin not found'];
                return res.redirect('/admin/admin-list');
            }

            if (password) adminData.password = password;
            await admin.update(adminData);

            req.session.success = 'Admin updated successfully';
        } else {
            adminData.password = password;
            await Admin.create(adminData);
            req.session.success = 'Admin created successfully';
        }

        // // Update layouts for role
        // if (role_id && layout_ids) {
        //     const role = await Role.findByPk(role_id);
        //     const layoutIdArray = Array.isArray(layout_ids)
        //         ? layout_ids.map(id => parseInt(id))
        //         : [parseInt(layout_ids)];

        //     await role.setLayouts(layoutIdArray);
        // }

        res.redirect('/admin/admin-list');
    } catch (error) {
        console.error(error);
        req.session.error = ['Error saving admin data'];
        res.redirect('back');
    }
};

// List admins with pagination
const listAdmins = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;

        const { count, rows: admins } = await Admin.findAndCountAll({
            where: { deletedAt: null },
            order: [['createdAt', 'DESC']],
            limit,
            offset,
            include: [
                {
                    model: Role,
                    as: 'role',
                    attributes: ['id', 'name'],

                }
            ]
        });

        const totalPages = Math.ceil(count / limit);

        res.render("admin/adminList", {
            admins,
            currentPage: page,
            totalPages,
            messages: req.flash(),
            title: "Uer Management",
            header: "User Setup",
            headerIcon: "fas fa-user-graduate",
            buttons: [
                { text: "User List", href: "/admin/admin-list", color: "red", icon: "fas fa-users" },

            ]
        });
    } catch (error) {
        console.error(error);
        req.flash('error', 'Failed to load admin list');
        res.render("admin/admin-list", { admins: [] });
    }
};

// Delete admin with confirmation
const deleteAdmin = async (req, res) => {
    try {
        const admin = await Admin.findByPk(req.params.id);
        if (!admin) {
            req.flash('error', 'Admin not found');
            return res.redirect('/admin/adminList');
        }

        await admin.destroy();
        req.flash('success', 'Admin deleted successfully');
        res.redirect('/admin/admin-list');
    } catch (error) {
        console.error(error);
        req.flash('error', 'Failed to delete admin');
        res.redirect('/admin/admin-list');
    }
};

module.exports = {
    loadAdminForm,
    saveAdmin,
    listAdmins,
    deleteAdmin
};