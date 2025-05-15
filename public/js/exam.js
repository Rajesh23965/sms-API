$(document).ready(function () {

  $(document).on("input", ".marks-input", function () {
    const value = $(this).val();
    const fullmarks = $(this).next('span').text().match(/\d+/)[0];

    // Validate numeric input
    if (value && !/^\d*\.?\d*$/.test(value)) {
      $(this).addClass('is-invalid');
      return;
    } else {
      $(this).removeClass('is-invalid');
    }

    // Validate against full marks
    if (value && parseFloat(value) > parseFloat(fullmarks)) {
      $(this).addClass('is-invalid');
      $(this).next('span').addClass('text-danger');
    } else {
      $(this).removeClass('is-invalid');
      $(this).next('span').removeClass('text-danger');
    }
  });

  $(document).on("keyup", "#admissionno", function () {
    const admissionNumber = $(this).val();
    const examTypeId = $("input[name='examType']:checked").val();
    const academicYear = $("#academicYearSelect").val();

    // Reset all fields
    $(".admissionNumber").val("");
    $(".studentName").html("");
    $(".studentClass").html("");
    $(".StudentSection").html("");
    $(".studentMakrsBox").html("");

    if (admissionNumber.length > 4 && examTypeId) {
      $.ajax({
        method: "GET",
        url: "api/search",
        data: {
          q: admissionNumber,
          examTypeId: examTypeId,
          academicYear: academicYear // Send the selected academic year
        },
        success: function (response) {
          if (response && response.student) {
            // Display student data
            $(".admissionNumber").val(response.student.admission_no);
            $(".studentName").html(
              (response.student.first_name || "") +
              " " +
              (response.student.middle_name || "") +
              " " +
              (response.student.last_name || "")
            );
            $(".studentClass").html(response.class.class_name || "-");
            $(".StudentSection").html(response.section.section_name || "-");

            // Create dynamic marks input boxes for each subject
            let studentMakrsBox = "";
        if (response.subjects && response.subjects.length > 0) {
  const marksData = response.marks || {}; // marks object from response

response.subjects.forEach(function (subject) {
  const existingTheoryMarks = subject.marks?.marks_obtained ?? "";
  const existingPracticalMarks = subject.marks?.practical_marks ?? "";

  studentMakrsBox += `
    <div class="mb-2 p-2 border bg-light">
      <label class="d-block fw-bold mb-1">${subject.name} (${subject.code}):</label>
      
      <div class="d-flex align-items-center gap-2 mb-2">
        <span>Theory:</span>
        <input type="number" 
               name="${subject.code}_theory" 
               class="marks-input form-control" 
               style="width: 80px"
               min="0" 
               max="${subject.fullmarks}"
               value="${existingTheoryMarks}">
        <span class="text-muted">/ ${subject.fullmarks}</span>
        ${existingTheoryMarks ? '<i class="fas fa-check text-success"></i>' : ''}
      </div>

      <div class="d-flex align-items-center gap-2">
        <span>Practical:</span>
        <input type="number" 
               name="${subject.code}_practical" 
               class="marks-input form-control" 
               style="width: 80px"
               min="0" 
               max="${subject.practical_fullmarks || 25}" 
               value="${existingPracticalMarks}">
        <span class="text-muted">/ ${subject.practical_fullmarks || 25}</span>
        ${existingPracticalMarks ? '<i class="fas fa-check text-success"></i>' : ''}
      </div>
    </div>
  `;
});

}

            
            else {
              studentMakrsBox = "No subjects available for this class/section.";
            }

            $(".studentMakrsBox").html(studentMakrsBox);
          } else {
            $(".studentMakrsBox").html("No student found.");
          }
        },
        error: function (xhr) {
          console.error("API call failed", xhr.responseJSON);
          $(".studentMakrsBox").html(
            xhr.responseJSON?.message || "Error searching for student."
          );
        },
      });
    } else if (admissionNumber.length > 4 && !examTypeId) {
      $(".studentMakrsBox").html("<div class='alert alert-warning'>Please select an exam type first</div>");
    }
  });

  // Refresh marks when exam type changes
  $(document).on("change", "input[name='examType']", function () {
    const admissionNumber = $("#admissionno").val();
    if (admissionNumber && admissionNumber.length > 4) {
      $("#admissionno").trigger("keyup");
    }
  });


  // Refresh marks when academic year changes
  $(document).on("change", "#academicYearSelect", function () {
    const admissionNumber = $("#admissionno").val();
    if (admissionNumber && admissionNumber.length > 4) {
      $("#admissionno").trigger("keyup");
    }
  });


  //Handle Bulk Marks Entry 
  // Initialize bulk marks modal
  const bulkMarksModal = new bootstrap.Modal('#bulkMarksModal');

  // Open bulk marks modal
  $('#bulkMarksBtn').click(function () {
    bulkMarksModal.show();
  });

  // Load sections when class is selected
  $('#bulkClassSelect').change(function () {
    const classId = $(this).val();
    $('#bulkSectionSelect').empty().append('<option value="">Select Section</option>');
    $('#bulkMarksTableContainer').addClass('d-none');

    if (classId) {
      $.ajax({
        url: '/exams/api/sections-by-class',
        data: { class_id: classId },
        success: function (sections) {
          sections.forEach(function (section) {
            $('#bulkSectionSelect').append(
              `<option value="${section.id}">${section.section_name}</option>`
            );
          });
        }
      });
    }
  });

  // Load data when Load Data button is clicked
  $('#loadBulkDataBtn').click(function () {
    const classId = $('#bulkClassSelect').val();
    const sectionId = $('#bulkSectionSelect').val();
    const examTypeId = $('#bulkExamTypeSelect').val();

    if (!classId || !examTypeId) {
      alert('Please select Class, Section, and Exam Type');
      return;
    }

    $('#loadingSpinner').removeClass('d-none');
    $('#bulkMarksTableContainer').addClass('d-none');

    loadBulkMarksData(classId, sectionId, examTypeId);
  });

  // Function to load students and subjects for bulk marks
  function loadBulkMarksData(classId, sectionId, examTypeId) {
    $.ajax({
      url: '/exams/api/bulk-marks-data',
      data: {
        class_id: classId,
        section_id: sectionId,
        exam_id: examTypeId
      },
      success: function (data) {
        $('#loadingSpinner').addClass('d-none');

        if (data.students && data.subjects) {
          renderBulkMarksTable(data.students, data.subjects);
          $('#bulkMarksTableContainer').removeClass('d-none');
        } else {
          alert('No data found for the selected criteria');
        }
      },
      error: function (xhr) {
        $('#loadingSpinner').addClass('d-none');
        alert('Error loading data: ' + (xhr.responseJSON?.error || 'Server error'));
      }
    });
  }

  // Function to render the bulk marks table
  function renderBulkMarksTable(students, subjects) {
    const $table = $('#bulkMarksTable');
    const $thead = $table.find('thead tr');
    const $tbody = $table.find('tbody');

    // Clear existing columns (except student and admission no)
    $thead.find('th:gt(2)').remove();


    // Add subject columns
    subjects.forEach(function (subject, index) {
      $thead.append(`
    <th title="${subject.name} (${subject.code})" style="min-width: 120px">
      <div class="text-nowrap">${subject.name}</div>
      <small class="text-nowrap">(${subject.code})</small>
    </th>
  `);
    });

    // Clear existing rows
    $tbody.empty();

    // Add student rows
    students.forEach(function (student, rowIndex) {
      const $row = $(`
          <tr data-student-id="${student.id}">
            <td>${rowIndex + 1}</td>
            <td class="text-nowrap">
              ${student.first_name} ${student.middle_name || ''} ${student.last_name || ''}
            </td>
            <td>${student.admission_no}</td>
          </tr>
        `);

      // Add input fields for each subject
      subjects.forEach(function (subject) {
        const existingMark = student.marks && student.marks.find(m => m.subject_code === subject.code);
        $row.append(`
            <td>
              <input type="number" 
                     class="form-control bulk-mark-input" 
                     data-subject-code="${subject.code}"
                     data-full-marks="${subject.fullmarks}"
                     value="${existingMark ? existingMark.marks : ''}"
                     min="0" 
                     max="${subject.fullmarks}"
                     step="0.01"
                     placeholder="0-${subject.fullmarks}">
            </td>
          `);
      });

      $tbody.append($row);
    });
  }

  // Save bulk marks
  $('#saveBulkMarksBtn').click(function () {
    const marksData = [];
    const examTypeId = $('#bulkExamTypeSelect').val();
    const classId = $('#bulkClassSelect').val();
    const sectionId = $('#bulkSectionSelect').val();
    const academicYear = $('#bulkAcademicYearSelect').val() || data.academicYear; // Get from loaded data if not selected

    // Validate inputs first
    let hasError = false;
    $('.bulk-mark-input').each(function () {
      const value = $(this).val();
      if (value) {
        const numericValue = parseFloat(value);
        const max = parseFloat($(this).data('full-marks'));

        if (isNaN(numericValue) || numericValue < 0 || numericValue > max) {
          $(this).addClass('is-invalid');
          hasError = true;
        } else {
          $(this).removeClass('is-invalid');
        }
      }
    });

    if (hasError) {
      alert('Please correct the invalid marks (must be between 0 and full marks)');
      return;
    }

    // Collect marks data
    $('#bulkMarksTable tbody tr').each(function () {
      const studentId = $(this).data('student-id');
      const studentMarks = {};

      $(this).find('.bulk-mark-input').each(function () {
        const subjectCode = $(this).data('subject-code');
        const markValue = $(this).val();

        if (markValue !== '') {
          studentMarks[subjectCode] = parseFloat(markValue);
        }
      });

      if (Object.keys(studentMarks).length > 0) {
        marksData.push({
          student_id: studentId,
          marks: studentMarks
        });
      }
    });

    if (marksData.length === 0) {
      alert('Please enter marks for at least one student');
      return;
    }

    // Show saving indicator
    const $saveBtn = $('#saveBulkMarksBtn');
    $saveBtn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin me-2"></i>Saving...');

    // Send data to server
    $.ajax({
      url: '/exams/api/save-bulk-marks',
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({
        exam_id: examTypeId,
        class_id: classId,
        section_id: sectionId,
        academic_year: academicYear,
        marks_data: marksData
      }),
      success: function (response) {
        alert(response.message || 'Marks saved successfully');
        bulkMarksModal.hide();
      },
      error: function (xhr) {
        alert(xhr.responseJSON?.error || 'Error saving marks');
      },
      complete: function () {
        $saveBtn.prop('disabled', false).html('<i class="fas fa-save me-2"></i>Save All Marks');
      }
    });
  });

  // Validate bulk marks input on the fly
  $(document).on('input', '.bulk-mark-input', function () {
    const value = parseFloat($(this).val()) || 0;
    const max = parseFloat($(this).data('full-marks'));

    if (value > max) {
      $(this).addClass('is-invalid');
    } else if (value < 0) {
      $(this).addClass('is-invalid');
    } else {
      $(this).removeClass('is-invalid');
    }
  });


});





