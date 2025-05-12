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
    sectionCheckboxes.forEach(sc => sc.checked = true);
  } else {
    sectionsContainer.style.display = 'none';
    sectionCheckboxes.forEach(sc => sc.checked = false);
  }
}

document.addEventListener('DOMContentLoaded', function () {
  const classCheckboxes = document.querySelectorAll('.class-checkbox');
  classCheckboxes.forEach(cb => {
    toggleSections(cb);
  });
});

function changeLimit(select) {
  const limit = select.value;
  const url = new URL(window.location.href);
  const searchQuery = url.searchParams.get('search') || '';
  
  url.searchParams.set('limit', limit);
  url.searchParams.set('page', 1);
  
  // Preserve search query if it exists
  if (searchQuery) {
    url.searchParams.set('search', searchQuery);
  }
  
  window.location.href = url.toString();
}