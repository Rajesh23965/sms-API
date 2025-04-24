document.addEventListener('DOMContentLoaded', function() {
  const classCheckboxes = document.querySelectorAll('.class-checkbox');
  const sectionContainer = document.getElementById('sectionContainer');
//   const form = document.getElementById('teacherForm');

  classCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', function() {
      updateSections();
    });
  });

  async function updateSections() {
    const selectedClasses = Array.from(document.querySelectorAll('.class-checkbox:checked'))
      .map(checkbox => checkbox.value);

    if (selectedClasses.length === 0) {
      sectionContainer.innerHTML = '<p class="text-muted">Please select classes to see available sections</p>';
      return;
    }

    try {
      const response = await fetch('/teachers/get-sections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ classIds: selectedClasses })
      });

      const sections = await response.json();

      if (sections.length > 0) {
        let html = '';
        sections.forEach(section => {
          html += `
            <div class="form-check">
              <label class="form-check-label cursor-pointer">
                <input 
                  type="checkbox" 
                  class="form-check-input" 
                  name="section_id[]" 
                  value="${section.id}" 
                />
                ${section.section_name}
              </label>
            </div>
            <hr class="p-2 m-0" />
          `;
        });
        sectionContainer.innerHTML = html;
      } else {
        sectionContainer.innerHTML = '<p class="text-muted">No sections available for selected classes</p>';
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
      sectionContainer.innerHTML = '<p class="text-danger">Error loading sections</p>';
    }
  }
});
