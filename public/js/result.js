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

async function downloadIndividualMarksheet(response) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Constants
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const logoSize = 20;
  let yPos = 10;

  // Styles
  const styles = {
    header1: { fontSize: 18, fontStyle: "bold", lineHeight: 1.2 },
    header2: { fontSize: 14, fontStyle: "bold", lineHeight: 1.2 },
    normal: { fontSize: 11, lineHeight: 1.2 },
    small: { fontSize: 9, lineHeight: 1.2 },
    tiny: { fontSize: 8, lineHeight: 1.1 }
  };

  // Colors
  const colors = {
    primary: [51, 51, 51],
    secondary: [70, 130, 180],
    accent: [220, 53, 69],
    lightBg: [240, 240, 240]
  };

  // Helper function to add text with optional styling
  const addText = (text, x, y, options = {}) => {
    const { fontSize = styles.normal.fontSize, fontStyle = 'normal', align = 'left', color = [0, 0, 0] } = options;
    doc.setFontSize(fontSize)
      .setFont("helvetica", fontStyle)
      .setTextColor(...color)
      .text(text, x, y, { align });
  };
  yPos += 5;
  // Load images with error handling
  const loadImages = async () => {
    try {
      // School Logo
      let schoolLogoPath = response.school?.logo;
      if (schoolLogoPath && !schoolLogoPath.startsWith('http')) {
        schoolLogoPath = `http://localhost:5001/uploads/school/${schoolLogoPath.split('/').pop()}`;
      }

      // Student Photo
      let studentImagePath = response.student?.image;
      if (studentImagePath && !studentImagePath.startsWith('http')) {
        studentImagePath = `http://localhost:5001/uploads/students/${studentImagePath.split('/').pop()}`;
      }

      const [schoolLogoImg, studentImg] = await Promise.all([
        schoolLogoPath ? loadImage(schoolLogoPath).catch(() => null) : null,
        studentImagePath ? loadImage(studentImagePath).catch(() => null) : null
      ]);

      return { schoolLogoImg, studentImg };
    } catch (error) {
      console.error("Error loading images:", error);
      return { schoolLogoImg: null, studentImg: null };
    }
  };

  const { schoolLogoImg, studentImg } = await loadImages();

  // Header Section
  if (schoolLogoImg) {
    doc.addImage(schoolLogoImg, 'JPEG', margin, yPos, logoSize, logoSize);
  }

  // School Information (Dynamic)
  addText(response.school.name.toUpperCase(), pageWidth / 2, yPos + 10, {
    fontSize: styles.header1.fontSize,
    fontStyle: 'bold',
    align: 'center'
  });

  addText(response.school.address, pageWidth / 2, yPos + 16, {
    align: 'center',
    fontSize: styles.small.fontSize
  });

  // Add accreditation/affiliation if available 
  if (response.school.affiliation) {
    addText(`Affiliated to: ${response.school.affiliation}`, pageWidth / 2, yPos + 21, {
      align: 'center',
      fontSize: styles.small.fontSize,
      fontStyle: 'italic'
    });
  }

  // Student Photo 
  if (studentImg) {
    doc.addImage(studentImg, 'JPEG', pageWidth - margin - logoSize, yPos, logoSize, logoSize);
  }

  yPos += 30;

  // Marksheet Title (Dynamic with static text)
  addText("ACADEMIC REPORT CARD", pageWidth / 2, yPos, {
    fontSize: styles.header2.fontSize,
    fontStyle: 'bold',
    align: 'center',
    color: colors.secondary
  });

  addText(`Academic Year: ${response.student.academicYear} | ${response.exam.name} Examination`, pageWidth / 2, yPos + 6, {
    fontSize: styles.small.fontSize,
    align: 'center',
    fontStyle: 'italic'
  });

  yPos += 15;

  // Student Information Table (Dynamic)
  const studentInfo = [
    { label: "Admission No", value: response.student.admissionNo },
    { label: "Date of Birth", value: response.student.dob ? new Date(response.student.dob).toLocaleDateString() : "N/A" },
    { label: "Student Name", value: response.student.name },
    { label: "Class", value: `${response.student.class} (${response.student.section})` },
  ];

  // Create a table-like layout for student info
  const infoCol1Width = 40;
  const infoCol2Width = 40;
  const infoRowHeight = 8;

  studentInfo.forEach((info, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = margin + (col * (infoCol1Width + infoCol2Width + 6));
    const y = yPos + (row * infoRowHeight);

    addText(info.label + ":", x, y, { fontStyle: 'bold' });
    addText(info.value, x + infoCol1Width, y);
  });

  yPos += 20;

  // Subjects Table with Max Marks 
  const columns = [
    { header: "Subject", dataKey: "subject", width: 35 },
    { header: "Code", dataKey: "code", width: 35 },
    { header: "Theory", dataKey: "theory", width: 20 },
    { header: "Practical", dataKey: "practical", width: 25 },
    { header: "Total", dataKey: "total", width: 20 },
    { header: "Grade", dataKey: "grade", width: 20 },
    { header: "Remarks", dataKey: "remarks", width: 25 }
  ];

  const rows = response.subjects.map(subject => ({
    subject: subject.name,
    code: subject.code,
    theory: subject.marks || "-",
    practical: subject.practicalMarks || "-",
    total: subject.totalMarks,
    grade: subject.grade,
    remarks: subject.remarks || ""
  }));

  // Add table with alternating row colors
  doc.autoTable({
    startY: yPos,
    head: [columns.map(col => col.header)],
    body: rows.map(row => columns.map(col => row[col.dataKey])),
    theme: "grid",
    styles: {
      fontSize: styles.small.fontSize,
      cellPadding: 3,
      overflow: "linebreak",
      valign: "middle"
    },
    headStyles: {
      fillColor: colors.primary,
      textColor: 255,
      fontStyle: "bold",
      halign: "center"
    },
    bodyStyles: {
      halign: "center"
    },
    alternateRowStyles: {
      fillColor: colors.lightBg
    },
    columnStyles: columns.reduce((acc, col, index) => {
      acc[index] = { cellWidth: col.width };
      if (index === 0) acc[index].halign = "left";
      return acc;
    }, {}),
    margin: { left: margin, right: margin },
    didDrawCell: (data) => {
      // Highlight failed subjects
      if (data.column.dataKey === "remarks" && data.cell.raw.toLowerCase().includes("fail")) {
        doc.setTextColor(colors.accent);
      }
    }
  });

  // Summary Section (Dynamic with static labels)
  const summaryY = doc.lastAutoTable.finalY + 10;
  const summaryData = [
    { label: "Total Marks:", value: response.summary.totalMarks },
    { label: "Percentage:", value: `${response.summary.overallPercentage}%` },
    { label: "CGPA:", value: response.summary.cgpa },
    { label: "Result Status:", value: response.summary.overallStatus }
  ];

  // Create a grid for summary information
  const summaryColWidth = 60;
  summaryData.forEach((item, index) => {
    const col = index % 3;
    const row = Math.floor(index / 3);
    const x = margin + (col * summaryColWidth);
    const y = summaryY + (row * 8);

    addText(item.label, x, y, { fontStyle: 'bold' });
    addText(item.value.toString(), x + 30, y);

    // Highlight result status
    if (item.label === "Result Status:") {
      const statusColor = item.value.toLowerCase() === "pass" ? [0, 128, 0] : colors.accent;
      addText(item.value, x + 35, y, { color: statusColor, fontStyle: 'bold' });
    }
  });


  const staticFieldsY = doc.lastAutoTable.finalY + 30;
  const fieldSpacing = 60;
  const signatureY = staticFieldsY + 15;

  // Checked By
  addText("Checked By:", margin, signatureY);
  doc.line(margin + 20, signatureY + 1, margin + 70, signatureY + 1);
  addText("(Subject Teacher)", margin, signatureY + 5, { fontSize: styles.tiny.fontSize });

  // Class Teacher
  addText("Class Teacher:", margin + fieldSpacing, signatureY);
  doc.line(margin + fieldSpacing + 25, signatureY + 1, margin + fieldSpacing + 75, signatureY + 1);
  addText("(Signature)", margin + fieldSpacing, signatureY + 5, { fontSize: styles.tiny.fontSize });

  // Principal
  addText("Principal:", margin + 2 * fieldSpacing, signatureY);
  doc.line(margin + 2 * fieldSpacing + 20, signatureY + 1, margin + 2 * fieldSpacing + 70, signatureY + 1);
  addText("(Seal & Signature)", margin + 2 * fieldSpacing, signatureY + 5, { fontSize: styles.tiny.fontSize });

  // Date
  const currentDate = new Date().toLocaleDateString();
  addText("Date:", pageWidth - margin - 50, signatureY);
  doc.line(pageWidth - margin - 40, signatureY + 1, pageWidth - margin, signatureY + 1);
  addText(currentDate, pageWidth - margin - 30, signatureY + 5, { fontSize: styles.tiny.fontSize });

  // Footer (Static with dynamic generation date)
  const footerY = pageHeight - 10;
  addText(`Generated on: ${new Date().toLocaleString()}`, margin, footerY, {
    fontSize: styles.tiny.fontSize,
    color: [100, 100, 100]
  });

  addText("This is a computer generated document. No signature required.", pageWidth / 2, footerY, {
    align: "center",
    fontSize: styles.tiny.fontSize,
    color: [100, 100, 100]
  });

  // Border (Static design element)
  doc.setDrawColor(150)
    .setLineWidth(0.5)
    .rect(margin - 5, margin - 5, pageWidth - margin * 2 + 10, pageHeight - margin * 2 + 10);

  // Watermark (Conditional static element)
  if (response.summary.overallStatus.toLowerCase() === "fail") {
    doc.setFontSize(60)
      .setTextColor(200, 0, 0, 20)
      .setFont("helvetica", "bold")
      .text("FAILED", pageWidth / 2, pageHeight / 2, {
        align: "center",
        angle: 45
      });
  }

  // Save PDF
  doc.save(`${response.student.name.replace(/ /g, "_")}_${response.exam.name.replace(/ /g, "_")}_Marksheet.pdf`);
}

// Helper function to load images
async function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.setAttribute('crossOrigin', 'anonymous');
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image from ${url}`));
    img.src = url;
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


