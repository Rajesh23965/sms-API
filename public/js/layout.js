$(document).ready(function() {
    // Add URL field
    $('#addUrl').click(function() {
        const urlRow = `
            <div class="input-group mb-2 url-row">
                <input type="text" class="form-control" name="urls[]" placeholder="Enter URL" required>
                <div class="input-group-append">
                    <button class="btn btn-danger remove-url" type="button">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;
        $('#urlContainer').append(urlRow);
    });
    
    // Remove URL field
    $(document).on('click', '.remove-url', function() {
        if ($('.url-row').length > 1) {
            $(this).closest('.url-row').remove();
        } else {
            $(this).closest('.url-row').find('input').val('');
        }
    });
    
    // Delete layout
    $(document).on('click', '.delete-layout', function() {
        const layoutId = $(this).data('id');
        if (confirm('Are you sure you want to delete this layout?')) {
            window.location.href = `/home-layout/delete/${layoutId}`;
        }
    });
    
    // Initialize DataTable
    $('#layoutsTable').DataTable({
        responsive: true
    });
});
