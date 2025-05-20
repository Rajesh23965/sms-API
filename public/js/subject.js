// Function to toggle all classes and their sections
function toggleAllClasses(source) {
    const checkboxes = document.querySelectorAll('.class-checkbox');
    checkboxes.forEach(cb => {
        cb.checked = source.checked;  // Toggle the class checkbox
        toggleSections(cb);           // Also toggle the sections of the class
    });
}

// Function to toggle sections when class checkbox is clicked
function toggleSections(checkbox) {
    const classId = checkbox.dataset.classId;
    const sectionsContainer = document.getElementById(`sections_${classId}`);
    const sectionCheckboxes = sectionsContainer?.querySelectorAll('.section-checkbox');

    if (!sectionsContainer || !sectionCheckboxes) return;

    // Show or hide the sections based on class checkbox state
    if (checkbox.checked) {
        sectionsContainer.style.display = 'block';

        // If the class is checked, auto-check the sections if not in "edit" mode
        const hasCheckedSection = Array.from(sectionCheckboxes).some(cb => cb.checked);
        const isEditMode = document.getElementById('subjectForm').dataset.mode === 'edit';
        
        if (!isEditMode || !hasCheckedSection) {
            sectionCheckboxes.forEach(sc => sc.checked = true);  // Check all sections
        }
    } else {
        sectionsContainer.style.display = 'none';
        sectionCheckboxes.forEach(sc => sc.checked = false);  // Uncheck all sections
    }
}

// Initialize form on load
document.addEventListener('DOMContentLoaded', function() {
    const allClassCheckboxes = document.querySelectorAll('.class-checkbox');

    // First pass: Initialize all sections based on stored data in edit mode
    const classSectionMappings = JSON.parse('<%- classSectionMappings %>') || {};
    const isEditMode = document.getElementById('subjectForm').dataset.mode === 'edit';

    if (isEditMode) {
        Object.entries(classSectionMappings).forEach(([classId, sectionIds]) => {
            const classCheckbox = document.querySelector(`.class-checkbox[data-class-id="${classId}"]`);
            if (!classCheckbox) return;
            
            classCheckbox.checked = true;
            const sectionsContainer = document.getElementById(`sections_${classId}`);
            if (sectionsContainer) {
                sectionsContainer.style.display = 'block';
                
                const sectionCheckboxes = sectionsContainer.querySelectorAll('.section-checkbox');
                sectionCheckboxes.forEach(sc => {
                    const sectionId = parseInt(sc.value.split('_')[1]);
                    sc.checked = sectionIds.includes(sectionId);  // Check sections that are in mappings
                });
            }
        });
    }

    // Second pass: Handle remaining cases and set up event listeners
    allClassCheckboxes.forEach(classCheckbox => {
        const classId = classCheckbox.dataset.classId;
        const sectionsContainer = document.getElementById(`sections_${classId}`);

        if (!sectionsContainer) return;

        const sectionCheckboxes = sectionsContainer.querySelectorAll('.section-checkbox');
        const hasCheckedSection = Array.from(sectionCheckboxes).some(cb => cb.checked);

        // Initialize display based on current state
        if (classCheckbox.checked || hasCheckedSection) {
            sectionsContainer.style.display = 'block';

            // If sections are checked but class checkbox is not, check it
            if (hasCheckedSection && !classCheckbox.checked) {
                classCheckbox.checked = true;
            }

            // In add mode or if no sections checked, check all sections
            if (!isEditMode || !hasCheckedSection) {
                sectionCheckboxes.forEach(sc => sc.checked = true);
            }
        }

        // Add change event to toggle display dynamically
        classCheckbox.addEventListener('change', function() {
            toggleSections(classCheckbox);
        });
    });
});


    // Function to handle limit change
    function changeLimit(select) {
        const limit = select.value;
        const url = new URL(window.location.href);
        const searchQuery = url.searchParams.get('search') || '';
        
        url.searchParams.set('limit', limit);
        url.searchParams.set('page', 1);
        
        if (searchQuery) {
            url.searchParams.set('search', searchQuery);
        }
        
        window.location.href = url.toString();
    }
