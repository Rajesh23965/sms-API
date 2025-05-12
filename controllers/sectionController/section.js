const db = require("../../models");
const ClassList = db.classes;
const Section = db.sections;

const loadsectionform = async (req, res) => {
  const error = req.flash("error")[0] || "";
  const success = req.flash("success")[0] || "";
  const oldInput = req.flash("oldInput")[0] || {};
  const errorFields = req.flash("errorFields")[0] || [];

  const classIdforSection = req.query.classID;

  let sectionsById = null;

  try {
    if (classIdforSection) {
      sectionsById = await Section.findAll({
        where: { class_id: classIdforSection },
        include: [
          {
            model: ClassList,
            as: "class",
            attributes: ['class_name'],
          },
        ],
      });
    }

    const listclass = await ClassList.findAll();
    const classWithSections = await ClassList.findAll({
      include: [
        {
          model: Section,
          as: "sections",
          required: false,
        },
      ],
    });

    res.render("sections/sectionform", {
      classWithSections,
      error,
      success,
      oldInput,
      errorFields,
      listclass,
      sectionsById,
    });
  } catch (error) {
    console.error("Error fetching classes with sections:", error);
    req.flash("error", "Failed to fetch class data.");
    res.redirect("/sections/section-form");
  }
};

const addorupdateSection = async (req, res) => {
  const sectionData = req.body;
  const classId = sectionData.class_id;
  let sectionNames = sectionData.section_name;
  let newClassId = req.query.classId;

  // res.send(newClassId);

  const redirectURL = `/sections/section-form`;


  // Normalize sectionNames to always be an array
  if (!Array.isArray(sectionNames)) {
    sectionNames = [sectionNames];
  }

  const missingFields = [];

  if (!classId || classId.trim() === "") {
    missingFields.push("class_id");
  }

  sectionNames.forEach((name, index) => {
    if (!name || name.trim() === "") {
      missingFields.push(`section_name_${index}`);
    } else {
      const isValid = /^[a-zA-Z0-9\s]+$/.test(name.trim());
      if (!isValid) {
        missingFields.push(`invalid_section_name${index}`);
      }
    }
  });

  if (missingFields.length) {
    req.flash("errorFields", missingFields);
    req.flash("oldInput", sectionData);
    const hasInvalid = missingFields.some(field => field.startsWith("invalid_section_name"));
    const errorMessage = hasInvalid
      ? "Section names must not contain special characters."
      : "All fields are required.";
    req.flash("error", errorMessage);
    return res.redirect(redirectURL);
  }


  try {
    const cleanedNames = sectionNames.map((name) => name.trim());
    console.log("Cleaned Section Names:", cleanedNames); // Check if names are cleaned properly

    // Handle update mode (if newClassId is present)
    if (newClassId) {
      console.log("Updating sections for classId:", newClassId);

      const existingSections = await Section.findAll({
        where: { class_id: newClassId },
      });


      const existingNames = existingSections.map((s) => s.section_name);
      console.log("Existing Section Names:", existingNames); // Check if existing sections are fetched

      // Sections to delete
      const toDelete = existingSections.filter(
        (s) => !cleanedNames.includes(s.section_name)
      );
      console.log("Sections to delete:", toDelete);

      // Delete sections that are not in the new list
      for (const sec of toDelete) {
        console.log("Deleting section:", sec.section_name);
        await sec.destroy();
      }

      // Add new sections if not already present
      for (const name of cleanedNames) {
        if (!existingNames.includes(name)) {
          console.log("Adding new section:", name);
          await Section.create({
            class_id: newClassId,
            section_name: name,
          });
        }
      }

      req.flash("success", "Sections updated successfully.");
      return res.redirect(redirectURL);
    } else {
      // Insert Mode: Check for duplicates only during insertion
      console.log("Inserting new sections for classId:", classId);

      const duplicates = await Section.findAll({
        where: {
          class_id: classId,
          section_name: cleanedNames,
        },
      });

      if (!newClassId && duplicates.length > 0) {
        console.log("Found duplicate sections:", duplicates);
        req.flash(
          "error",
          "One or more sections already exist for the selected class."
        );
        req.flash("oldInput", sectionData);
        return res.redirect(redirectURL);
      }

      // Proceed with insert
      const sectionsToCreate = cleanedNames.map((name) => ({
        class_id: classId,
        section_name: name,
      }));

      await Section.bulkCreate(sectionsToCreate);

      req.flash("success", "Sections added successfully.");
      return res.redirect(redirectURL);
    }
  } catch (error) {
    console.error("Error while saving sections:", error);
    req.flash("error", "Something went wrong while saving.");
    req.flash("oldInput", sectionData);
    return res.redirect(redirectURL);
  }
};

const deleteSection = async (req, res) => {
  try {
    const id = req.params.id;
    const section = await Section.findByPk(id);
    if (!section) {
      req.flash("error", "Section not found");
      return res.redirect("/sections/section-form");
    }

    await section.destroy();
    req.flash("success", "Section deleted successfully.");
    return res.redirect("/sections/section-form");
  } catch (error) {
    console.log("Failed to delete section: ", error);
    req.flash("error", "Internal server error.");
    return res.redirect("/sections/section-form");
  }
};


module.exports = {
  loadsectionform,
  addorupdateSection,
  deleteSection
};
