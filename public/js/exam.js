//Individual Marks Entry
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
          academicYear: academicYear
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
        <span>Th:</span>
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
        <span>Pr:</span>
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

});



//Bulk Action

$(document).ready(function () {
  //Handle Bulk Marks Entry 
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

  // Validate bulk marks input on the fly
  $(document).on('input', '.bulk-mark-input', function () {
    const $input = $(this);
    const value = parseFloat($input.val()) || 0;

    // Get max limits
    const isTheory = $input.hasClass('theory');
    const isPractical = $input.hasClass('practical');

    if (isTheory) {
      const fullMarks = parseFloat($input.data('full-marks')) || 0;
      const $practicalInput = $input
        .closest('td')
        .find('.bulk-mark-input.practical');
      const practicalFullMarks = parseFloat($practicalInput.data('practical-marks')) || 0;

      if (value > fullMarks || value > practicalFullMarks || value < 0) {
        $input.addClass('is-invalid');
      } else {
        $input.removeClass('is-invalid');
      }
    } else if (isPractical) {
      const practicalFullMarks = parseFloat($input.data('practical-marks')) || 0;

      if (value > practicalFullMarks || value < 0) {
        $input.addClass('is-invalid');
      } else {
        $input.removeClass('is-invalid');
      }
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

  function renderBulkMarksTable(data) {
    const $tableBody = $('#bulkMarksTable tbody');
    const $headerRow = $('#bulkMarksTable thead tr');

    $tableBody.empty();
    $headerRow.find('th:gt(2)').remove();

    // Create headers for each subject
    data.subjects.forEach(subject => {
      $headerRow.append(`
      <th class="text-center">
        <div>${subject.name}</div>
        <small>${subject.code}</small>
        <div class="text-muted small">
          <span>T/${subject.fullmarks}</span>
          ${subject.practical_fullmarks > 0 ? `<span> P/${subject.practical_fullmarks}</span>` : ''}
        </div>
      </th>
    `);
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
        const existingMark = student.marks[subject.code] || {};
        const hasPractical = subject.practical_fullmarks > 0;

        $row.append(`
        <td class="text-center">
          <div class="d-flex flex-column gap-1">
            <div class="input-group input-group-sm">
              <span class="input-group-text bg-light">Th</span>
              <input type="number" 
                     class="form-control bulk-mark-input theory" 
                     data-subject-code="${subject.code}"
                     data-subject-id="${subject.id}"
                     data-full-marks="${subject.fullmarks}"
                     value="${existingMark.marks_obtained || ''}"
                     min="0" 
                     max="${subject.fullmarks}"
                     step="0.01"
                     placeholder="0">
            </div>
          
            <div class="input-group input-group-sm">
              <span class="input-group-text bg-light">Pr</span>
              <input type="number" 
                     class="form-control bulk-mark-input practical" 
                     data-subject-code="${subject.code}"
                     data-practical-marks="${subject.practical_fullmarks}"
                     value="${existingMark.practical_marks || ''}"
                     min="0" 
                     max="${subject.practical_fullmarks}"
                     step="0.01"
                     placeholder="0">
            </div>
          
          </div>
        </td>
      `);
      });

      $tableBody.append($row);
    });

    $('#bulkMarksTableContainer').removeClass('d-none');
  }

  // Update the save bulk marks function to handle practical marks
  $('#saveBulkMarksBtn').click(function () {
    const marksData = [];
    const examTypeId = $('#bulkExamTypeSelect').val();
    const classId = $('#bulkClassSelect').val();
    const sectionId = $('#bulkSectionSelect').val();
    const academicYear = $('#bulkAcademicYearSelect').val() || data.academicYear;

    // Validate inputs first
    let hasError = false;
    $('.bulk-mark-input').each(function () {
      const value = $(this).val();
      if (value) {
        const numericValue = parseFloat(value);
        const max = $(this).hasClass('theory')
          ? parseFloat($(this).data('full-marks'))
          : parseFloat($(this).data('practical-marks'));

        if (isNaN(numericValue)) {
          $(this).addClass('is-invalid');
          hasError = true;
        } else if (numericValue < 0 || numericValue > max) {
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

    // Collect marks data including practical marks
    $('#bulkMarksTable tbody tr').each(function () {
      const studentId = $(this).data('student-id');
      const studentMarks = {};

      // Process theory marks
      $(this).find('.bulk-mark-input.theory').each(function () {
        const subjectCode = $(this).data('subject-code');
        const theoryValue = $(this).val();

        if (theoryValue !== '') {
          studentMarks[subjectCode] = {
            marks_obtained: parseFloat(theoryValue)
          };
        }
      });

      // Process practical marks
      $(this).find('.bulk-mark-input.practical').each(function () {
        const subjectCode = $(this).data('subject-code');
        const practicalValue = $(this).val();

        if (practicalValue !== '') {
          if (!studentMarks[subjectCode]) {
            studentMarks[subjectCode] = {};
          }
          studentMarks[subjectCode].practical_marks = parseFloat(practicalValue);
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


  // Add academic year selector to modal (you'll need to add this HTML)
  $('#bulkAcademicYearSelect').change(function () {
    // If academic year changes, reload the data
    if ($('#bulkMarksTableContainer').is(':visible')) {
      $('#loadBulkDataBtn').click();
    }
  });
});