$(document).ready(function () {
  // Store result data separately for individual and class
  let currentIndividualResult = null;
  let currentClassResults = null;
  let isLoading = false;

  // Individual Student Result Search
  $('#searchStudentBtn').click(function () {
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
      success: function (response) {
        currentIndividualResult = response;
        displayStudentResult(response);
      },
      error: function (xhr) {
        alert('Error fetching student result: ' + (xhr.responseJSON?.error || 'Server error'));
      },
      complete: function () {
        isLoading = false;
        $('#searchStudentBtn').html('Search');
      }
    });
  });


  $('#classIdSelect').change(function () {
    const classId = $(this).val();
    const $sectionSelect = $('#sectionIdSelect');
    $sectionSelect.empty().append('<option value="">All Sections</option>');

    if (classId) {
      $sectionSelect.prop('disabled', false);

      console.log('Sending classId:', classId);

      $.ajax({
        url: `/results/api/sections-by-class?class_id=${classId}`,
        method: 'GET',
        success: function (response) {
          if (response && response.length > 0) {
            let options = '<option value="">All Sections</option>';
            response.forEach(section => {
              options += `<option value="${section.id}">${section.section_name}</option>`;
            });
            $sectionSelect.html(options).prop('disabled', false);
          } else {
            $sectionSelect.html('<option value="">No sections found</option>').prop('disabled', true);
          }
        },
        error: function (xhr) {
          console.error('AJAX error:', xhr.responseText);
          $sectionSelect.html('<option value="">Error loading sections</option>').prop('disabled', true);
        }
      });
    } else {
      $sectionSelect.prop('disabled', true);
    }
  });




  // Load Class Results
  $('#classResultForm').submit(function (e) {
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
        academicYear,
        examTypeId,
        classId: classId || '',
        sectionId: sectionId || ''
      },
      success: function (response) {
        currentClassResults = response;
        displayClassResults(response);
      },
      error: function (xhr) {
        alert('Error fetching class results: ' + (xhr.responseJSON?.error || 'Server error'));
      },
      complete: function () {
        isLoading = false;
        $('#classResultForm button[type="submit"]').html('<i class="fas fa-search me-1"></i>Search Results');
      }
    });
  });


  // Download PDF
  $(document).off('click', '#downloadClassResultsBtn').on('click', '#downloadClassResultsBtn', function () {
    if (!currentClassResults) {
      alert('No class results available to download');
      return;
    }
    downloadClassResultsPDF(currentClassResults);
  });

  // Download CSV
  $(document).off('click', '#downloadClassResultsCSV').on('click', '#downloadClassResultsCSV', function () {
    if (!currentClassResults) {
      alert('No class results available to download');
      return;
    }
    downloadClassResultsCSV(currentClassResults);
  });

  // Print
  $(document).on('click', '#printClassResultsBtn', function () {
    window.print();
  });
  // View individual student result
  $(document).on('click', '.view-individual-result', function () {
    const admissionNo = $(this).data('admissionno');
    const examTypeId = currentClassResults.exam.id;
    const academicYear = $('#classAcademicYear').val();

    $('#admissionNoInput').val(admissionNo);
    $('#examTypeSelect').val(examTypeId);
    $('#academicYearSelect').val(academicYear);
    $('#searchStudentBtn').click();
    $('#individual-tab').tab('show');
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
    const headers = ['S.N.', 'Student Name', 'Admission No', 'Total Marks', 'Percentage', 'CGPA', 'Status',];
    const rows = response.results.map((result, index) => [
      index + 1,
      result.student.name,
      result.student.admissionNo,
      result.summary.totalMarks,
      result.summary.overallPercentage + '%',
      result.summary.cgpa,
      result.summary.overallStatus,
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
    csvContent += "S.N.,Student Name,Admission No,Total Marks,Percentage,CGPA,Status\n";

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
  $(document).off('click', '#downloadIndividualResultBtn').on('click', '#downloadIndividualResultBtn', function () {
    if (!currentIndividualResult) {
      alert('No individual result data available to download');
      return;
    }
    downloadIndividualMarksheet(currentIndividualResult);
  });


  // Download All Individual Marksheets (ZIP)
  $(document).off('click', '#downloadAllMarksheetsBtn').on('click', '#downloadAllMarksheetsBtn', function () {
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
      zip.generateAsync({ type: 'blob' }).then(content => {
        saveAs(content, `${currentClassResults.class}_${currentClassResults.section}_Individual_Results.zip`);
        btn.html(originalHtml);
        btn.prop('disabled', false);
      });
    });
  });

  // Print Class Results
  $('#printClassResultsBtn').click(function () {
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


//individual Result PDF
async function downloadIndividualMarksheet(response) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    filters: ["ASCIIHexEncode"],
  });

  // Constants
  const pageWidth = 210; // A4 width
  const pageHeight = 297; // A4 height
  const margin = 15;
  const logoSize = 20;
  let yPos = 10;

  const styles = {
    header1: { fontSize: 18, fontStyle: "bold", lineHeight: 1.2 },
    header2: { fontSize: 14, fontStyle: "bold", lineHeight: 1.2 },
    normal: { fontSize: 11, lineHeight: 1.2 },
    small: { fontSize: 10, lineHeight: 1.2 },
  };

  // Normalize image paths
  let schoolLogoPath = response.school?.logo;
  if (schoolLogoPath && !schoolLogoPath.startsWith('http')) {
    schoolLogoPath = `http://localhost:5001/uploads/school/${schoolLogoPath.split('/').pop()}`;
  }

  let studentImagePath = response.student?.image;
  if (studentImagePath && !studentImagePath.startsWith('http')) {
    studentImagePath = `http://localhost:5001/uploads/students/${studentImagePath.split('/').pop()}`;
  }

  // Add images (school logo and student photo)
  try {
    if (schoolLogoPath) {
      const schoolLogoImg = await loadImage(schoolLogoPath);
      doc.addImage(schoolLogoImg, 'JPEG', margin, yPos + 5, logoSize, logoSize);
    }

    if (studentImagePath) {
      const studentImg = await loadImage(studentImagePath);
      doc.addImage(studentImg, 'JPEG', pageWidth - margin - logoSize, yPos + 5, logoSize, logoSize);
    }
  } catch (error) {
    console.error("Error loading images:", error);
  }

  // School information
  doc.setFont("helvetica", styles.header1.fontStyle)
    .setFontSize(styles.header1.fontSize)
    .text(response.school.name, pageWidth / 2, yPos + 10, { align: "center" })
    .setFontSize(styles.normal.fontSize)
    .text(response.school.address, pageWidth / 2, yPos + 16, { align: "center" });

  yPos += 30;

  // Marksheet title
  doc.setFontSize(styles.header2.fontSize)
    .setFont("helvetica", "bold")
    .text("ACADEMIC REPORT CARD", pageWidth / 2, yPos, { align: "center" })
    .setFontSize(styles.small.fontSize)
    .setFont("helvetica", "italic")
    .text(`Academic Year: ${response.academicYear} | ${response.exam.name}`, pageWidth / 2, yPos + 6, { align: "center" });

  yPos += 15;

  // Student info
  const studentInfo = [
    { label: "Student Name", value: response.student.name },
    { label: "Admission No", value: response.student.admissionNo },
    { label: "Class", value: `${response.student.class} (${response.student.section})` },
    { label: "Roll Number", value: response.student.rollNumber || "N/A" },
  ];

  studentInfo.forEach((info, index) => {
    const x = index < 2 ? margin : pageWidth / 2;
    const lineY = yPos + (index % 2) * 8;

    doc.setFont("helvetica", "bold")
      .setFontSize(styles.normal.fontSize)
      .text(`${info.label}:`, x, lineY)
      .setFont("helvetica", "normal")
      .text(info.value, x + 30, lineY);
  });

  yPos += 20;

  // Subject table
  const columns = [
    { header: "Subject", dataKey: "subject" },
    { header: "Code", dataKey: "code" },
    { header: "Theory", dataKey: "theory" },
    { header: "Practical", dataKey: "practical" },
    { header: "Total", dataKey: "total" },
    { header: "Grade", dataKey: "grade" },
    { header: "Status", dataKey: "status" },
  ];

  const rows = response.subjects.map(subject => ({
    subject: subject.name,
    code: subject.code,
    theory: subject.theoryMarks || "-",
    practical: subject.practicalMarks || "-",
    total: subject.marks,
    grade: subject.grade,
    status: subject.status,
  }));

  doc.autoTable({
    startY: yPos,
    head: [columns.map(col => col.header)],
    body: rows.map(row => columns.map(col => row[col.dataKey])),
    theme: "grid",
    styles: {
      fontSize: styles.small.fontSize,
      cellPadding: 2,
      overflow: "linebreak",
    },
    headerStyles: {
      fillColor: [51, 51, 51],
      textColor: 255,
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: 45 },
      1: { cellWidth: 20 },
      2: { cellWidth: 20 },
      3: { cellWidth: 25 },
      4: { cellWidth: 20 },
      5: { cellWidth: 15 },
      6: { cellWidth: 20 },
    },
    margin: { left: margin, right: margin },
  });

  // Summary section
  const summaryY = doc.lastAutoTable.finalY + 10;
  const summaryData = [
    { label: "Total Marks Obtained:", value: response.summary.totalMarks },
    { label: "Percentage:", value: `${response.summary.overallPercentage}%` },
    { label: "CGPA:", value: response.summary.cgpa },
    { label: "Result Status:", value: response.summary.overallStatus },
  ];

  summaryData.forEach((item, index) => {
    const x = index % 2 === 0 ? margin : pageWidth / 2;
    const y = summaryY + Math.floor(index / 2) * 10;

    doc.setFont("helvetica", "bold")
      .setFontSize(styles.normal.fontSize)
      .text(item.label, x, y)
      .setFont("helvetica", "normal")
      .text(item.value.toString(), x + 35, y);
  });

  // Footer
  const footerY = pageHeight - 15;
  doc.setFontSize(styles.small.fontSize)
    .setTextColor(100)
    .text("Generated on: " + new Date().toLocaleDateString(), margin, footerY)
    .text("Official School Stamp", pageWidth - margin - 40, footerY, {
      align: "right",
    });

  // Border
  doc.setDrawColor(200)
    .rect(margin - 5, margin - 5, pageWidth - margin * 2 + 10, pageHeight - margin * 2 + 10);

  // Save PDF
  doc.save(`${response.student.name.replace(/ /g, "_")}_Marksheet.pdf`);
}

// Image loader
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}


//Class Result PDF

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


