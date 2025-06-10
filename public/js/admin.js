
(() => {
    'use strict'
    const forms = document.querySelectorAll('.needs-validation')
    Array.from(forms).forEach(form => {
        form.addEventListener('submit', event => {
            if (!form.checkValidity()) {
                event.preventDefault()
                event.stopPropagation()
            }
            form.classList.add('was-validated')
        }, false)
    })
})()



function editRole(id, name, description) {
    document.getElementById("input-id").value = id;
    document.getElementById("input-name").value = name;
    document.getElementById("input-description").value = description || "";
}


function editRole(role) {
    document.getElementById("input-id").value = role.id || '';
    document.getElementById("input-name").value = role.name || '';

    // Clear all checkboxes
    document.querySelectorAll('input[name="home_layout_ids[]"]').forEach(cb => cb.checked = false);

    // Now check assigned layout IDs
    if (role.layouts && Array.isArray(role.layouts)) {
        role.layouts.forEach(layout => {
            const checkbox = document.querySelector(`input[name="home_layout_ids[]"][value="${layout.id}"]`);
            if (checkbox) checkbox.checked = true;
        });
    }
}


