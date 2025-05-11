$(document).ready(function () {
  // Store result data separately for individual and class
  let currentIndividualResult = null;
  let currentClassResults = null;
  let isLoading = false;

  // Individual Student Result Search
  $('#searchStudentBtn').click(function() {
    if (isLoading) return;
    
    const admissionNo = $('#admissionNoInput').val();
    const examTypeId = $('#examTypeSelect').val();
    const academicYear = $('#academicYearSelect').val();

    if (!admissionNo || !examTypeId || !academicYear) {
      alert('Please fill all required fields');
      return;
    }

    isLoading = true;
    $('#searchStudentBtn').html('<i class="fas fa-spinner fa-spin"></i> Searching...');
    
    $.ajax({
      url: '/results/api/student-result',
      method: 'GET',
      data: {
        admissionNo: admissionNo,
        examTypeId: examTypeId,
        academicYear: academicYear
      },
      success: function(response) {
        currentIndividualResult = response;
        displayStudentResult(response);
      },
      error: function(xhr) {
        alert('Error fetching student result: ' + (xhr.responseJSON?.error || 'Server error'));
      },
      complete: function() {
        isLoading = false;
        $('#searchStudentBtn').html('Search');
      }
    });
  });

  $(document).ready(function () {
    let currentClassResults = null;
    let isLoading = false;
  
    // Class Results Section Handling
    $('#classIdSelect').change(function () {
      const classId = $(this).val();
      $('#sectionIdSelect').empty().append('<option value="">All Sections</option>');
  
      if (classId) {
        $('#sectionIdSelect').prop('disabled', false);
        $.ajax({
          url: '/exams/api/sections-by-class',
          method: 'GET',
          data: { class_id: classId },
          success: function (sections) {
            sections.forEach(section => {
              $('#sectionIdSelect').append(`<option value="${section.id}">${section.section_name}</option>`);
            });
          }
        });
      } else {
        $('#sectionIdSelect').prop('disabled', true);
      }
    });
  
    // Load Class Results
    $('#classResultForm').submit(function(e) {
      e.preventDefault();
      if (isLoading) return;
      
      const academicYear = $('#classAcademicYear').val();
      const examTypeId = $('#classExamType').val();
      const classId = $('#classIdSelect').val();
      const sectionId = $('#sectionIdSelect').val();
  
      if (!academicYear || !examTypeId) {
        alert('Please select at least academic year and exam type');
        return;
      }
  
      isLoading = true;
      $('#classResultForm button[type="submit"]').html('<i class="fas fa-spinner fa-spin"></i> Loading...');
      
      $.ajax({
        url: '/results/api/class-results',
        method: 'GET',
        data: {
          academicYear: academicYear,
          examTypeId: examTypeId,
          classId: classId || '',
          sectionId: sectionId || ''
        },
        success: function(response) {
          currentClassResults = response;
          displayClassResults(response);
        },
        error: function(xhr) {
          alert('Error fetching class results: ' + (xhr.responseJSON?.error || 'Server error'));
        },
        complete: function() {
          isLoading = false;
          $('#classResultForm button[type="submit"]').html('<i class="fas fa-search me-1"></i>Search Results');
        }
      });
    });
  
    // Download Class Results as PDF
    $(document).on('click', '#downloadClassResultsBtn', function() {
      if (!currentClassResults) {
        alert('No class results available to download');
        return;
      }
      downloadClassResultsPDF(currentClassResults);
    });
  
    // Download Class Results as CSV
    $(document).on('click', '#downloadClassResultsCSV', function() {
      if (!currentClassResults) {
        alert('No class results available to download');
        return;
      }
      downloadClassResultsCSV(currentClassResults);
    });
  
    // Print Class Results
    $(document).on('click', '#printClassResultsBtn', function() {
      window.print();
    });
  
    // View Individual Result from Class Results
    $(document).on('click', '.view-individual-result', function() {
      const admissionNo = $(this).data('admissionno');
      const examTypeId = currentClassResults.exam.id;
      const academicYear = $('#classAcademicYear').val();
      
      $('#admissionNoInput').val(admissionNo);
      $('#examTypeSelect').val(examTypeId);
      $('#academicYearSelect').val(academicYear);
      $('#searchStudentBtn').click();
      $('#individual-tab').tab('show');
    });
  });
  
  // Display Class Results
  function displayClassResults(response) {
    const container = $('#classResultsContainer');
    const table = $('#classResultsTable tbody');
    
    // Update header info
    $('#classExamName').text(response.exam.name);
    $('#className').text(response.class);
    $('#sectionName').text(response.section);
    $('#classResultsHeader').text(`${response.class} ${response.section ? `- ${response.section}` : ''} Results`);
  
    // Clear and populate results
    table.empty();
    response.results.forEach((result, index) => {
      const row = `
        <tr>
          <td>${index + 1}</td>
          <td>${result.student.name}</td>
          <td>${result.student.admissionNo}</td>
          <td>${result.summary.totalMarks}</td>
          <td>${result.summary.overallPercentage}%</td>
          <td>${result.summary.cgpa}</td>
          <td><span class="badge ${result.summary.overallStatus === 'Pass' ? 'bg-success' : 'bg-danger'}">${result.summary.overallStatus}</span></td>
          <td>
            <button class="btn btn-sm btn-primary view-individual-result" data-admissionno="${result.student.admissionNo}">
              <i class="fas fa-eye"></i> View
            </button>
          </td>
        </tr>`;
      table.append(row);
    });
  
    // Show the container
    container.removeClass('d-none');
  }
  
  // Download Class Results as PDF
  function downloadClassResultsPDF(response) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  
    // Header
    doc.setFontSize(18).setFont('helvetica', 'bold');
    doc.text('SCHOOL NAME', 148, 15, { align: 'center' });
    doc.setFontSize(14).setFont('helvetica', 'normal');
    doc.text('CLASS RESULTS', 148, 22, { align: 'center' });
    doc.text(`${response.class} - ${response.section} | ${response.exam.name}`, 148, 28, { align: 'center' });
  
    // Prepare table data
    const headers = ['S.N.', 'Student Name', 'Admission No', 'Total Marks', 'Percentage', 'CGPA', 'Status', 'Percentile'];
    const rows = response.results.map((result, index) => [
      index + 1,
      result.student.name,
      result.student.admissionNo,
      result.summary.totalMarks,
      result.summary.overallPercentage + '%',
      result.summary.cgpa,
      result.summary.overallStatus,
      result.summary.percentile + '%'
    ]);
  
    // Create table
    doc.autoTable({
      startY: 35,
      head: [headers],
      body: rows,
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
      margin: { left: 10 }
    });
  
    // Footer
    doc.setFontSize(10)
       .text(`Generated on: ${new Date().toLocaleDateString()}`, 148, doc.lastAutoTable.finalY + 10, { align: 'center' });
  
    doc.save(`${response.class}_${response.section || 'AllSections'}_${response.exam.name.replace(/\s+/g, '_')}_Results.pdf`);
  }
  
  // Download Class Results as CSV
  function downloadClassResultsCSV(response) {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Headers
    csvContent += "S.N.,Student Name,Admission No,Total Marks,Percentage,CGPA,Status,Percentile\n";
    
    // Data rows
    response.results.forEach((result, index) => {
      csvContent += [
        index + 1,
        `"${result.student.name}"`,
        result.student.admissionNo,
        result.summary.totalMarks,
        result.summary.overallPercentage,
        result.summary.cgpa,
        result.summary.overallStatus,
        result.summary.percentile
      ].join(",") + "\n";
    });
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${response.class}_${response.section || 'AllSections'}_${response.exam.name.replace(/\s+/g, '_')}_Results.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Download Individual Result
  $(document).on('click', '#downloadIndividualResultBtn', function() {
    if (!currentIndividualResult) {
      alert('No individual result data available to download');
      return;
    }
    downloadIndividualMarksheet(currentIndividualResult);
  });

  // Download Class Results (Single PDF)
  $(document).on('click', '#downloadClassResultsBtn', function() {
    if (!currentClassResults) {
      alert('No class results available to download');
      return;
    }
    downloadClassResultsPDF(currentClassResults);
  });

  // Download All Individual Marksheets (ZIP)
  $(document).on('click', '#downloadAllMarksheetsBtn', function() {
    if (!currentClassResults) {
      alert('No class results available to download');
      return;
    }
    
    // Show processing message
    const btn = $(this);
    const originalHtml = btn.html();
    btn.html('<i class="fas fa-spinner fa-spin"></i> Preparing...');
    btn.prop('disabled', true);
    
    // Create zip file with all marksheets
    const zip = new JSZip();
    const folder = zip.folder(`${currentClassResults.class}_${currentClassResults.section}_Results`);
    
    // Process each student result
    const promises = currentClassResults.results.map(result => {
      return generateIndividualMarksheetPDF(result).output('blob').then(blob => {
        const filename = `${result.student.name.replace(/\s+/g, '_')}_Result.pdf`;
        folder.file(filename, blob);
      });
    });
    
    
    // Generate and download zip
    Promise.all(promises).then(() => {
      zip.generateAsync({type: 'blob'}).then(content => {
        saveAs(content, `${currentClassResults.class}_${currentClassResults.section}_Individual_Results.zip`);
        btn.html(originalHtml);
        btn.prop('disabled', false);
      });
    });
  });

  // Print Class Results
  $('#printClassResultsBtn').click(function() {
    window.print();
  });
});

