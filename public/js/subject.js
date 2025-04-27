function toggleAllClasses(source) {
  const checkboxes = document.querySelectorAll('.class-checkbox');
  checkboxes.forEach(cb => {
    cb.checked = source.checked;
    toggleSections(cb);
  });
}

function toggleSections(checkbox) {
  const classId = checkbox.dataset.classId;
  const sectionsContainer = document.getElementById(`sections_${classId}`);
  const sectionCheckboxes = sectionsContainer.querySelectorAll('.section-checkbox');

  if (checkbox.checked) {
    sectionsContainer.style.display = 'block';
    // Check all sections when class is checked
    sectionCheckboxes.forEach(sc => sc.checked = true);
  } else {
    sectionsContainer.style.display = 'none';
    // Uncheck all sections when class is unchecked
    sectionCheckboxes.forEach(sc => sc.checked = false);
  }
}

// Initialize sections visibility on page load
document.addEventListener('DOMContentLoaded', function() {
  const classCheckboxes = document.querySelectorAll('.class-checkbox');
  classCheckboxes.forEach(cb => {
    toggleSections(cb);
  });
});
