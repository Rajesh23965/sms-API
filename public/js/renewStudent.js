document.addEventListener('DOMContentLoaded', function () {
  $('.select2').select2({ placeholder: 'Select students', width: '100%' });

  const classDropdown = document.getElementById('classList');
  const sectionDropdown = document.getElementById('sectionList');
  const studentListContainer = document.getElementById('studentRecords');
  const studentList = document.getElementById('studentList');

  classDropdown.addEventListener('change', async () => {
    const classId = classDropdown.value;
    sectionDropdown.innerHTML = '<option>Loading...</option>';
    studentListContainer.style.display = 'none';

    if (!classId) return;

    const res = await fetch(`/promotion/sections/${classId}`);
    const sections = await res.json();

    sectionDropdown.innerHTML = '<option value="">-- Select Section --</option>';
    sections.forEach(sec => {
      sectionDropdown.innerHTML += `<option value="${sec.id}">${sec.section_name}</option>`;
    });

    sectionDropdown.disabled = false;
  });

  sectionDropdown.addEventListener('change', async () => {
    const classId = classDropdown.value;
    const sectionId = sectionDropdown.value;

    if (!classId || !sectionId) return;

    const res = await fetch(`/api/students?class_id=${classId}&section_id=${sectionId}`);
    const students = await res.json();

    studentList.innerHTML = '';
    if (students.length === 0) {
      studentList.innerHTML = '<li class="list-group-item">No students found.</li>';
    } else {
      students.forEach(s => {
        studentList.innerHTML += `<li class="list-group-item">${s.first_name} ${s.last_name} (${s.admission_no})</li>`;
      });
    }

    studentListContainer.style.display = 'block';
  });
});