// Display Individual Student Result
function displayStudentResult(response) {
  const container = $('#studentResultContainer');
  const subjectsTable = $('#studentSubjectsTable');
  
  // Update student information
  $('#studentName').text(response.student.name);
  $('#studentAdmissionNo').text(response.student.admissionNo);
  $('#studentClass').text(response.student.class);
  $('#studentSection').text(response.student.section);
  $('#studentExam').text(response.exam.name);

  // Clear and populate subjects
  subjectsTable.empty();
  response.subjects.forEach(subject => {
    const row = `
      <tr>
        <td>${subject.name}</td>
        <td>${subject.code}</td>
        <td>${subject.fullMarks}</td>
        <td>${subject.passMarks}</td>
        <td>${subject.marks}</td>
        <td>${subject.percentage}%</td>
        <td>${subject.grade}</td>
        <td><span class="badge ${subject.status === 'Pass' ? 'bg-success' : 'bg-danger'}">${subject.status}</span></td>
      </tr>`;
    subjectsTable.append(row);
  });

  // Update summary
  $('#totalMarks').text(response.summary.totalMarks);
  $('#overallPercentage').text(response.summary.overallPercentage);
  $('#cgpa').text(response.summary.cgpa);
  $('#overallStatus')
    .text(response.summary.overallStatus)
    .removeClass('bg-success bg-danger')
    .addClass(response.summary.overallStatus === 'Pass' ? 'bg-success' : 'bg-danger');

  // Show the container
  container.removeClass('d-none');
}

