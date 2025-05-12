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

  //To get total Class
  async function fetchTotalClass() {
    try {
      const res = await fetch("/classes/count");
      const data = await res.json();
      const totalClasses = document.getElementById("totalClass");
      if (totalClasses) totalClasses.innerText = data.totalClass;
    } catch (error) {
      console.error("Failed to fetch total classes:", err);
    }
  }
  fetchTotalClass();

  
  //Get total Teachers
  async function fetchTotalTeachers() {
    try {
      const res = await fetch("/teachers/count");
      const data = await res.json();
      const totalTeachersEl = document.getElementById("totalTeachers");
      if (totalTeachersEl) totalTeachersEl.innerText = data.totalTeachers;
    } catch (err) {
      console.error("Failed to fetch total teachers:", err);
    }
  }

  fetchTotalTeachers();
  //Get Total Student
  async function fetchTotalStudents() {
    try {
      const res = await fetch("/students/count");
      const data = await res.json();
      const totalStudentsEl = document.getElementById("totalStudents");
      if (totalStudentsEl) totalStudentsEl.innerText = data.totalStudents;
    } catch (err) {
      console.error("Failed to fetch total students:", err);
    }
  }

  fetchTotalStudents();



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
  async function loadSections(classId, preserveSelection = true) {
    if (!classId) return;

    try {
      const response = await fetch(`/students/get-sections/${classId}`);
      const sections = await response.json();

      // Store current selection if needed
      const currentSectionId = preserveSelection ? sectionSelect.value : null;

      // Clear existing options
      sectionSelect.innerHTML = '<option disabled selected hidden>--select section--</option>';

      // Add new options
      sections.forEach(section => {
        const option = document.createElement("option");
        option.value = section.id;
        option.textContent = section.section_name;
        sectionSelect.appendChild(option);
      });

      // Restore selection if needed
      if (preserveSelection && currentSectionId) {
        sectionSelect.value = currentSectionId;
      }

      // If editing, select the student's section (only if not preserving selection)
      const studentSectionId = "<%= student?.section_id %>";
      if (studentSectionId && !preserveSelection) {
        sectionSelect.value = studentSectionId;
      }
    } catch (err) {
      console.error("Failed to load sections:", err);
    }
  }



  if (classSelect) {
    // Load sections when class changes
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