$(document).ready(function () {
    // Initialize select2 with better search and multi-select capabilities
    $('#classSelect').select2({
        placeholder: "Select classes...",
        allowClear: true,
        width: '100%',
        dropdownParent: $('#classSelect').parent()
    });

    $('#sectionSelect').select2({
        placeholder: "Select sections...",
        allowClear: true,
        width: '100%',
        dropdownParent: $('#sectionSelect').parent(),
        disabled: true
    });

    // Improved class selection handler
    $('#classSelect').on('change', function () {
        const selectedClasses = $(this).val();
        updateActiveFilters();

        if (selectedClasses && selectedClasses.length > 0) {
            // Show loading state with spinner
            $('#sectionSelect').empty().append('<option value="">Loading...</option>').prop('disabled', true).select2();
            $('#searchSubjectsBtn').prop('disabled', true);

            // Fetch sections with loading indicator
            fetchSections(selectedClasses);
        } else {
            $('#sectionSelect').empty().append('<option value="">Select class first</option>')
                              .prop('disabled', true).select2();
            $('#searchSubjectsBtn').prop('disabled', true);
            $('#resultsSection').hide();
        }
    });

    // Enhanced section selection handler
    $('#sectionSelect').on('change', function () {
        updateActiveFilters();
        $('#searchSubjectsBtn').prop('disabled', !$(this).val() || $(this).val().length === 0);
    });

    // Improved fetch sections function
    function fetchSections(classIds) {
        $.ajax({
            url: '/classes/get-sections',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ classIds: classIds }),
            beforeSend: function() {
                $('#sectionSelect').html('<option value="">Loading sections...</option>')
                                  .prop('disabled', true).select2();
            },
            success: function (response) {
                if (response && response.length > 0) {
                    let options = '<option value="">All sections</option>';
                    const groupedSections = {};
                    
                    // Group sections by class for better organization
                    response.forEach(section => {
                        if (!groupedSections[section.class_id]) {
                            groupedSections[section.class_id] = [];
                        }
                        groupedSections[section.class_id].push(section);
                    });

                    // Add optgroups for better organization
                    Object.keys(groupedSections).forEach(classId => {
                        const classOption = $('#classSelect option[value="' + classId + '"]');
                        if (classOption.length) {
                            options += `<optgroup label="${classOption.text()}">`;
                            groupedSections[classId].forEach(section => {
                                options += `<option value="${section.id}">${section.section_name}</option>`;
                            });
                            options += `</optgroup>`;
                        }
                    });

                    $('#sectionSelect').html(options).prop('disabled', false).select2();
                } else {
                    $('#sectionSelect').html('<option value="">No sections available</option>')
                                      .prop('disabled', true).select2();
                }
            },
            error: function (xhr) {
                console.error('Error loading sections:', xhr);
                $('#sectionSelect').html('<option value="">Error loading sections</option>')
                                  .prop('disabled', true).select2();
                showToast('Error', 'Failed to load sections. Please try again.', 'error');
            }
        });
    }

    // Enhanced update active filters function
    function updateActiveFilters() {
        const activeFilters = $('#activeFilters');
        activeFilters.empty();

        const selectedClasses = $('#classSelect').select2('data');
        const selectedSections = $('#sectionSelect').select2('data');

        if (selectedClasses.length > 0) {
            const badge = $(`<span class="badge bg-primary me-2">
                <i class="fas fa-graduation-cap me-1"></i>
                ${selectedClasses.length} ${selectedClasses.length === 1 ? 'Class' : 'Classes'}
                <button class="btn-close btn-close-white btn-sm ms-2" style="font-size: 0.5rem;"></button>
            </span>`);
            
            badge.find('button').on('click', function(e) {
                e.stopPropagation();
                $('#classSelect').val(null).trigger('change');
            });
            
            activeFilters.append(badge);
        }

        if (selectedSections.length > 0 && selectedSections[0].id) {
            const badge = $(`<span class="badge bg-success me-2">
                <i class="fas fa-layer-group me-1"></i>
                ${selectedSections.length} ${selectedSections.length === 1 ? 'Section' : 'Sections'}
                <button class="btn-close btn-close-white btn-sm ms-2" style="font-size: 0.5rem;"></button>
            </span>`);
            
            badge.find('button').on('click', function(e) {
                e.stopPropagation();
                $('#sectionSelect').val(null).trigger('change');
            });
            
            activeFilters.append(badge);
        }
    }

    // Improved search functionality with better error handling
    $('#searchSubjectsBtn').click(function () {
        const selectedClasses = $('#classSelect').val();
        const selectedSections = $('#sectionSelect').val();

        if (!selectedClasses || selectedClasses.length === 0 || !selectedSections || selectedSections.length === 0) {
            showToast('Warning', 'Please select at least one class and section', 'warning');
            return;
        }

        // Show loading state with better UI
        $('#resultsSection').show();
        $('#subjectsTableBody').hide();
        $('#emptyState').hide();
        $('#loadingState').show();
        $('#exportBtn, #printBtn').prop('disabled', true);
        
        // Update button state
        const $btn = $(this);
        $btn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin me-1"></i> Searching...');

        // Fetch subjects with better error handling
        $.ajax({
            url: '/classes/get-subjects',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                sectionIds: selectedSections,
                classIds: selectedClasses
            }),
            success: function (response) {
                $('#loadingState').hide();
                $btn.prop('disabled', false).html('<i class="fas fa-search me-1"></i> Find Subjects');

                if (response && response.length > 0) {
                    renderSubjectsTable(response);
                    $('#exportBtn, #printBtn').prop('disabled', false);
                } else {
                    showEmptyState();
                }
            },
            error: function (xhr) {
                console.error('Error loading subjects:', xhr);
                $('#loadingState').hide();
                $btn.prop('disabled', false).html('<i class="fas fa-search me-1"></i> Find Subjects');
                
                $('#emptyState').html(`
                    <div class="text-center py-4">
                        <i class="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
                        <h4 class="text-warning">Error Loading Subjects</h4>
                        <p class="text-muted">${xhr.responseJSON?.error || 'Please try again later'}</p>
                        <button class="btn btn-sm btn-outline-primary mt-2" onclick="$('#searchSubjectsBtn').click()">
                            <i class="fas fa-sync-alt me-1"></i> Retry
                        </button>
                    </div>
                `).show();
            }
        });
    });

    // Improved table rendering function
    function renderSubjectsTable(subjects) {
        const classNames = $('#classSelect option:selected').map((i, el) => $(el).text()).get();
        const sectionNames = $('#sectionSelect option:selected').map((i, el) => $(el).text()).get();
        
        let rows = '';
        subjects.forEach((subject, index) => {
            rows += `
                <tr>
                    <td>${index + 1}</td>
                    <td><span class="badge bg-secondary">${subject.code || 'N/A'}</span></td>
                    <td>
                        <strong>${subject.name || 'Unknown Subject'}</strong>
                        ${subject.description ? `<div class="text-muted small">${subject.description}</div>` : ''}
                    </td>
                    <td>${classNames.join(', ')}</td>
                    <td>${sectionNames.join(', ')}</td>
                    <td class="text-nowrap">
                        <button class="btn btn-sm btn-outline-primary view-details" data-id="${subject.id}">
                            <i class="fas fa-eye me-1"></i> Details
                        </button>
                    </td>
                </tr>
            `;
        });

        $('#subjectsTableBody').html(rows).show();
        $('#emptyState').hide();
        $('#resultCount').html(`Showing <strong>${subjects.length}</strong> subjects`);
        
        // Initialize tooltips
        $('[data-bs-toggle="tooltip"]').tooltip();
    }

    function showEmptyState() {
        $('#subjectsTableBody').hide();
        $('#emptyState').show();
        $('#resultCount').html('No subjects found');
        $('#exportBtn, #printBtn').prop('disabled', true);
    }

    // View details modal with better loading and error states
    $(document).on('click', '.view-details', function () {
        const subjectId = $(this).data('id');
        const modal = new bootstrap.Modal(document.getElementById('subjectDetailsModal'));
        
        // Show loading state in modal
        $('#subjectModalTitle').text('Loading...');
        $('#subjectModalBody').html(`
            <div class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Loading subject details...</p>
            </div>
        `);
        
        modal.show();

        // Fetch subject details with better error handling
        $.ajax({
            url: `/classes/api/subject-details/${subjectId}`,
            method: 'GET',
            success: function (response) {
                renderSubjectDetails(response);
            },
            error: function (xhr) {
                console.error('Error loading subject details:', xhr);
                $('#subjectModalBody').html(`
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        Failed to load subject details.
                        ${xhr.responseJSON?.error ? `<div class="mt-2">${xhr.responseJSON.error}</div>` : ''}
                        <div class="mt-3">
                            <button class="btn btn-sm btn-outline-primary" onclick="$(this).closest('.modal-content').find('.view-details').click()">
                                <i class="fas fa-sync-alt me-1"></i> Try Again
                            </button>
                        </div>
                    </div>
                `);
            }
        });
    });

    // Improved subject details rendering
    function renderSubjectDetails(subject) {
        $('#subjectModalTitle').text(subject.name || 'Subject Details');
        
        // Format subject codes
        let codesHtml = 'N/A';
        if (subject.subjectCodes && subject.subjectCodes.length > 0) {
            codesHtml = subject.subjectCodes.map(code => 
                `<span class="badge bg-primary me-1 mb-1">${code.code || 'N/A'}</span>`
            ).join('');
        }

        // Format class sections
        let classSectionsHtml = 'N/A';
        if (subject.classSections && subject.classSections.length > 0) {
            classSectionsHtml = subject.classSections.map(cls => `
                <div class="mb-3">
                    <div class="fw-bold mb-1">${cls.class_name}:</div>
                    <div>${cls.sections.map(sec => 
                        `<span class="badge bg-success me-1 mb-1">${sec}</span>`
                    ).join('')}</div>
                </div>
            `).join('');
        }

        $('#subjectModalBody').html(`
            <div class="row">
                <div class="col-md-6">
                    <div class="card mb-3">
                        <div class="card-header bg-primary text-white">
                            <i class="fas fa-info-circle me-2"></i>Basic Information
                        </div>
                        <div class="card-body">
                            <table class="table table-sm table-borderless">
                                <tr>
                                    <th width="40%">Name:</th>
                                    <td>${subject.name || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <th>Subject Codes:</th>
                                    <td>${codesHtml}</td>
                                </tr>
                                <tr>
                                    <th>Pass Marks:</th>
                                    <td>${subject.passmarks || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <th>Full Marks:</th>
                                    <td>${subject.fullmarks || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <th>Credit Hour:</th>
                                    <td>${subject.creditHour || 'N/A'}</td>
                                </tr>
                            </table>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-6">
                    <div class="card mb-3">
                        <div class="card-header bg-primary text-white">
                            <i class="fas fa-layer-group me-2"></i>Assigned To
                        </div>
                        <div class="card-body">
                            ${classSectionsHtml}
                        </div>
                    </div>
                </div>
            </div>
            
            ${subject.description ? `
            <div class="card">
                <div class="card-header bg-light">
                    <i class="fas fa-align-left me-2"></i>Description
                </div>
                <div class="card-body">
                    ${subject.description}
                </div>
            </div>
            ` : ''}
        `);
    }

    // Improved export functionality
    $('#exportBtn').click(function() {
        const selectedClasses = $('#classSelect option:selected').map((i, el) => $(el).text()).get().join('_');
        const selectedSections = $('#sectionSelect option:selected').map((i, el) => $(el).text()).get().join('_');
        const filename = `Subjects_${selectedClasses}_${selectedSections}_${new Date().toISOString().slice(0, 10)}.csv`;

        // Get table data with proper escaping
        let csv = [];
        const headers = [];
        $('#subjectsTable thead th').each(function() {
            headers.push($(this).text().replace(/\n/g, ' ').replace(/"/g, '""').trim());
        });
        csv.push(headers.join(','));

        $('#subjectsTable tbody tr').each(function() {
            const row = [];
            $(this).find('td').each(function() {
                let text = $(this).text().trim();
                // Remove action button text if present
                text = text.replace('Details', '').trim();
                // Escape quotes and wrap in quotes if contains comma
                text = text.replace(/"/g, '""');
                if (text.includes(',')) text = `"${text}"`;
                row.push(text);
            });
            csv.push(row.join(','));
        });

        // Download CSV
        const csvContent = csv.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showToast('Success', 'CSV exported successfully', 'success');
    });

    // Improved print functionality
    $('#printBtn').click(function() {
        const printContent = document.createElement('div');
        
        // Create printable content
        printContent.innerHTML = `
            <style>
                @media print {
                    body { padding: 0 !important; margin: 0 !important; }
                    .no-print { display: none !important; }
                    table { width: 100%; font-size: 12px; border-collapse: collapse; }
                    th { background-color: #f8f9fa !important; }
                    .print-header { margin-bottom: 20px; }
                    .print-footer { margin-top: 20px; font-size: 11px; }
                }
            </style>
            <div class="print-header">
                <h3 class="text-center">Subjects Report</h3>
                <div class="d-flex justify-content-between mb-3">
                    <div><strong>Generated:</strong> ${new Date().toLocaleString()}</div>
                    <div><strong>By:</strong> ${$('meta[name="user-name"]').attr('content') || 'System'}</div>
                </div>
                <hr>
            </div>
            <table class="table table-bordered">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Code</th>
                        <th>Subject Name</th>
                        <th>Class</th>
                        <th>Section</th>
                    </tr>
                </thead>
                <tbody>
                    ${$('#subjectsTableBody tr').map(function() {
                        return `
                            <tr>
                                <td>${$(this).find('td:eq(0)').text()}</td>
                                <td>${$(this).find('td:eq(1)').text()}</td>
                                <td>${$(this).find('td:eq(2)').text().replace('Details', '').trim()}</td>
                                <td>${$(this).find('td:eq(3)').text()}</td>
                                <td>${$(this).find('td:eq(4)').text()}</td>
                            </tr>
                        `;
                    }).get().join('')}
                </tbody>
            </table>
            <div class="print-footer text-end">
                <p><strong>Total Subjects:</strong> ${$('#subjectsTableBody tr').length}</p>
                <p class="text-muted">Printed from Class Management System</p>
            </div>
        `;

        // Open print window
        const printWindow = window.open('', '_blank');
        printWindow.document.write('<html><head><title>Subjects Report</title>');
        printWindow.document.write('<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">');
        printWindow.document.write('</head><body class="p-3">');
        printWindow.document.write(printContent.innerHTML);
        printWindow.document.write('<script>setTimeout(function(){ window.print(); window.close(); }, 200);<\/script>');
        printWindow.document.write('</body></html>');
        printWindow.document.close();
    });

    // Helper function to show toast notifications
    function showToast(title, message, type = 'info') {
        const toast = $(`
            <div class="position-fixed bottom-0 end-0 p-3" style="z-index: 11">
                <div class="toast show" role="alert" aria-live="assertive" aria-atomic="true">
                    <div class="toast-header bg-${type} text-white">
                        <strong class="me-auto">${title}</strong>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
                    </div>
                    <div class="toast-body">
                        ${message}
                    </div>
                </div>
            </div>
        `);
        
        $('body').append(toast);
        setTimeout(() => toast.remove(), 5000);
    }
});