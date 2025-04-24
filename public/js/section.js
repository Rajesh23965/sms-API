$(document).ready(function () {
  $(document).on("click", ".addSectionBox", function () {
    var sectionbox = `
        <span class="d-flex gap-2 mt-2 sectionNewBox">
          <input
            type="text"
            name="section_name"
            class="form-control"
            placeholder="Enter Section Name"
            required
          />
          <span class="btn btn-outline-danger deleteSectionBox">X</span>
        </span>
      `;

    $(".sectionContainer").append(sectionbox);
  });

  // To delete added section input
  $(document).on("click", ".deleteSectionBox", function () {
    $(this).closest(".sectionNewBox").remove();
  });

  //To Remove Message
  $(document).on("click", ".btn-close", function () {
    $(this).closest(".alert").remove();
  });
});
