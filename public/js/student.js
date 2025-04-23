document.addEventListener("DOMContentLoaded", function () {
  const loadingSpinner = document.getElementById("loading");

  const links = document.querySelectorAll("a");
  links.forEach((link) => {
    link.addEventListener("click", function () {
      loadingSpinner.style.display = "flex";
    });
  });

  window.addEventListener("pageshow", function (event) {
    // Hide spinner when navigating back/forward
    loadingSpinner.style.display = "none";
  });

  const stats = {
    students: 950,
    teachers: 45,
    classes: 28,
    attendance: "92%",
  };

  const studentsEl = document.getElementById("students");
  const teachersEl = document.getElementById("teachers");
  const classesEl = document.getElementById("classes");
  const attendanceEl = document.getElementById("attendance");
  const toggleBtn = document.getElementById("toggleBtn");
  const sidebar = document.getElementById("sidebar");

  if (studentsEl) studentsEl.innerText = stats.students;
  if (teachersEl) teachersEl.innerText = stats.teachers;
  if (classesEl) classesEl.innerText = stats.classes;
  if (attendanceEl) attendanceEl.innerText = stats.attendance;

  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener("click", () => {
      sidebar.classList.toggle("collapsed");
    });
  }
  document.getElementById('class-select').addEventListener('change', async function () {
    const classId = this.value;
    const sectionSelect = document.getElementById('section-select');
    
    // Clear previous options
    sectionSelect.innerHTML = '<option value="">-- Select Section --</option>';

    if (!classId) return;

    try {
      const response = await fetch(`/get-sections/${classId}`);
      const data = await response.json();

      if (data.success) {
        data.sections.forEach(section => {
          const option = document.createElement('option');
          option.value = section.id;
          option.textContent = section.section_name;
          sectionSelect.appendChild(option);
        });
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
    }
  });

});