// Display Class Results
function displayClassResults(response) {
  const container = $('#classResultsContainer');
  const table = $('#classResultsTable');
  const thead = table.find('thead');
  const tbody = table.find('tbody');
  const header = $('#classResultsHeader');

  // Clear existing content
  thead.find('th.subject-header').remove();
  tbody.empty();

  // Set header
  header.html(`${response.class} - ${response.section} | ${response.exam.name} Results`);

  // Add subject columns if results exist
  if (response.results.length > 0 && response.results[0].subjects) {
    const headerRow1 = thead.find('tr:first');
    const headerRow2 = thead.find('tr:eq(1)');
    
    response.results[0].subjects.forEach(subj => {
      headerRow1.append(`<th colspan="2" class="subject-header">${subj.name}</th>`);
      headerRow2.append(`<th class="subject-header">Marks</th>`);
      headerRow2.append(`<th class="subject-header">Grade</th>`);
    });
  }

  // Populate student rows
  response.results.forEach((result, index) => {
    const row = `
      <tr>
        <td>${index + 1}</td>
        <td>${result.student.name}</td>
        <td>${result.student.admissionNo}</td>
        <td>${result.summary.totalMarks}</td>
        <td>${result.summary.cgpa}</td>
        <td><span class="badge ${result.summary.overallStatus === 'Pass' ? 'bg-success' : 'bg-danger'}">${result.summary.overallStatus}</span></td>
        ${result.subjects.map(subj => `
          <td>${subj.marks}/${subj.fullMarks}</td>
          <td>${subj.grade}</td>
        `).join('')}
      </tr>`;
    tbody.append(row);
  });

  container.removeClass('d-none');
}

