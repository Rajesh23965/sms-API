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

  //view button click handler
  $(document).on('click', '.view-individual-result', function () {
    const admissionNo = $(this).data('admissionno');
    const studentResult = currentClassResults.results.find(r =>
      r.student.admissionNo === admissionNo
    );

    if (studentResult) {
      displayMarksheetInModal(studentResult);
      $('#marksheetModal').modal('show');
    }
  });

  // Popup Marksheet

  function displayMarksheetInModal(response) {
    const marksheetPreview = $('#marksheetPreview');
    marksheetPreview.empty();

    // Create the marksheet HTML structure
    const marksheetHTML = `
    <div class="marksheet-border">
      <!-- Header Section -->
      <div class="marksheet-header">
        ${response.school.logo ?
        `<img src="${response.school.logo.startsWith('http') ? response.school.logo :
          'http://localhost:5001/uploads/school/' + response.school.logo.split('/').pop()}" 
            style="height: 60px; float: left; margin-right: 15px;">` : ''
      }
        
        <div class="school-name">${response.school.name.toUpperCase()}</div>
        <div class="school-address">${response.school.address}</div>
        ${response.school.affiliation ?
        `<div class="school-affiliation" style="font-style: italic; font-size: 0.8rem;">
            Affiliated to: ${response.school.affiliation}
          </div>` : ''
      }
        
        ${response.student.image ?
        `<img src="${response.student.image.startsWith('http') ? response.student.image :
          'http://localhost:5001/uploads/students/' + response.student.image.split('/').pop()}" 
            style="height: 60px; float: right;">` : ''
      }
        
        <div style="clear: both;"></div>
        
        <div class="marksheet-title">ACADEMIC REPORT CARD</div>
        <div style="font-size: 0.9rem; font-style: italic;">
          Academic Year: ${response.student.academicYear} | ${response.exam.name} Examination
        </div>
      </div>
      
      <!-- Student Information -->
      <div class="student-info-grid">
        <div><span class="info-label">Admission No:</span> ${response.student.admissionNo}</div>
        <div><span class="info-label">Date of Birth:</span> ${response.student.dob ? new Date(response.student.dob).toLocaleDateString() : 'N/A'}</div>
        <div><span class="info-label">Student Name:</span> ${response.student.name}</div>
        <div><span class="info-label">Class:</span> ${response.student.class} (${response.student.section})</div>
      </div>
      
      <!-- Subjects Table -->
      <table class="subject-table">
        <thead>
          <tr>
            <th>Subject</th>
            <th>Code</th>
            <th>Theory</th>
            <th>Practical</th>
            <th>Total</th>
            <th>Grade</th>
            <th>Remarks</th>
          </tr>
        </thead>
        <tbody>
          ${response.subjects.map(subject => `
            <tr>
              <td>${subject.name}</td>
              <td>${subject.code}</td>
              <td>${subject.marks || '-'}</td>
              <td>${subject.practicalMarks || '-'}</td>
              <td>${subject.totalMarks || '-'}</td>
              <td>${subject.grade || '-'}</td>
              <td class="${subject.status === 'Pass' ? 'text-pass' : 'text-fail'}">
                ${subject.status}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <!-- Summary Section -->
      <div class="summary-grid">
        <div><span class="info-label">Total Marks:</span> ${response.summary.totalMarks}</div>
        <div><span class="info-label">Percentage:</span> ${response.summary.overallPercentage}%</div>
        <div><span class="info-label">CGPA:</span> ${response.summary.cgpa}</div>
        <div><span class="info-label">Result Status:</span> 
          <span class="${response.summary.overallStatus === 'Pass' ? 'text-pass' : 'text-fail'}">
            ${response.summary.overallStatus}
          </span>
        </div>
      </div>




      <div class="text-bold font-bold">Note:</div>
      <div class="flex flex-col">
          <div>
            <div class="">Abs = Absent</div>
          </div>
          <div>
            <div class="">Exp = Expelled</div>
          </div>
          <div>
            <div class="">NQ = Not Qualified</div>
          </div>
          <div>
            <div class="">WH = Withheld</div>
          </div>
            <div>
            <div class="">F* = Fail in Practical</div>
          </div>
          <div>
            <div class="">F** = Fail in Theory & Practical</div>
          </div>
      </div>

      
      <!-- Signatures -->
      <div class="signature-grid">
        <div>
          <div>Checked By:</div>
          <div class="signature-line"></div>
          <div style="font-size: 0.8rem;">(Subject Teacher)</div>
        </div>
        <div>
          <div>Class Teacher:</div>
          <div class="signature-line"></div>
          <div style="font-size: 0.8rem;">(Signature)</div>
        </div>
        <div>
          <div>Principal:</div>
          <div class="signature-line"></div>
          <div style="font-size: 0.8rem;">(Seal & Signature)</div>
        </div>
        <div>
          <div>Date:</div>
          <div class="signature-line"></div>
          <div style="font-size: 0.8rem;">${new Date().toLocaleDateString()}</div>
        </div>
      </div>
      
      <!-- Footer -->
      <div class="footer-text">
        <div>Generated on: ${new Date().toLocaleString()}</div>
        <div>This is a computer generated document. No signature required.</div>
      </div>
    </div>
  `;

    marksheetPreview.html(marksheetHTML);

    // Set up download button
    $('#downloadMarksheetBtn').off('click').on('click', function () {
      downloadIndividualMarksheet(response);
    });
  }


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
    practical: subject.practicalMar || "-",
    total: subject.totalMarks || "-",
    grade: subject.grade || "-",
    remarks: subject.status || ""
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

  });



  const staticFieldsY = doc.lastAutoTable.finalY + 30;
  const baseX = margin;
  let currentY = staticFieldsY;
  const itemsPerRow = 2;
  // 1. Draw "Note:" Heading
  addText("Note:", baseX, currentY, { fontStyle: 'bold' });
  currentY += 7;

  const noteItem = [
    "Abs = Absent",
    "Exp = Expelled",
    "NQ = Not Qualified",
    "WH = Withheld",
    "F* = Fail in Practical",
    "F** = Fail in Theory & Practical",
  ];

  noteItem.forEach((label) => {
    addText(label, baseX + 1, currentY);
    currentY += 7;
  });



  const items = [
    {
      label: "Checked By:",
      lineOffset: 20,
      lineLength: 50,
      subLabel: "(Subject Teacher)",
    },
    {
      label: "Class Teacher:",
      lineOffset: 25,
      lineLength: 50,
      subLabel: "(Signature)",
    },
    {
      label: "Principal:",
      lineOffset: 20,
      lineLength: 50,
      subLabel: "(Seal & Signature)",
    },
    {
      label: "Date:",
      lineOffset: 10,
      lineLength: 50,
      subLabel: new Date().toLocaleDateString(),
    },
  ];

  items.forEach((item, index) => {
    const rowIndex = Math.floor(index / itemsPerRow);
    const colIndex = index % itemsPerRow;
    const fieldSpacing = 100;
    const colSpacing = fieldSpacing;
    const baseX = margin;
    const x = baseX + colIndex * colSpacing;
    const y = currentY + rowIndex * 15;

    addText(item.label, x, y);
    doc.line(x + item.lineOffset, y + 1, x + item.lineOffset + item.lineLength, y + 1);
    addText(item.subLabel, x, y + 5, { fontSize: styles.tiny.fontSize });
  });

  // Footer (Static with dynamic generation date)
  const footerY = pageHeight - 15;
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



  // Save PDF
  doc.save(`${response.student.name.replace(/ /g, "_")}_${response.exam.name.replace(/ /g, "_")}_Marksheet.pdf`);
}



// Class Result PDF
async function downloadClassResultsPDF(response) {
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
  // Process each student's result
  response.results.forEach((result, index) => {
    if (index > 0) doc.addPage();
    let yPos = 16;



    // School Logo
    if (result.school?.logo) {
      try {
        let logoPath = result.school.logo;
        if (!logoPath.startsWith('http')) {
          logoPath = `http://localhost:5001/uploads/school/${logoPath.split('/').pop()}`;
        }
        const img = new Image();
        img.src = logoPath;
        doc.addImage(img, 'JPEG', margin, yPos, logoSize, logoSize);
      } catch (e) {
        console.error("Error loading school logo:", e);
      }
    }

    // School Information
    addText(result.school?.name?.toUpperCase(), pageWidth / 2, yPos + 10, {
      fontSize: styles.header1.fontSize,
      fontStyle: 'bold',
      align: 'center'
    });

    addText(result.school?.address, pageWidth / 2, yPos + 16, {
      align: 'center',
      fontSize: styles.small.fontSize
    });

    if (result.school?.affiliation) {
      addText(`Affiliated to: ${result.school.affiliation}`, pageWidth / 2, yPos + 21, {
        align: 'center',
        fontSize: styles.small.fontSize,
        fontStyle: 'italic'
      });
    }

    // Student Photo
    if (result.student?.image) {
      try {
        let studentImgPath = result.student.image;
        if (!studentImgPath.startsWith('http')) {
          studentImgPath = `http://localhost:5001/uploads/students/${studentImgPath.split('/').pop()}`;
        }
        const img = new Image();
        img.src = studentImgPath;
        doc.addImage(img, 'JPEG', pageWidth - margin - logoSize, yPos, logoSize, logoSize);
      } catch (e) {
        console.error("Error loading student image:", e);
      }
    }

    yPos += 30;

    // Marksheet Title
    addText("ACADEMIC REPORT CARD", pageWidth / 2, yPos, {
      fontSize: styles.header2.fontSize,
      fontStyle: 'bold',
      align: 'center',
      color: colors.secondary
    });

    addText(`Academic Year: ${result.student?.academicYear} | ${result.exam?.name} Examination`, pageWidth / 2, yPos + 6, {
      fontSize: styles.small.fontSize,
      align: 'center',
      fontStyle: 'italic'
    });

    yPos += 15;

    // Student Information
    const studentInfo = [
      { label: "Admission No", value: result.student?.admissionNo || "N/A" },
      { label: "Date of Birth", value: result.student?.dob ? new Date(result.student.dob).toLocaleDateString() : "N/A" },
      { label: "Student Name", value: result.student?.name || "N/A" },
      { label: "Class", value: `${result.student?.class || "N/A"} (${result.student?.section || "N/A"})` },
    ];

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

    // Result Table (ORIGINAL TABLE STRUCTURE - NOT CHANGED)
    // const tableHeaders = [["S.N.", "Subject", "FM", "PM", "Prac", "Obt(W)", "Obt(P)", "Total", "%", "Grade", "Point", "Status"]];
    // const tableBody = result.subjects.map((s, i) => [
    //   i + 1,
    //   s.name,
    //   s.fullMarks,
    //   s.passMarks,
    //   s.practicalMarks || "-",
    //   s.marks || "-",
    //   s.practicalMar || "-",
    //   s.totalMarks || "-",
    //   s.percentage || "-",
    //   s.grade || "-",
    //   s.gradePoint || "-",
    //   s.status || "-"
    // ]);
    const tableHeaders = [
      { header: "Subject", dataKey: "subject", width: 35 },
      { header: "Code", dataKey: "code", width: 35 },
      { header: "Theory", dataKey: "theory", width: 20 },
      { header: "Practical", dataKey: "practical", width: 25 },
      { header: "Total", dataKey: "total", width: 20 },
      { header: "Grade", dataKey: "grade", width: 20 },
      { header: "Remarks", dataKey: "remarks", width: 25 }
    ];

    const tableBody = result.subjects.map((s) => [
      s.name,
      s.code,
      s.marks || "-",
      s.practicalMar || "-",
      s.totalMarks || "-",
      s.grade || "-",
      s.status || ""
    ])

    doc.autoTable({
      startY: yPos,
      head: [tableHeaders.map(col => col.header)],
      body: tableBody,
      margin: { left: margin, right: margin },
      styles: { fontSize: 8 },
      headStyles: {
        fillColor: colors.primary,
        textColor: 255,
        fontStyle: "bold",
        halign: "center"
      },
      theme: "grid",
      bodyStyles: {
        halign: "center"
      },
      alternateRowStyles: {
        fillColor: colors.lightBg
      },
      margin: { left: margin, right: margin },

    });

    // Summary Section (ORIGINAL STRUCTURE - NOT CHANGED)
    const summaryY = doc.lastAutoTable.finalY + 10;
    const summary = result.summary || {};
    const summaryData = [
      { label: "Total Marks", value: `${summary.totalMarks || "N/A"} / ${summary.totalFullMarks || "N/A"}` },
      { label: "Percentage", value: `${summary.overallPercentage || "N/A"}%` },
      { label: "CGPA", value: summary.cgpa || "N/A" },
      { label: "Result Status:", value: summary.overallStatus }

      // { label: "Result", value: summary.overallStatus || "N/A" },
      // { label: "Percentile", value: summary.percentile || "N/A" }
    ];
    const summaryColWidth = 60;
    summaryData.forEach((item, index) => {
      const col = index % 3;
      const row = Math.floor(index / 3);
      const x = margin + (col * summaryColWidth);
      const y = summaryY + (row * 8);

      addText(item.label, x, y, { fontStyle: 'bold' });
      addText(item.value.toString(), x + 30, y);

    });



    const staticFieldsY = doc.lastAutoTable.finalY + 30;
    const fieldSpacing = 100;
    const signatureY = staticFieldsY + 15;
    const baseX = margin;
    let currentY = staticFieldsY;
    const itemsPerRow = 2;
    const rowSpacing = 10;
    const colSpacing = fieldSpacing;

    let rowIndex = 0;
    let colIndex = 0;
    // 1. Draw "Note:" Heading
    addText("Note:", baseX, currentY, { fontStyle: 'bold' });
    currentY += 7;

    const noteItem = [
      "Abs = Absent",
      "Exp = Expelled",
      "NQ = Not Qualified",
      "WH = Withheld",
      "F* = Fail in Practical",
      "F** = Fail in Theory & Practical",
    ];

    noteItem.forEach((label) => {
      addText(label, baseX + 1, currentY);
      currentY += 7;
    });

    yPos += 30;
    // Signature Section
    const items = [
      {
        label: "Checked By:",
        lineOffset: 20,
        lineLength: 50,
        subLabel: "(Subject Teacher)",
      },
      {
        label: "Class Teacher:",
        lineOffset: 25,
        lineLength: 50,
        subLabel: "(Signature)",
      },
      {
        label: "Principal:",
        lineOffset: 20,
        lineLength: 50,
        subLabel: "(Seal & Signature)",
      },
      {
        label: "Date:",
        lineOffset: 10,
        lineLength: 50,
        subLabel: new Date().toLocaleDateString(),
      },
    ];

    items.forEach((item, index) => {
      const rowIndex = Math.floor(index / itemsPerRow);
      const colIndex = index % itemsPerRow;
      const fieldSpacing = 100;
      const colSpacing = fieldSpacing;
      const baseX = margin;
      const x = baseX + colIndex * colSpacing;
      const y = currentY + rowIndex * 15;

      addText(item.label, x, y);
      doc.line(x + item.lineOffset, y + 1, x + item.lineOffset + item.lineLength, y + 1);
      addText(item.subLabel, x, y + 5, { fontSize: styles.tiny.fontSize });
    });



    // Footer
    const footerY = pageHeight - 15;
    addText(`Generated on: ${new Date().toLocaleString()}`, margin, footerY, {
      fontSize: styles.tiny.fontSize,
      color: [100, 100, 100]
    });

    addText("This is a computer generated document. No signature required.", pageWidth / 2, footerY, {
      align: "center",
      fontSize: styles.tiny.fontSize,
      color: [100, 100, 100]
    });

    // Border
    doc.setDrawColor(150)
      .setLineWidth(0.5)
      .rect(margin - 5, margin - 5, pageWidth - margin * 2 + 10, pageHeight - margin * 2 + 10);
  });

  // Save PDF
  doc.save(`Class_${response.class}_Results.pdf`);
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
