function searchDropdown(type) {
  const input = document.getElementById(type);
  const dropdown = document.getElementById(type + "_dropdown");
  const query = input.value.trim();

  if (query.length < 1) {
    dropdown.innerHTML = "";
    dropdown.style.display = "none";
    return;
  }

  fetch(`/exams/api/search?type=${type}&&q=${encodeURIComponent(query)}`)
    .then((res) => res.json())
    .then((data) => {
      dropdown.innerHTML = "";

      if (data.length === 0) {
        dropdown.innerHTML = `<div class="dropdown-item disabled">No results</div>`;
      } else {
        data.forEach((item) => {
          const div = document.createElement("div");
          div.className = "dropdown-item";

          // Handle different types of results
          if (type === "exam_type") {
            div.textContent = item.name || "No name";
          } else if (type === "class") {
            div.textContent = item.class_name || "No name";
          } else if (type === "subject") {
            div.textContent = item.name || "No name";
          } else if (type === "section") {
            div.textContent = item.section_name || "No name";
          } else if (type === "student") {
            div.textContent =
              `${item.first_name} ${item.middle_name || ""} ${
                item.last_name || ""
              }`.trim() || "No name";
          } else {
            div.textContent = item.name || "No name";
          }

          div.onclick = () => {
            input.value = div.textContent;
            dropdown.innerHTML = "";
            dropdown.style.display = "none";
          };

          dropdown.appendChild(div);
        });
      }

      dropdown.style.display = "block";
    })
    .catch((err) => {
      console.error("Search error:", err);
      dropdown.innerHTML =
        "<div class='dropdown-item disabled'>Error loading</div>";
      dropdown.style.display = "block";
    });
}
