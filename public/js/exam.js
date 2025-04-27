$(document).ready(function () {
  $(document).on("keyup", "#admissionno", function () {
    const admissionNumber = $(this).val();

    // Always first reset all fields
    $(".admissionNumber").html("");
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
            if (response.class.subjects && response.class.subjects.length > 0) {
              response.class.subjects.forEach(function (subject) {
                studentMakrsBox += `
                  <label class="d-flex justify-content-between bg-light w-100 p-2 border">${subject.name}: 
                    <input type="text" name="${subject.code}" class="marks-input w-25" />
                  </label><br>
                `;
              });
            } else {
              studentMakrsBox = "No subjects available.";
            }

            // Append the dynamic marks boxes to the studentMakrsBox div
            $(".studentMakrsBox").html(studentMakrsBox);
          } else {
            // If no student data found, show an error message
            $(".studentMakrsBox").html("No student found.");
          }
        },
        error: function () {
          // Handle the error
          console.error("API call failed");
          $(".studentMakrsBox").html("Registration not found");
        },
      });
    }
  });
});
