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


document.addEventListener('DOMContentLoaded', function() {
  const imageUpload = document.getElementById('imageUpload');
  const imagePreview = document.getElementById('imagePreview');
  const imagePreviewContainer = document.getElementById('imagePreviewContainer');
  const removePreviewBtn = document.getElementById('removePreview');
  const currentImage = document.getElementById('currentImage');
  const deleteImageCheckbox = document.getElementById('deleteImage');

  // Handle file selection
  imageUpload.addEventListener('change', function(e) {
    if (this.files && this.files[0]) {
      const file = this.files[0];
      
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        alert('Please select a valid image file (JPEG, JPG, or PNG)');
        this.value = ''; // Clear the input
        return;
      }
      
      // Validate file size (e.g., 2MB max)
      if (file.size > 2 * 1024 * 1024) {
        alert('Image size should be less than 2MB');
        this.value = ''; // Clear the input
        return;
      }
      
      const reader = new FileReader();
      
      reader.onload = function(e) {
        imagePreview.src = e.target.result;
        imagePreviewContainer.style.display = 'block';
        
        // Hide current image if exists
        if (currentImage) {
          currentImage.style.display = 'none';
        }
        
        // Uncheck delete checkbox if checked
        if (deleteImageCheckbox) {
          deleteImageCheckbox.checked = false;
        }
      }
      
      reader.readAsDataURL(file);
    }
  });
  
  // Handle remove preview button
  removePreviewBtn.addEventListener('click', function() {
    imageUpload.value = ''; // Clear the file input
    imagePreviewContainer.style.display = 'none';
    
    // Show current image again if exists
    if (currentImage) {
      currentImage.style.display = 'block';
    }
  });
  
  // Handle delete image checkbox
  if (deleteImageCheckbox) {
    deleteImageCheckbox.addEventListener('change', function() {
      if (this.checked) {
        // Hide preview if showing
        imagePreviewContainer.style.display = 'none';
        imageUpload.value = '';
      }
    });
  }
});