$(document).ready(function () {
  // Load sections when class is selected
  $('#bulkClassSelect').change(function () {
    const classId = $(this).val();
    if (classId) {
      $.ajax({
        url: '/api/sections',
        data: { class_id: classId },
        success: function (sections) {
          const $sectionSelect = $('#bulkSectionSelect');
          $sectionSelect.empty().append('<option value="">Select Section</option>');
          sections.forEach(section => {
            $sectionSelect.append(`<option value="${section.id}">${section.section_name}</option>`);
          });
        }
      });
    }
  });

  // Load bulk marks data
  $('#loadBulkDataBtn').click(function () {
    const classId = $('#bulkClassSelect').val();
    const sectionId = $('#bulkSectionSelect').val();
    const examId = $('#bulkExamTypeSelect').val();
    const academicYear = $('#bulkAcademicYearSelect').val();

    if (!classId || !examId) {
      alert('Please select class, section and exam type');
      return;
    }

    $('#loadingSpinner').removeClass('d-none');
    $('#bulkMarksTableContainer').addClass('d-none');

    $.ajax({
      url: '/exams/api/bulk-marks-data',
      data: {
        class_id: classId,
        section_id: sectionId,
        exam_id: examId,
        academic_year: academicYear
      },
      success: function (data) {
        renderBulkMarksTable(data);
      },
      error: function (xhr) {
        alert(xhr.responseJSON?.error || 'Error loading data');
      },
      complete: function () {
        $('#loadingSpinner').addClass('d-none');
      }
    });
  });

  // Render bulk marks table
  function renderBulkMarksTable(data) {
    const $tableBody = $('#bulkMarksTable tbody');
    $tableBody.empty();

    // Add subject columns to header
    const $headerRow = $('#bulkMarksTable thead tr');
    $headerRow.find('th:gt(2)').remove(); // Remove existing subject columns

    data.subjects.forEach(subject => {
      $headerRow.append(`<th>${subject.name}<br><small>${subject.code} (${subject.fullmarks})</small></th>`);
    });

    // Add student rows with marks inputs
    data.students.forEach((student, index) => {
      const $row = $(`
        <tr data-student-id="${student.id}">
          <td>${index + 1}</td>
          <td>${student.name}</td>
          <td>${student.admission_no}</td>
        </tr>
      `);

      // Add mark inputs for each subject
      data.subjects.forEach(subject => {
        const existingMark = student.marks[subject.code] || '';
        $row.append(`
          <td>
            <input type="number" 
                   class="form-control bulk-mark-input" 
                   data-subject-code="${subject.code}"
                   data-subject-id="${subject.id}"  // Add this attribute
                   data-full-marks="${subject.fullmarks}"
                   value="${existingMark}"
                   min="0" 
                   max="${subject.fullmarks}"
                   step="0.01"
                   placeholder="0-${subject.fullmarks}">
          </td>
        `);

      });

      $tableBody.append($row);
    });

    $('#bulkMarksTableContainer').removeClass('d-none');
  }

  // Save bulk marks
  $('#saveBulkMarksBtn').click(function () {
    const examId = $('#bulkExamTypeSelect').val();
    const classId = $('#bulkClassSelect').val();
    const sectionId = $('#bulkSectionSelect').val();
    const academicYear = $('#bulkAcademicYearSelect').val();

    if (!examId || !classId || !sectionId) {
      alert('Please ensure class, section and exam type are selected');
      return;
    }

    const marksData = [];
    $('#bulkMarksTable tbody tr').each(function () {
      const studentId = $(this).data('student-id');
      const studentMarks = {};

      $(this).find('.bulk-mark-input').each(function () {
        const subjectCode = $(this).data('subject-code');
        const subjectId = $(this).data('subject-id');  // Get subject ID
        const markValue = $(this).val();

        if (markValue !== '') {
          studentMarks[subjectCode] = {
            marks: parseFloat(markValue),
            subject_id: subjectId  // Include subject ID
          };
        }
      });

      if (Object.keys(studentMarks).length > 0) {
        marksData.push({
          student_id: studentId,
          marks: studentMarks,
          subject_id: subjectId  // Include subject ID at student level if needed
        });
      }
    });

    if (marksData.length === 0) {
      alert('No marks entered to save');
      return;
    }

    $(this).prop('disabled', true).html('<i class="fas fa-spinner fa-spin me-2"></i>Saving...');

    $.ajax({
      url: '/exams/api/bulk-marks-data',
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({
        exam_id: examId,
        class_id: classId,
        section_id: sectionId,
        academic_year: academicYear,
        marks_data: marksData
      }),
      success: function (response) {
        alert(response.message || 'Marks saved successfully');
        $('#bulkMarksModal').modal('hide');
      },
      error: function (xhr) {
        alert(xhr.responseJSON?.error || 'Error saving marks');
      },
      complete: function () {
        $('#saveBulkMarksBtn').prop('disabled', false).html('<i class="fas fa-save me-2"></i>Save All Marks');
      }
    });
  });

  // Add academic year selector to modal (you'll need to add this HTML)
  $('#bulkAcademicYearSelect').change(function () {
    // If academic year changes, reload the data
    if ($('#bulkMarksTableContainer').is(':visible')) {
      $('#loadBulkDataBtn').click();
    }
  });
});