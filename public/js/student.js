document.addEventListener("DOMContentLoaded", function () {
  const loadingSpinner = document.getElementById("loading");
  const classSelect = document.querySelector('select[name="class_id"]');
  const sectionSelect = document.querySelector('select[name="section_id"]');
  const oldSectionId = "<%= oldInput?.section_id || student?.section_id || '' %>";

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
  async function loadSections(classId) {
    if (!classId) return;

    try {
      const response = await fetch(`/students/get-sections/${classId}`);
      const sections = await response.json();

      sectionSelect.innerHTML = '<option disabled selected hidden>--select section--</option>';

      sections.forEach(section => {
        const option = document.createElement("option");
        option.value = section.id;
        option.textContent = section.section_name;
        if (section.id == oldSectionId) option.selected = true;
        sectionSelect.appendChild(option);
      });
    } catch (err) {
      console.error("Failed to load sections:", err);
    }
  }


  if (classSelect) {
    classSelect.addEventListener("change", () => {
      const selectedClassId = classSelect.value;
      loadSections(selectedClassId);
    });

    // Initial load if class already selected
    if (classSelect.value) {
      loadSections(classSelect.value);
    }
  }

});


const limitSelect = document.getElementById('limitSelect');
if (limitSelect) {
  limitSelect.addEventListener('change', function () {
    const limit = this.value;
    const url = new URL(window.location.href);
    url.searchParams.set('limit', limit);
    url.searchParams.set('page', 1);
    window.location.href = url.toString();
  });
}

function changeLimit(select) {
  const limit = select.value;
  const url = new URL(window.location.href);
  url.searchParams.set('limit', limit);
  url.searchParams.set('page', 1);
  window.location.href = url.toString();
}