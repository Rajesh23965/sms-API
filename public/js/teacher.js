document.addEventListener('DOMContentLoaded', function () {
  const classCheckboxes = document.querySelectorAll('.class-checkbox');
  const sectionContainer = document.getElementById('sectionContainer');
  const subjectContainer = document.getElementById('subjectContainer');
  const isEditMode = window.location.search.includes('teacherId');
  
  // Get pre-selected values from hidden inputs or data attributes
  const oldClassIds = JSON.parse(document.getElementById('oldClassIds')?.value || '[]');
  const oldSectionIds = JSON.parse(document.getElementById('oldSectionIds')?.value || '[]');
  const oldSubjectIds = JSON.parse(document.getElementById('oldSubjectIds')?.value || '[]');

  const classColors = [
    'bg-primary',
    'bg-success',
    'bg-danger',
    'bg-warning',
    'bg-info',
    'bg-secondary'
  ];

  // Check classes on initial load if in edit mode
  if (isEditMode && oldClassIds.length) {
    classCheckboxes.forEach(checkbox => {
      if (oldClassIds.includes(checkbox.value)) {
        checkbox.checked = true;
      }
    });
  }

  async function updateSectionsAndSubjects() {
    const selectedClasses = Array.from(classCheckboxes)
      .filter(cb => cb.checked)
      .map(cb => ({
        id: cb.value,
        name: cb.closest('label').innerText.trim()
      }));

    if (!selectedClasses.length) {
      sectionContainer.innerHTML = '<p class="text-muted">Please select classes to see available sections</p>';
      subjectContainer.innerHTML = '<p class="text-muted">Please select sections to see available subjects</p>';
      return;
    }

    try {
      const response = await fetch('/teachers/get-sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classIds: selectedClasses.map(cls => cls.id) }),
      });

      const sections = await response.json();

      if (sections.length > 0) {
        let html = `
          <div class="form-check mb-2">
            <label class="form-check-label cursor-pointer fw-bold text-primary">
              <input type="checkbox" id="selectAllSections" class="form-check-input">
              Select All Sections
            </label>
          </div>
          <hr class="p-2 m-0" />
        `;

        let colorIndex = 0;
        let currentClassId = null;

        sections.forEach((section, index) => {
          const bgColorClass = classColors[colorIndex % classColors.length];

          if (currentClassId !== section.class_id) {
            const classObj = selectedClasses.find(cls => cls.id == section.class_id);
            const className = classObj ? classObj.name : 'Unknown Class';

            html += `<h6 class="p-2 text-white ${bgColorClass}">${className}</h6>`;
            currentClassId = section.class_id;
          }

          const isChecked = oldSectionIds.includes(section.id.toString());
          
          html += `
            <div class="form-check p-2 rounded mb-2">
              <label class="form-check-label cursor-pointer">
                <input type="checkbox" 
                       class="form-check-input section-checkbox" 
                       name="section_id[]" 
                       value="${section.id}"
                       ${isChecked ? 'checked' : ''}>
                ${section.section_name}
              </label>
            </div>
          `;
          colorIndex++;
        });

        sectionContainer.innerHTML = html;

        // Attach event listeners
        const sectionCheckboxes = document.querySelectorAll('.section-checkbox');
        sectionCheckboxes.forEach(cb => cb.addEventListener('change', fetchSubjects));

        const selectAll = document.getElementById('selectAllSections');
        selectAll.addEventListener('change', function () {
          sectionCheckboxes.forEach(cb => {
            cb.checked = this.checked;
          });
          fetchSubjects();
        });

        // If in edit mode, trigger subjects fetch for pre-selected sections
        if (isEditMode && oldSectionIds.length > 0) {
          fetchSubjects();
        }

      } else {
        sectionContainer.innerHTML = '<p class="text-muted">No sections available for selected classes</p>';
      }

    } catch (error) {
      console.error('Error fetching sections:', error);
      sectionContainer.innerHTML = '<p class="text-danger">Error loading sections</p>';
    }
  }

  async function fetchSubjects() {
    const selectedClassIds = Array.from(classCheckboxes)
      .filter(cb => cb.checked)
      .map(cb => cb.value);

    const selectedSectionIds = Array.from(document.querySelectorAll('.section-checkbox:checked'))
      .map(cb => cb.value);

    if (!selectedClassIds.length || !selectedSectionIds.length) {
      subjectContainer.innerHTML = '<p class="text-muted">Select classes and sections to view subjects.</p>';
      return;
    }

    try {
      const response = await fetch('/teachers/get-subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          classIds: selectedClassIds, 
          sectionIds: selectedSectionIds 
        }),
      });

      const subjects = await response.json();

      if (subjects.length > 0) {
        subjectContainer.innerHTML = subjects.map(subject => `
          <div class="form-check">
            <label class="form-check-label cursor-pointer">
              <input type="checkbox" 
                     class="form-check-input" 
                     name="subject_id[]" 
                     value="${subject.id}"
                     ${oldSubjectIds.includes(subject.id.toString()) ? 'checked' : ''}>
              ${subject.name}
            </label>
          </div>
          <hr class="p-2 m-0" />
        `).join('');
      } else {
        subjectContainer.innerHTML = '<p class="text-muted">No subjects found for selected sections</p>';
      }

    } catch (error) {
      console.error('Error fetching subjects:', error);
      subjectContainer.innerHTML = '<p class="text-danger">Error loading subjects</p>';
    }
  }

  // Class checkbox change triggers update
  classCheckboxes.forEach(cb => cb.addEventListener('change', updateSectionsAndSubjects));

  // Initial load
  updateSectionsAndSubjects();
});