// PDF Generation Functions
function generateIndividualMarksheetPDF(response) {
  const jsPDFLib = window.jspdf;
    if (!jsPDFLib) {
      alert("jsPDF is not loaded. Please check your script tags.");
      return;
    }
  
    const { jsPDF } = jsPDFLib;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  
  // Header
  doc.setFontSize(18).setFont('helvetica', 'bold');
  doc.text('SCHOOL/COLLEGE NAME', 105, 15, { align: 'center' });
  doc.setFontSize(14).setFont('helvetica', 'normal');
  doc.text('Address Line 1, City - PINCODE', 105, 22, { align: 'center' });
  doc.setFontSize(16).setFont('helvetica', 'bold');
  doc.text('ACADEMIC REPORT CARD', 105, 32, { align: 'center' });

  // Student Info
  doc.setFontSize(12);
  doc.text(`Name: ${response.student.name}`, 20, 45);
  doc.text(`Admission No: ${response.student.admissionNo}`, 20, 52);
  doc.text(`Class: ${response.student.class} (${response.student.section})`, 120, 45);
  doc.text(`Exam: ${response.exam.name}`, 120, 52);

  // Subjects Table
  doc.autoTable({
    startY: 60,
    head: [['Subject', 'Code', 'Full Marks', 'Pass Marks', 'Obtained', 'Percentage', 'Grade', 'Status']],
    body: response.subjects.map(subject => [
      subject.name, subject.code, subject.fullMarks, subject.passMarks, 
      subject.marks, `${subject.percentage}%`, subject.grade, subject.status
    ]),
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
    margin: { left: 15 }
  });

  // Summary and Footer
  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFont('helvetica', 'bold').text('Result Summary:', 20, finalY);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Marks: ${response.summary.totalMarks}`, 20, finalY + 8);
  doc.text(`Percentage: ${response.summary.overallPercentage}%`, 20, finalY + 16);
  doc.text(`CGPA: ${response.summary.cgpa}`, 120, finalY + 8);
  doc.setFont('helvetica', 'bold')
     .setTextColor(response.summary.overallStatus === 'Pass' ? [39, 174, 96] : [231, 76, 60])
     .text(`Status: ${response.summary.overallStatus}`, 120, finalY + 16);
  doc.setTextColor(0, 0, 0)
     .setFontSize(10)
     .text('Principal\'s Signature', 40, finalY + 30)
     .text('Class Teacher\'s Signature', 140, finalY + 30)
     .text(`Date: ${new Date().toLocaleDateString()}`, 105, finalY + 40, { align: 'center' });

  return doc;
}

function downloadIndividualMarksheet(response) {
  const jsPDFLib = window.jspdf;
  if (!jsPDFLib) {
    alert("jsPDF is not loaded. Please check your script tags.");
    return;
  }

  const { jsPDF } = jsPDFLib;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Header
  doc.setFontSize(18).setFont('helvetica', 'bold');
  doc.text('IT Home Nepal', 105, 15, { align: 'center' });
  doc.setFontSize(14).setFont('helvetica', 'normal');
  doc.text('New-Baneshwor, Kathmandu', 105, 22, { align: 'center' });
  doc.setFontSize(16).setFont('helvetica', 'bold');
  doc.text('ACADEMIC REPORT CARD', 105, 32, { align: 'center' });

  // Student Info
  doc.setFontSize(12);
  doc.text(`Name: ${response.student.name}`, 20, 45);
  doc.text(`Admission No: ${response.student.admissionNo}`, 20, 52);
  doc.text(`Class: ${response.student.class} (${response.student.section})`, 120, 45);
  doc.text(`Exam: ${response.exam.name}`, 120, 52);

  // Subjects Table
  const subjectData = response.subjects.map(subject => [
    subject.name,
    subject.code,
    subject.fullMarks,
    subject.passMarks,
    subject.marks,
    `${subject.percentage}%`,
    subject.grade,
    subject.status
  ]);

  doc.autoTable({
    startY: 60,
    head: [['Subject', 'Code', 'Full Marks', 'Pass Marks', 'Obtained Marks', 'Percentage', 'Grade', 'Status']],
    body: subjectData,
    styles: { fontSize: 10 },
  });

  // Summary
  let finalY = doc.lastAutoTable.finalY || 100;
  doc.setFontSize(12).setFont('helvetica', 'bold');
  doc.text(`Total Marks: ${response.summary.totalMarks}`, 20, finalY + 10);
  doc.text(`Percentage: ${response.summary.overallPercentage}%`, 20, finalY + 18);
  doc.text(`CGPA: ${response.summary.cgpa}`, 120, finalY + 10);
  doc.text(`Result: ${response.summary.overallStatus}`, 120, finalY + 18);

  // Save file
  const filename = `${response.student.name.replace(/\s+/g, '_')}_Marksheet.pdf`;
  doc.save(filename);
}

function downloadClassResultsPDF(response) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Header
  doc.setFontSize(18).setFont('helvetica', 'bold');
  doc.text('SCHOOL/COLLEGE NAME', 148, 15, { align: 'center' });
  doc.setFontSize(14).setFont('helvetica', 'normal');
  doc.text('CLASS RESULTS', 148, 22, { align: 'center' });
  doc.text(`${response.class} - ${response.section} | ${response.exam.name}`, 148, 28, { align: 'center' });

  // Prepare table data
  const headers = ['S.N.', 'Student Name', 'Admission No', 'Total Marks', 'CGPA', 'Status'];
  if (response.results.length > 0) {
    response.results[0].subjects.forEach(subj => {
      headers.push(subj.name, 'Grade');
    });
  }

  const rows = response.results.map((result, index) => {
    const row = [
      index + 1,
      result.student.name,
      result.student.admissionNo,
      result.summary.totalMarks,
      result.summary.cgpa,
      result.summary.overallStatus
    ];
    result.subjects.forEach(subj => {
      row.push(`${subj.marks}/${subj.fullMarks}`, subj.grade);
    });
    return row;
  });

  // Create table
  doc.autoTable({
    startY: 35,
    head: [headers],
    body: rows,
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
    margin: { left: 10 }
  });

  // Footer
  doc.setFontSize(10)
     .text(`Generated on: ${new Date().toLocaleDateString()}`, 148, doc.lastAutoTable.finalY + 10, { align: 'center' });

  doc.save(`${response.class}_${response.section}_${response.exam.name.replace(/\s+/g, '_')}_Results.pdf`);
}


