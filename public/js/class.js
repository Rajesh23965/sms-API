
$(document).ready(function () {
    // Initialize select2 with better styling
    $('#classSelect, #sectionSelect').select2({
        placeholder: "Select options",
        allowClear: true,
        closeOnSelect: false,
        width: '100%',
        dropdownParent: $('.card-body')
    });

    // When class selection changes, fetch sections
    $('#classSelect').on('change', function () {
        const selectedClasses = $(this).val();
        updateActiveFilters();

        if (selectedClasses && selectedClasses.length > 0) {
            // Show loading state
            $('#sectionSelect').prop('disabled', true).html('<option value="">Loading sections...</option>').select2();

            // Fetch sections for selected classes
            $.ajax({
                url: '/classes/get-sections',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ classIds: selectedClasses }),
                success: function (response) {
                    if (response && response.length > 0) {
                        let options = '';
                        response.forEach(section => {
                            options += `<option value="${section.id}">${section.section_name}</option>`;
                        });
                        $('#sectionSelect').html(options).prop('disabled', false).select2();
                    } else {
                        $('#sectionSelect').html('<option value="">No sections found</option>').prop('disabled', true).select2();
                    }
                    $('#searchSubjectsBtn').prop('disabled', !$('#sectionSelect').val());
                },
                error: function () {
                    $('#sectionSelect').html('<option value="">Error loading sections</option>').prop('disabled', true).select2();
                    $('#searchSubjectsBtn').prop('disabled', true);
                }
            });
        } else {
            $('#sectionSelect').html('<option value="">First select a class</option>').prop('disabled', true).select2();
            $('#searchSubjectsBtn').prop('disabled', true);
        }
    });

    // Enable search button when sections are selected
    $('#sectionSelect').on('change', function () {
        updateActiveFilters();
        $('#searchSubjectsBtn').prop('disabled', !$(this).val());
    });

    // Update active filters display
    function updateActiveFilters() {
        const activeFilters = $('#activeFilters');
        activeFilters.empty();

        const selectedClasses = $('#classSelect').select2('data');
        const selectedSections = $('#sectionSelect').select2('data');

        if (selectedClasses.length > 0) {
            activeFilters.append('<span class="badge bg-green-600">Classes: ' +
                selectedClasses.map(c => c.text).join(', ') + '</span>');
        }

        if (selectedSections.length > 0 && selectedSections[0].id) {
            activeFilters.append('<span class="badge bg-green-600 text-dark">Sections: ' +
                selectedSections.map(s => s.text).join(', ') + '</span>');
        }
    }

    // Search for subjects with enhanced UI
    $('#searchSubjectsBtn').click(function () {
        const selectedClasses = $('#classSelect').val();
        const selectedSections = $('#sectionSelect').val();

        if (selectedClasses && selectedClasses.length > 0 && selectedSections && selectedSections.length > 0) {
            // Show loading state
            $('#resultsSection').show();
            $('#subjectsTableBody').hide();
            $('#emptyState').hide();
            $('#loadingState').show();
            $('#exportBtn').prop('disabled', true);

            // Fetch subjects
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

                    if (response && response.length > 0) {
                        let rows = '';
                        const classNames = $('#classSelect option:selected').map((i, el) => $(el).text()).get();
                        const sectionNames = $('#sectionSelect option:selected').map((i, el) => $(el).text()).get();

                        response.forEach((subject, index) => {
                            const code = subject.code || 'N/A';
                            const name = subject.name || 'Unknown Subject';

                            rows += `
                <tr>
                    <td>${index + 1}</td>
                    <td><span class="subject-code">${code}</span></td>
                    <td>${name}</td>
                    <td>${classNames.join(', ')}</td>
                    <td>${sectionNames.join(', ')}</td>
                    <td>
                        <button class="btn btn-sm bg-green-600 view-details" data-id="${subject.id}" data-bs-toggle="tooltip" title="View details">
                            <i class="fas fa-eye"></i>
                        </button>
                    </td>
                </tr>
              `;
                        });

                        $('#subjectsTableBody').html(rows).show();
                        $('#emptyState').hide();
                        $('#resultCount').text(`Found ${response.length} subjects`);
                        $('#exportBtn').prop('disabled', false);

                        // Initialize tooltips for view buttons
                        $('.view-details').tooltip({
                            title: "View details",
                            placement: "top"
                        });
                    } else {
                        $('#subjectsTableBody').hide();
                        $('#emptyState').show();
                        $('#resultCount').text('No subjects found');
                        $('#exportBtn').prop('disabled', true);
                    }
                },
                error: function (xhr) {
                    $('#loadingState').hide();
                    $('#subjectsTableBody').hide();
                    $('#emptyState').html(`
            <i class="fas fa-exclamation-triangle fa-4x mb-3 text-green-600"></i>
            <h4 class="text-green-600">Error loading subjects</h4>
            <p class="text-center text-muted">${xhr.responseJSON?.error || 'Please try again'}</p>
          `).show();
                    $('#resultCount').text('Error loading results');
                    $('#exportBtn').prop('disabled', true);
                }
            });
        }
    });
    $(document).on('click', '.view-details', function () {
        const subjectId = $(this).data('id');
        const modal = new bootstrap.Modal(document.getElementById('subjectDetailsModal'));

        $('#subjectModalTitle').text('Loading subject details...');
        $('#subjectModalBody').html(`
            <div class="text-center py-4">
              <div class="spinner-border text-green-600" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
              <p class="mt-2">Loading details for subject ID: ${subjectId}</p>
            </div>
        `);

        modal.show();

        $.ajax({
            url: `/classes/api/subject-details/${subjectId}`,
            method: 'GET',
            success: function (response) {
                // Format the subject codes if they exist
                let subjectCodesHtml = 'N/A';
                if (response.subjectCodes && response.subjectCodes.length > 0) {
                    subjectCodesHtml = response.subjectCodes.map(code =>
                        `<span class="badge bg-green-600 me-1">${code.code || 'N/A'}</span>`
                    ).join('');
                }

                // Format classSections with alternate display of class and their sections
                let classSectionsHtml = 'N/A';
                if (response.classSections && response.classSections.length > 0) {
                    classSectionsHtml = response.classSections.map(cls => `
                <div class="mb-2">
                    <strong class="text-gree">${cls.class_name}:</strong>
                    ${cls.sections.map(sec => `
                        <span class="badge bg-green-600 me-1">${sec}</span>
                    `).join('')}
                </div>
            `).join('');
                }


                $('#subjectModalTitle').text(response.name || 'Subject Details');
                $('#subjectModalBody').html(`
            <div class="row">
                <div class="col-md-6">
                    <div class="card mb-3">
                        <div class="card-header bg-green-600 text-white">
                            <h5 class="mb-0">Basic Information</h5>
                        </div>
                        <div class="card-body">
                            <table class="table table-sm table-borderless">
                                <tr>
                                    <th width="40%">ID:</th>
                                    <td>${response.id || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <th>Name:</th>
                                    <td>${response.name || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <th>Subject Codes:</th>
                                    <td>${subjectCodesHtml}</td>
                                </tr>
                                <tr>
                                    <th>Pass Marks:</th>
                                    <td>${response.passmarks || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <th>Full Marks:</th>
                                    <td>${response.fullmarks || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <th>Credit Hour:</th>
                                    <td>${response.creditHour || 'N/A'}</td>
                                </tr>
                            </table>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-6">
                    <div class="card mb-3">
                        <div class="card-header bg-green-600 text-white">
                            <h5 class="mb-0">Class & Section Information</h5>
                        </div>
                        <div class="card-body">
                            ${classSectionsHtml}
                        </div>
                    </div>
                </div>
            </div>
        `);
            },
            error: function (xhr) {
                console.error('Error loading subject details:', xhr);
                $('#subjectModalBody').html(`
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle me-2"></i>
                Failed to load subject details. Please try again.
                ${xhr.responseJSON?.error ? `<p class="mt-2">${xhr.responseJSON.error}</p>` : ''}
            </div>
        `);
            }
        });

    });

    // Export to CSV functionality

    $('#exportBtn').click(function () {
        const selectedClasses = $('#classSelect option:selected').map((i, el) => $(el).text()).get().join('_');
        const selectedSections = $('#sectionSelect option:selected').map((i, el) => $(el).text()).get().join('_');
        const filename = `Subjects_${selectedClasses}_${selectedSections}_${new Date().toISOString().slice(0, 10)}.csv`;

        // Get table data
        let csv = [];
        const headers = [];
        $('#subjectsTable thead th').each(function () {
            headers.push($(this).text().replace(/\n/g, ' ').trim());
        });
        csv.push(headers.join(','));

        $('#subjectsTable tbody tr').each(function () {
            const row = [];
            $(this).find('td').each(function () {
                row.push($(this).text().replace(/,/g, ';').trim());
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
    });

    // Print functionality
    $('#printBtn').click(function () {
        const printContent = `
        <h3 class="text-center mb-4">Subjects Report</h3>
        <div class="d-flex justify-content-between mb-3">
            <div><strong>Generated on:</strong> ${new Date().toLocaleString()}</div>
            <div><strong>Generated by:</strong> ${$('meta[name="user-name"]').attr('content') || 'System'}</div>
        </div>
        <hr>
        <table class="table table-bordered">
            <thead class="table-light">
                <tr>
                    <th>#</th>
                    <th>Code</th>
                    <th>Subject Name</th>
                    <th>Class</th>
                    <th>Section</th>
                </tr>
            </thead>
            <tbody>
                ${$('#subjectsTableBody tr').map(function () {
            return `
                        <tr>
                            <td>${$(this).find('td:eq(0)').text()}</td>
                            <td>${$(this).find('td:eq(1)').text()}</td>
                            <td>${$(this).find('td:eq(2)').text()}</td>
                            <td>${$(this).find('td:eq(3)').text()}</td>
                            <td>${$(this).find('td:eq(4)').text()}</td>
                        </tr>
                    `;
        }).get().join('')}
            </tbody>
        </table>
        <div class="text-end mt-4">
            <p class="mb-1">Total Subjects: ${$('#subjectsTableBody tr').length}</p>
            <p class="text-muted small">Printed from Class Management System</p>
        </div>
    `;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
        <html>
            <head>
                <title>Subjects Report</title>
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
                <style>
                    @media print {
                        body { padding: 20px !important; }
                        .no-print { display: none !important; }
                        table { font-size: 0.85rem; }
                    }
                    @page { size: auto; margin: 10mm; }
                </style>
            </head>
            <body class="p-3">
                ${printContent}
                <script>
                    window.onload = function() {
                        setTimeout(function() {
                            window.print();
                            window.close();
                        }, 200);
                    }
                <\/script>
            </body>
        </html>
    `);
        printWindow.document.close();
    });

    // Initialize tooltips
    $('[data-bs-toggle="tooltip"]').tooltip();
});
