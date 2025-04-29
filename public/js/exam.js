$(document).ready(function () {
  // Add input validation for marks fields
  $(document).on("input", ".marks-input", function() {
    const value = $(this).val();
    const fullmarks = $(this).next('span').text().match(/\d+/)[0]; // Extract full marks from the text
    
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

    // Reset all fields
    $(".admissionNumber").val("");
    $(".studentName").html("");
    $(".studentClass").html("");
    $(".StudentSection").html("");
    $(".studentMakrsBox").html("");

    if (admissionNumber.length > 4) {
      $.ajax({
        method: "GET",
        url: "api/search",
        data: {
          q: admissionNumber,
        },
        success: function (response) {
          if (response && response.admission_no) {
            // Display student data
            $(".admissionNumber").val(response.admission_no);
            $(".studentName").html(
              (response.first_name || "") +
                " " +
                (response.middle_name || "") +
                " " +
                (response.last_name || "")
            );
            $(".studentClass").html(response.class.class_name || "-");
            $(".StudentSection").html(response.section.section_name || "-");

            // Create dynamic marks input boxes for each subject
            let studentMakrsBox = "";
            if (response.subjects && response.subjects.length > 0) {
              response.subjects.forEach(function (subject) {
                studentMakrsBox += `
                  <label class="d-flex justify-content-between bg-light w-100 p-2 border">
                    ${subject.name} (${subject.code}):
                    <div class="d-flex gap-2">
                      <input type="text" 
                             name="${subject.code}_obtained" 
                             class="marks-input form-control w-25" 
                             placeholder="Obtained" 
                             pattern="\\d*\\.?\\d*"
                             title="Enter numbers only" />
                      <span>/ ${subject.fullmarks} (Pass: ${subject.passmarks})</span>
                    </div>
                  </label><br>
                `;
              });
            } else {
              studentMakrsBox = "No subjects available for this class/section.";
            }

            $(".studentMakrsBox").html(studentMakrsBox);
          } else {
            $(".studentMakrsBox").html("No student found.");
          }
        },
        error: function () {
          console.error("API call failed");
          $(".studentMakrsBox").html("Error searching for student.");
        },
      });
    }
  });
});