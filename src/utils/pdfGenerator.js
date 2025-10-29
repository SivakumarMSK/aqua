import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Professional PDF styling constants
const PDF_STYLES = {
  // Font sizes
  TITLE: 18,
  SECTION_HEADER: 12,
  SUBSECTION_HEADER: 10,
  BODY_TEXT: 9,
  FOOTER: 8,
  
  // Colors (RGB)
  PRIMARY: [44, 62, 80],      // Dark blue
  SECONDARY: [52, 152, 219],  // Blue
  ACCENT: [46, 204, 113],     // Green
  TEXT_GRAY: [127, 140, 141], // Gray
  LIGHT_GRAY: [189, 195, 199], // Light gray
  
  // Spacing
  MARGIN: 20,
  SECTION_SPACING: 12,
  SUBSECTION_SPACING: 8,
  LINE_SPACING: 6
};

// Helper function to set consistent text styling
const setTextStyle = (doc, size, color, isBold = false) => {
  doc.setFontSize(size);
  doc.setTextColor(...color);
  // Use helvetica font family for better compatibility
  if (isBold) {
    doc.setFont('helvetica', 'bold');
  } else {
    doc.setFont('helvetica', 'normal');
  }
  // Set text rendering mode for better quality
  doc.setFontSize(size);
};

// Helper function to add section headers
const addSectionHeader = (doc, text, yPos, margin = PDF_STYLES.MARGIN) => {
  // Check if we need a new page for the header and content
  const pageHeight = doc.internal.pageSize.height;
  const remainingSpace = pageHeight - yPos - 50; // Reserve 50px for table content
  
  if (remainingSpace < 30) {
    doc.addPage();
    yPos = PDF_STYLES.MARGIN;
  }
  
  setTextStyle(doc, PDF_STYLES.SECTION_HEADER, PDF_STYLES.PRIMARY, true);
  doc.text(text, margin, yPos);
  return yPos + PDF_STYLES.SUBSECTION_SPACING;
};

// Helper function to add subsection headers
const addSubsectionHeader = (doc, text, yPos, margin = PDF_STYLES.MARGIN) => {
  // Check if we need a new page for the header and content
  const pageHeight = doc.internal.pageSize.height;
  const remainingSpace = pageHeight - yPos - 40; // Reserve 40px for table content
  
  if (remainingSpace < 25) {
    doc.addPage();
    yPos = PDF_STYLES.MARGIN;
  }
  
  setTextStyle(doc, PDF_STYLES.SUBSECTION_HEADER, PDF_STYLES.PRIMARY, true);
  doc.text(text, margin, yPos);
  return yPos + PDF_STYLES.LINE_SPACING;
};

// Helper function to add text with proper rendering
const addText = (doc, text, x, y, options = {}) => {
  const { fontSize = PDF_STYLES.BODY_TEXT, color = PDF_STYLES.PRIMARY, isBold = false } = options;
  setTextStyle(doc, fontSize, color, isBold);
  // Clean text to remove any problematic characters
  const cleanText = text.toString().replace(/[^\x20-\x7E]/g, '');
  doc.text(cleanText, x, y);
};

// Helper function to clean table data
const cleanTableData = (data) => {
  return data.map(row => 
    row.map(cell => 
      cell ? cell.toString().replace(/[^\x20-\x7E]/g, '') : ''
    )
  );
};

// Helper function to check if we need a new page for a table
const checkPageBreak = (doc, yPos, estimatedTableHeight = 30) => {
  const pageHeight = doc.internal.pageSize.height;
  const remainingSpace = pageHeight - yPos - estimatedTableHeight - 20; // Reserve space for footer
  
  if (remainingSpace < 20) {
    doc.addPage();
    return PDF_STYLES.MARGIN;
  }
  return yPos;
};

export const generateMassBalanceReport = (formData, results) => {
  const doc = new jsPDF();
  let yPos = PDF_STYLES.MARGIN;
  const margin = PDF_STYLES.MARGIN;
  
  // Add title
  addText(doc, 'Mass Balance Report', margin, yPos, { 
    fontSize: PDF_STYLES.TITLE, 
    color: PDF_STYLES.PRIMARY, 
    isBold: true 
  });
  yPos += PDF_STYLES.SECTION_SPACING;
  
  // Add timestamp
  addText(doc, `Generated on ${new Date().toLocaleString()}`, margin, yPos, { 
    fontSize: PDF_STYLES.BODY_TEXT, 
    color: PDF_STYLES.TEXT_GRAY 
  });
  yPos += PDF_STYLES.SECTION_SPACING;
  
  // Add system information
  yPos = addSectionHeader(doc, 'System Information', yPos);
  
  const systemInfo = [
    ['Tank Volume', `${formData.tankVolume} m³`],
    ['Number of Tanks', formData.numTanks],
    ['Target Fish Weight', `${formData.targetFishWeight} g`],
    ['Number of Fish', formData.targetNumFish],
    ['Feed Rate', `${formData.feedRate}%`],
    ['Feed Protein', `${formData.feedProtein}%`]
  ];
  
  const tableConfig = {
    head: [['Parameter', 'Value']],
    theme: 'grid',
    headStyles: { 
      fillColor: PDF_STYLES.SECONDARY,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: PDF_STYLES.BODY_TEXT,
      font: 'helvetica'
    },
    bodyStyles: {
      fontSize: PDF_STYLES.BODY_TEXT,
      textColor: PDF_STYLES.PRIMARY,
      font: 'helvetica'
    },
    styles: { 
      fontSize: PDF_STYLES.BODY_TEXT,
      cellPadding: 4,
      font: 'helvetica',
      overflow: 'linebreak',
      cellWidth: 'wrap'
    },
    margin: { left: margin },
    tableLineColor: PDF_STYLES.LIGHT_GRAY,
    tableLineWidth: 0.5,
    showHead: 'everyPage',
    startY: false,
    pageBreak: 'avoid',
    didDrawPage: function (data) {
      // Add page number and footer to every page
      const pageSize = doc.internal.pageSize;
      const pageHeight = pageSize.height || pageSize.getHeight();
      const pageWidth = pageSize.width || pageSize.getWidth();
      
      // Set font for footer
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      
      // Add page number (right side)
      doc.text('Page ' + doc.internal.getNumberOfPages(), pageWidth - 20, pageHeight - 10);
      
      // Add footer text (left side)
      doc.text('Generated by Aqua BluePrint', 20, pageHeight - 10);
    }
  };
  
  // System Info Table
  yPos = checkPageBreak(doc, yPos, 25);
  autoTable(doc, {
    ...tableConfig,
    startY: yPos,
    body: cleanTableData(systemInfo),
  });
  yPos = (doc.lastAutoTable?.finalY || yPos) + PDF_STYLES.SECTION_SPACING;
  
  // Water Quality Parameters
  yPos = addSectionHeader(doc, 'Water Quality Parameters', yPos);
  
  const waterQuality = [
    ['Water Temperature', `${formData.waterTemp}°C`],
    ['pH Level', (formData.pH ?? formData.ph) ?? '-'],
    ['Minimum DO', `${formData.minDO} mg/L`],
    ['Maximum CO2', `${formData.maxCO2} mg/L`],
    ['Maximum TAN', `${formData.maxTAN} mg/L`],
    ['Minimum TSS', `${formData.minTSS} mg/L`]
  ];
  
  yPos = checkPageBreak(doc, yPos, 25);
  autoTable(doc, {
    ...tableConfig,
    startY: yPos,
    body: cleanTableData(waterQuality),
  });
  yPos = (doc.lastAutoTable?.finalY || yPos) + PDF_STYLES.SECTION_SPACING;
  
  // Efficiency Parameters
  yPos = addSectionHeader(doc, 'System Efficiency', yPos);
  
  const efficiency = [
    ['O2 Absorption', `${formData.o2Absorption}%`],
    ['CO2 Removal', `${formData.co2Removal}%`],
    ['TAN Removal', `${formData.tanRemoval}%`],
    ['TSS Removal', `${formData.tssRemoval}%`]
  ];
  
  yPos = checkPageBreak(doc, yPos, 25);
  autoTable(doc, {
    ...tableConfig,
    startY: yPos,
    body: cleanTableData(efficiency),
  });
  yPos = (doc.lastAutoTable?.finalY || yPos) + PDF_STYLES.SECTION_SPACING;
  
  // Mass Balance Results
  yPos = addSectionHeader(doc, 'Mass Balance Results', yPos);
  
  // Normalize result shapes (supports both MassBalanceReport and CreateDesignSystem structures)
  const oxy = results?.oxygen || {};
  const tss = results?.tss || {};
  const co2 = results?.co2 || {};
  const tan = results?.tan || {};

  const o2Effluent = (oxy.effluentMgL ?? oxy.effluentConc ?? 0);
  const o2ProdMg = (oxy.consMgPerDay ?? oxy.prodMgPerDay ?? 0);
  const o2ProdKg = (oxy.consKgPerDay ?? oxy.prodKgPerDay ?? (o2ProdMg / 1_000_000));
  const o2SatAdj = (oxy.saturationAdjustedMgL ?? 0);
  const o2MinDoUse = (oxy.MINDO_use ?? null);

  const tssEffluent = (tss.effluentMgL ?? tss.effluentConc ?? 0);
  const tssProdMg = (tss.prodMgPerDay ?? 0);
  const tssProdKg = (tss.prodKgPerDay ?? (tssProdMg / 1_000_000));
  const tssMaxUse = (tss.MAXTSS_use ?? null);

  const co2Effluent = (co2.effluentMgL ?? co2.effluentConc ?? 0);
  const co2ProdMg = (co2.prodMgPerDay ?? 0);
  const co2ProdKg = (co2.prodKgPerDay ?? (co2ProdMg / 1_000_000));
  const co2MaxUse = (co2.MAXCO2_use ?? null);

  const tanEffluent = (tan.effluentMgL ?? tan.effluentConc ?? 0);
  const tanProdMg = (tan.prodMgPerDay ?? 0);
  const tanProdKg = (tan.prodKgPerDay ?? (tanProdMg / 1_000_000));
  const tanMaxUse = (tan.MAXTAN_use ?? null);

  const formatNum = (n, digits = 2) =>
    (typeof n === 'number' && isFinite(n)) ? n.toFixed(digits) : '-';

  const massBalanceResults = [
    ['Oxygen - O₂ Saturation Adjusted', `${formatNum(o2SatAdj)} mg/L`],
    ['Oxygen - Min DO (use)', o2MinDoUse != null ? `${o2MinDoUse} mg/L` : '-'],
    ['Oxygen - Effluent Conc.', `${formatNum(o2Effluent)} mg/L`],
    ['Oxygen - Consumption (mg/day)', `${formatNum(o2ProdMg, 0)} mg/day`],
    ['Oxygen - Consumption (kg/day)', `${formatNum(o2ProdKg)} kg/day`],
    ['TSS - Max TSS (use)', tssMaxUse != null ? `${tssMaxUse} mg/L` : '-'],
    ['TSS - Effluent Conc.', `${formatNum(tssEffluent)} mg/L`],
    ['TSS - Production (mg/day)', `${formatNum(tssProdMg, 0)} mg/day`],
    ['TSS - Production (kg/day)', `${formatNum(tssProdKg)} kg/day`],
    ['CO2 - Max CO2 (use)', co2MaxUse != null ? `${co2MaxUse} mg/L` : '-'],
    ['CO2 - Effluent Conc.', `${formatNum(co2Effluent)} mg/L`],
    ['CO2 - Production (mg/day)', `${formatNum(co2ProdMg, 0)} mg/day`],
    ['CO2 - Production (kg/day)', `${formatNum(co2ProdKg)} kg/day`],
    ['TAN - Max TAN (use)', tanMaxUse != null ? `${tanMaxUse} mg/L` : '-'],
    ['TAN - Effluent Conc.', `${formatNum(tanEffluent)} mg/L`],
    ['TAN - Production (mg/day)', `${formatNum(tanProdMg, 0)} mg/day`],
    ['TAN - Production (kg/day)', `${formatNum(tanProdKg)} kg/day`]
  ];
  
  yPos = checkPageBreak(doc, yPos, 40);
  autoTable(doc, {
    ...tableConfig,
    startY: yPos,
    body: cleanTableData(massBalanceResults),
  });
  
  // Footer is now added automatically to all pages via didDrawPage function
  
  return doc;
};

// Lightweight PDF: only the four card values as shown in the UI
export const generateMassBalanceCardsPdf = (formData, results) => {
  const doc = new jsPDF();
  const margin = PDF_STYLES.MARGIN;
  let yPos = PDF_STYLES.MARGIN;

  // Add title
  setTextStyle(doc, PDF_STYLES.TITLE, PDF_STYLES.PRIMARY, true);
  doc.text('Mass Balance Report', margin, yPos);
  yPos += PDF_STYLES.SECTION_SPACING;
  
  // Add timestamp
  setTextStyle(doc, PDF_STYLES.BODY_TEXT, PDF_STYLES.TEXT_GRAY);
  doc.text(`Generated on ${new Date().toLocaleString()}`, margin, yPos);
  yPos += PDF_STYLES.SECTION_SPACING;

  const oxy = results?.oxygen || {};
  const tss = results?.tss || {};
  const co2 = results?.co2 || {};
  const tan = results?.tan || {};

  const formatNum = (n, digits = 2) =>
    (typeof n === 'number' && isFinite(n)) ? n.toFixed(digits) : '-';

  const tables = [
    {
      title: 'Oxygen',
      rows: [
        ['O₂ Saturation Adjusted', `${formatNum(oxy.saturationAdjustedMgL)} mg/L`],
        ['Min DO (use)', oxy.MINDO_use != null ? `${oxy.MINDO_use} mg/L` : '-'],
        ['Effluent Conc.', `${formatNum(oxy.effluentMgL)} mg/L`],
        ['Consumption (mg/day)', `${formatNum(oxy.consMgPerDay, 0)} mg/day`],
        ['Consumption (kg/day)', `${formatNum(oxy.consKgPerDay)} kg/day`],
      ]
    },
    {
      title: 'Total Suspended Solids (TSS)',
      rows: [
        ['Effluent Conc.', `${formatNum(tss.effluentMgL)} mg/L`],
        ['Max TSS (use)', tss.MAXTSS_use != null ? `${tss.MAXTSS_use} mg/L` : '-'],
        ['Production (mg/day)', `${formatNum(tss.prodMgPerDay, 0)} mg/day`],
        ['Production (kg/day)', `${formatNum(tss.prodKgPerDay)} kg/day`],
      ]
    },
    {
      title: 'Carbon Dioxide (CO2)',
      rows: [
        ['Effluent Conc.', `${formatNum(co2.effluentMgL)} mg/L`],
        ['Max CO2 (use)', co2.MAXCO2_use != null ? `${co2.MAXCO2_use} mg/L` : '-'],
        ['Production (mg/day)', `${formatNum(co2.prodMgPerDay, 0)} mg/day`],
        ['Production (kg/day)', `${formatNum(co2.prodKgPerDay)} kg/day`],
      ]
    },
    {
      title: 'Total Ammonia Nitrogen (TAN)',
      rows: [
        ['Effluent Conc.', `${formatNum(tan.effluentMgL)} mg/L`],
        ['Max TAN (use)', tan.MAXTAN_use != null ? `${tan.MAXTAN_use} mg/L` : '-'],
        ['Production (mg/day)', `${formatNum(tan.prodMgPerDay, 0)} mg/day`],
        ['Production (kg/day)', `${formatNum(tan.prodKgPerDay)} kg/day`],
      ]
    },
  ];

  const tableConfig = {
    head: [['Parameter', 'Value']],
    theme: 'grid',
    headStyles: { 
      fillColor: PDF_STYLES.SECONDARY,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: PDF_STYLES.BODY_TEXT,
      font: 'helvetica'
    },
    bodyStyles: {
      fontSize: PDF_STYLES.BODY_TEXT,
      textColor: PDF_STYLES.PRIMARY,
      font: 'helvetica'
    },
    styles: { 
      fontSize: PDF_STYLES.BODY_TEXT,
      cellPadding: 4,
      font: 'helvetica',
      overflow: 'linebreak',
      cellWidth: 'wrap'
    },
    margin: { left: margin },
    tableLineColor: PDF_STYLES.LIGHT_GRAY,
    tableLineWidth: 0.5,
    showHead: 'everyPage',
    startY: false,
    pageBreak: 'auto',
    didDrawPage: function (data) {
      // Add page number and footer to every page
      const pageSize = doc.internal.pageSize;
      const pageHeight = pageSize.height || pageSize.getHeight();
      const pageWidth = pageSize.width || pageSize.getWidth();
      
      // Set font for footer
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      
      // Add page number (right side)
      doc.text('Page ' + doc.internal.getNumberOfPages(), pageWidth - 20, pageHeight - 10);
      
      // Add footer text (left side)
      doc.text('Generated by Aqua BluePrint', 20, pageHeight - 10);
    }
  };

  tables.forEach((section, idx) => {
    yPos += (idx === 0 ? PDF_STYLES.LINE_SPACING : PDF_STYLES.SECTION_SPACING);
    yPos = addSubsectionHeader(doc, section.title, yPos);
    yPos = checkPageBreak(doc, yPos, 20);
    autoTable(doc, {
      ...tableConfig,
      startY: yPos,
      body: cleanTableData(section.rows),
    });
    yPos = (doc.lastAutoTable?.finalY || yPos) + PDF_STYLES.LINE_SPACING;
  });

  // Footer is now added automatically to all pages via didDrawPage function

  return doc;
};

// Advanced Report PDF Generator - Stage 6 Only
export const generateAdvancedReportPdf = (formData, advancedReport, limitingFactor) => {
  return generateAdvancedReportPdfWithStages(formData, advancedReport, limitingFactor, null, null, ['massBalance', 'stage6']);
};

// Advanced Report PDF Generator - Stage 7 Only
export const generateStage7ReportPdf = (formData, stage7Report) => {
  return generateAdvancedReportPdfWithStages(formData, null, null, stage7Report, null, ['stage7']);
};

// Advanced Report PDF Generator - Stage 8 Only
export const generateStage8ReportPdf = (formData, stage8Report) => {
  return generateAdvancedReportPdfWithStages(formData, null, null, null, stage8Report, ['stage8']);
};

// Advanced Report PDF Generator - All Available Stages
export const generateCompleteAdvancedReportPdf = (formData, advancedReport, limitingFactor, stage7Report, stage8Report) => {
  const availableStages = ['massBalance', 'stage6'];
  if (stage7Report) availableStages.push('stage7');
  if (stage8Report) availableStages.push('stage8');
  
  return generateAdvancedReportPdfWithStages(formData, advancedReport, limitingFactor, stage7Report, stage8Report, availableStages);
};

// Main Advanced Report PDF Generator with Stage Selection
export const generateAdvancedReportPdfWithStages = (formData, advancedReport, limitingFactor, stage7Report, stage8Report, stagesToInclude = ['stage6']) => {
  const doc = new jsPDF();
  let yPos = PDF_STYLES.MARGIN;
  const margin = PDF_STYLES.MARGIN;
  
  // Add title based on stages included
  setTextStyle(doc, PDF_STYLES.TITLE, PDF_STYLES.PRIMARY, true);
  let reportTitle = 'Advanced Design System Report';
  if (stagesToInclude.length === 1) {
    if (stagesToInclude.includes('massBalance')) reportTitle = 'Mass Balance Report';
    else if (stagesToInclude.includes('stage6')) reportTitle = 'Stage 6 Report';
    else if (stagesToInclude.includes('stage7')) reportTitle = 'Stage 7 Report';
    else if (stagesToInclude.includes('stage8')) reportTitle = 'Stage 8 Report';
  } else if (stagesToInclude.length > 1) {
    reportTitle = 'Complete Advanced Design System Report';
  }
  doc.text(reportTitle, margin, yPos);
  yPos += PDF_STYLES.SECTION_SPACING;
  
  // Add timestamp
  setTextStyle(doc, PDF_STYLES.BODY_TEXT, PDF_STYLES.TEXT_GRAY);
  doc.text(`Generated on ${new Date().toLocaleString()}`, margin, yPos);
  yPos += PDF_STYLES.SECTION_SPACING;
  
  const tableConfig = {
    head: [['Parameter', 'Value']],
    theme: 'grid',
    headStyles: { 
      fillColor: PDF_STYLES.SECONDARY,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: PDF_STYLES.BODY_TEXT,
      font: 'helvetica'
    },
    bodyStyles: {
      fontSize: PDF_STYLES.BODY_TEXT,
      textColor: PDF_STYLES.PRIMARY,
      font: 'helvetica'
    },
    styles: { 
      fontSize: PDF_STYLES.BODY_TEXT,
      cellPadding: 4,
      font: 'helvetica',
      overflow: 'linebreak',
      cellWidth: 'wrap'
    },
    margin: { left: margin },
    tableLineColor: PDF_STYLES.LIGHT_GRAY,
    tableLineWidth: 0.5,
    showHead: 'everyPage',
    startY: false,
    pageBreak: 'auto',
    didDrawPage: function (data) {
      // Add page number and footer to every page
      const pageSize = doc.internal.pageSize;
      const pageHeight = pageSize.height || pageSize.getHeight();
      const pageWidth = pageSize.width || pageSize.getWidth();
      
      // Set font for footer
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      
      // Add page number (right side)
      doc.text('Page ' + doc.internal.getNumberOfPages(), pageWidth - 20, pageHeight - 10);
      
      // Add footer text (left side)
      doc.text('Generated by Aqua BluePrint', 20, pageHeight - 10);
    }
  };
  
  // Mass Balance Report
  if (stagesToInclude.includes('massBalance') && advancedReport && advancedReport.massBalanceData) {
    yPos = addSectionHeader(doc, 'Mass Balance Report', yPos);
    
    const massBalance = advancedReport.massBalanceData;
    const formatNum = (n, digits = 2) => 
      (typeof n === 'number' && isFinite(n)) ? n.toFixed(digits) : '-';
    
    // Mass Balance Results
    const massBalanceResults = [
      ['Oxygen - O₂ Saturation Adjusted', `${formatNum(massBalance.oxygen?.saturationAdjustedMgL)} mg/L`],
      ['Oxygen - Min DO (use)', massBalance.oxygen?.MINDO_use != null ? `${massBalance.oxygen.MINDO_use} mg/L` : '-'],
      ['Oxygen - Effluent Conc.', `${formatNum(massBalance.oxygen?.effluentMgL)} mg/L`],
      ['Oxygen - Consumption (mg/day)', `${formatNum(massBalance.oxygen?.consMgPerDay, 0)} mg/day`],
      ['Oxygen - Consumption (kg/day)', `${formatNum(massBalance.oxygen?.consKgPerDay)} kg/day`],
      ['TSS - Max TSS (use)', massBalance.tss?.MAXTSS_use != null ? `${massBalance.tss.MAXTSS_use} mg/L` : '-'],
      ['TSS - Effluent Conc.', `${formatNum(massBalance.tss?.effluentMgL)} mg/L`],
      ['TSS - Production (mg/day)', `${formatNum(massBalance.tss?.prodMgPerDay, 0)} mg/day`],
      ['TSS - Production (kg/day)', `${formatNum(massBalance.tss?.prodKgPerDay)} kg/day`],
      ['CO2 - Max CO₂ (use)', massBalance.co2?.MAXCO2_use != null ? `${massBalance.co2.MAXCO2_use} mg/L` : '-'],
      ['CO2 - Effluent Conc.', `${formatNum(massBalance.co2?.effluentMgL)} mg/L`],
      ['CO2 - Production (mg/day)', `${formatNum(massBalance.co2?.prodMgPerDay, 0)} mg/day`],
      ['CO2 - Production (kg/day)', `${formatNum(massBalance.co2?.prodKgPerDay)} kg/day`],
      ['TAN - Max TAN (use)', massBalance.tan?.MAXTAN_use != null ? `${massBalance.tan.MAXTAN_use} mg/L` : '-'],
      ['TAN - Effluent Conc.', `${formatNum(massBalance.tan?.effluentMgL)} mg/L`],
      ['TAN - Production (mg/day)', `${formatNum(massBalance.tan?.prodMgPerDay, 0)} mg/day`],
      ['TAN - Production (kg/day)', `${formatNum(massBalance.tan?.prodKgPerDay)} kg/day`]
    ];
    
    yPos = checkPageBreak(doc, yPos, 40);
    autoTable(doc, {
      ...tableConfig,
      startY: yPos,
      body: cleanTableData(massBalanceResults),
    });
    yPos = (doc.lastAutoTable?.finalY || yPos) + PDF_STYLES.SECTION_SPACING;
  }

  // Advanced Report Results - Stage 6
  if (stagesToInclude.includes('stage6') && advancedReport && advancedReport.step6Results) {
    yPos = addSectionHeader(doc, 'Stage 6: Advanced Calculation Results', yPos);
    
    const s1 = advancedReport.step6Results;
    const formatNum = (n, digits = 2) => 
      (typeof n === 'number' && isFinite(n)) ? n.toFixed(digits) : '-';
    
    // Stage 1 Results
    yPos = addSubsectionHeader(doc, 'Stage 1 Results', yPos);
    
    const stage1Results = [
      ['Oxygen - L/min', formatNum(s1.oxygen?.l_per_min)],
      ['Oxygen - m3/hr', formatNum(s1.oxygen?.m3_per_hr)],
      ['CO2 - L/min', formatNum(s1.co2?.l_per_min)],
      ['CO2 - m3/hr', formatNum(s1.co2?.m3_per_hr)],
      ['TSS - L/min', formatNum(s1.tss?.l_per_min)],
      ['TSS - m3/hr', formatNum(s1.tss?.m3_per_hr)],
      ['TAN - L/min', formatNum(s1.tan?.l_per_min)],
      ['TAN - m3/hr', formatNum(s1.tan?.m3_per_hr)]
    ];
    
    yPos = checkPageBreak(doc, yPos, 30);
    autoTable(doc, {
      ...tableConfig,
      startY: yPos,
      body: cleanTableData(stage1Results),
    });
    yPos = (doc.lastAutoTable?.finalY || yPos) + PDF_STYLES.SUBSECTION_SPACING;
    
    // Stage 2 Results
    if (s1.stage2_oxygen || s1.stage2_co2 || s1.stage2_tss || s1.stage2_tan) {
      yPos = addSubsectionHeader(doc, 'Stage 2 Results', yPos);
      
      const stage2Results = [
        ['Oxygen - L/min', formatNum(s1.stage2_oxygen?.l_per_min)],
        ['Oxygen - m3/hr', formatNum(s1.stage2_oxygen?.m3_per_hr)],
        ['CO2 - L/min', formatNum(s1.stage2_co2?.l_per_min)],
        ['CO2 - m3/hr', formatNum(s1.stage2_co2?.m3_per_hr)],
        ['TSS - L/min', formatNum(s1.stage2_tss?.l_per_min)],
        ['TSS - m3/hr', formatNum(s1.stage2_tss?.m3_per_hr)],
        ['TAN - L/min', formatNum(s1.stage2_tan?.l_per_min)],
        ['TAN - m3/hr', formatNum(s1.stage2_tan?.m3_per_hr)]
      ];
      
      yPos = checkPageBreak(doc, yPos, 30);
      autoTable(doc, {
        ...tableConfig,
        startY: yPos,
        body: cleanTableData(stage2Results),
      });
      yPos = (doc.lastAutoTable?.finalY || yPos) + PDF_STYLES.SUBSECTION_SPACING;
    }
    
    // Stage 3 Results
    if (s1.stage3_oxygen || s1.stage3_co2 || s1.stage3_tss || s1.stage3_tan) {
      yPos = addSubsectionHeader(doc, 'Stage 3 Results', yPos);
      
      const stage3Results = [
        ['Oxygen - L/min', formatNum(s1.stage3_oxygen?.l_per_min)],
        ['Oxygen - m3/hr', formatNum(s1.stage3_oxygen?.m3_per_hr)],
        ['CO2 - L/min', formatNum(s1.stage3_co2?.l_per_min)],
        ['CO2 - m3/hr', formatNum(s1.stage3_co2?.m3_per_hr)],
        ['TSS - L/min', formatNum(s1.stage3_tss?.l_per_min)],
        ['TSS - m3/hr', formatNum(s1.stage3_tss?.m3_per_hr)],
        ['TAN - L/min', formatNum(s1.stage3_tan?.l_per_min)],
        ['TAN - m3/hr', formatNum(s1.stage3_tan?.m3_per_hr)]
      ];
      
      yPos = checkPageBreak(doc, yPos, 30);
      autoTable(doc, {
        ...tableConfig,
        startY: yPos,
        body: cleanTableData(stage3Results),
      });
      yPos = (doc.lastAutoTable?.finalY || yPos) + PDF_STYLES.SUBSECTION_SPACING;
    }
  }
  
  // Limiting Factor
  if (limitingFactor) {
    yPos = addSectionHeader(doc, 'Limiting Factor Analysis', yPos);
    
    const formatNum = (n, digits = 2) => 
      (typeof n === 'number' && isFinite(n)) ? n.toFixed(digits) : '-';
    
    // Stage 1 Limiting Factor
    if (limitingFactor.stage1) {
      yPos = addSubsectionHeader(doc, 'Stage 1', yPos);
      
      const stage1Data = [
        ['Factor', limitingFactor.stage1.factor || '-'],
        ['Flow (L/min)', formatNum(limitingFactor.stage1.flow_l_per_min)],
        ['Flow (m3/hr)', formatNum(limitingFactor.stage1.flow_m3_per_hr)]
      ];
      
      yPos = checkPageBreak(doc, yPos, 20);
      autoTable(doc, {
        ...tableConfig,
        startY: yPos,
        body: cleanTableData(stage1Data),
      });
      yPos = (doc.lastAutoTable?.finalY || yPos) + PDF_STYLES.SUBSECTION_SPACING;
    }
    
    // Stage 2 Limiting Factor
    if (limitingFactor.stage2) {
      yPos = addSubsectionHeader(doc, 'Stage 2', yPos);
      
      const stage2Data = [
        ['Factor', limitingFactor.stage2.factor || '-'],
        ['Flow (L/min)', formatNum(limitingFactor.stage2.flow_l_per_min)],
        ['Flow (m3/hr)', formatNum(limitingFactor.stage2.flow_m3_per_hr)]
      ];
      
      yPos = checkPageBreak(doc, yPos, 20);
      autoTable(doc, {
        ...tableConfig,
        startY: yPos,
        body: cleanTableData(stage2Data),
      });
      yPos = (doc.lastAutoTable?.finalY || yPos) + PDF_STYLES.SUBSECTION_SPACING;
    }
    
    // Stage 3 Limiting Factor
    if (limitingFactor.stage3) {
      yPos = addSubsectionHeader(doc, 'Stage 3', yPos);
      
      const stage3Data = [
        ['Factor', limitingFactor.stage3.factor || '-'],
        ['Flow (L/min)', formatNum(limitingFactor.stage3.flow_l_per_min)],
        ['Flow (m3/hr)', formatNum(limitingFactor.stage3.flow_m3_per_hr)]
      ];
      
      yPos = checkPageBreak(doc, yPos, 20);
      autoTable(doc, {
        ...tableConfig,
        startY: yPos,
        body: cleanTableData(stage3Data),
      });
      yPos = (doc.lastAutoTable?.finalY || yPos) + PDF_STYLES.SUBSECTION_SPACING;
    }
  }
  
  // Stage 7 Report - Bio Filter & Sump Size
  if (stagesToInclude.includes('stage7') && stage7Report) {
    yPos = addSectionHeader(doc, 'Stage 7: Bio Filter & Sump Size', yPos);
    
    const formatNum = (n, digits = 2) => 
      (typeof n === 'number' && isFinite(n)) ? n.toFixed(digits) : '-';
    
    // Bio Filter Parameters
    yPos = addSubsectionHeader(doc, 'Bio Filter Parameters', yPos);
    
    const bioFilterData = [
      ['VTR Used', formatNum(stage7Report.bioVTR_use)],
      ['VTR Compensation', formatNum(stage7Report['bio.VTR_compensation'])],
      ['Shape', stage7Report['bio.shape'] || 'N/A'],
      ['Temperature Used', formatNum(stage7Report.temperature_used) + '°C'],
      ['Temp Compensation Factor', formatNum(stage7Report.temp_compensation_factor)]
    ];
    
    yPos = checkPageBreak(doc, yPos, 25);
    autoTable(doc, {
      ...tableConfig,
      startY: yPos,
      body: cleanTableData(bioFilterData),
    });
    yPos = (doc.lastAutoTable?.finalY || yPos) + PDF_STYLES.SUBSECTION_SPACING;
    
    // System Overview
    yPos = addSubsectionHeader(doc, 'System Overview', yPos);
    
    const systemOverviewData = [
      ['Project ID', stage7Report.project_id || 'N/A'],
      ['Status', stage7Report.status || 'N/A'],
      ['Biofilter Parameters Count', Object.keys(stage7Report.biofilter_parameters || {}).length + ' items']
    ];
    
    yPos = checkPageBreak(doc, yPos, 20);
    autoTable(doc, {
      ...tableConfig,
      startY: yPos,
      body: cleanTableData(systemOverviewData),
    });
    yPos = (doc.lastAutoTable?.finalY || yPos) + PDF_STYLES.SUBSECTION_SPACING;
    
    // Stage 1 (Juvenile) Results
    yPos = addSubsectionHeader(doc, 'Stage 1 (Juvenile) Results', yPos);

    const stage1Data = [
      // Daily TAN production
      ['Daily TAN production rate (g/day)', formatNum(stage7Report.DailyTAN_gday_Stage1)],
      ['Daily TAN — after passive nitrification (g/day)', formatNum(stage7Report.DailyTANpassive_gday_Stage1)],
      // Design VTR
      ['Design VTR', formatNum(stage7Report['design.VTR_Stage1'])],
      // Media required
      ['Media volume required (m³)', formatNum(stage7Report['biomedia.Required_Stage1'])],
      // MBBR volume
      ['MBBR volume (m³)', formatNum(stage7Report['MBBR.vol_Stage1'])],
      // Round vessel
      ['Round vessel — vessel diameter (m)', formatNum(stage7Report['MBBR.dia_Stage1'])],
      ['Round vessel — vessel height (m)', formatNum(stage7Report['MBBR.high_Stage1'])],
      // Rectangular vessel
      ['Rectangular vessel — vessel height (m)', formatNum(stage7Report['MBBR.highRect_Stage1'])],
      ['Rectangular vessel — vessel width (m)', formatNum(stage7Report['MBBR.wid_Stage1'])],
      ['Rectangular vessel — vessel length (m)', formatNum(stage7Report['MBBR.len_Stage1'])],
      // Aeration
      ['Aeration — volume air required for mixing (x5 vol) (m³)', formatNum(stage7Report['MBBR.air_Stage1'])],
      ['Aeration — volume air required (with 50% spare capacity) (m³)', formatNum(stage7Report['MBBR.air_Stage1_spare'])],
      // Sump sizing
      ['Sump sizing — 3 min full flow (m³)', formatNum(stage7Report['sump.Size_3min_Stage1'])],
      ['Sump sizing — 5 min full flow (m³)', formatNum(stage7Report['sump.Size_5min_Stage1'])],
      ['Sump sizing — sump total volume (m³)', formatNum(stage7Report['sump.totvol_Stage1'])],
      ['Sump sizing — total system volume (m³)', formatNum(stage7Report['vol.TotalSyst_Stage1'])]
    ];
    
    yPos = checkPageBreak(doc, yPos, 30);
    autoTable(doc, {
      ...tableConfig,
      startY: yPos,
      body: cleanTableData(stage1Data),
    });
    yPos = (doc.lastAutoTable?.finalY || yPos) + PDF_STYLES.SUBSECTION_SPACING;
    
    // Stage 2 (Fingerling) Results
    yPos = addSubsectionHeader(doc, 'Stage 2 (Fingerling) Results', yPos);

    const stage2Data = [
      // Daily TAN production
      ['Daily TAN production rate (g/day)', formatNum(stage7Report.DailyTAN_gday_Stage2)],
      ['Daily TAN — after passive nitrification (g/day)', formatNum(stage7Report.DailyTANpassive_gday_Stage2)],
      // Design VTR
      ['Design VTR', formatNum(stage7Report['design.VTR_Stage2'])],
      // Media required
      ['Media volume required (m³)', formatNum(stage7Report['biomedia.Required_Stage2'])],
      // MBBR volume
      ['MBBR volume (m³)', formatNum(stage7Report['MBBR.vol_Stage2'])],
      // Round vessel
      ['Round vessel — vessel diameter (m)', formatNum(stage7Report['MBBR.dia_Stage2'])],
      ['Round vessel — vessel height (m)', formatNum(stage7Report['MBBR.high_Stage2'])],
      // Rectangular vessel
      ['Rectangular vessel — vessel height (m)', formatNum(stage7Report['MBBR.highRect_Stage2'])],
      ['Rectangular vessel — vessel width (m)', formatNum(stage7Report['MBBR.wid_Stage2'])],
      ['Rectangular vessel — vessel length (m)', formatNum(stage7Report['MBBR.len_Stage2'])],
      // Aeration
      ['Aeration — volume air required for mixing (x5 vol) (m³)', formatNum(stage7Report['MBBR.air_Stage2'])],
      ['Aeration — volume air required (with 50% spare capacity) (m³)', formatNum(stage7Report['MBBR.air_Stage2_spare'])],
      // Sump sizing
      ['Sump sizing — 3 min full flow (m³)', formatNum(stage7Report['sump.Size_3min_Stage2'])],
      ['Sump sizing — 5 min full flow (m³)', formatNum(stage7Report['sump.Size_5min_Stage2'])],
      ['Sump sizing — sump total volume (m³)', formatNum(stage7Report['sump.totvol_Stage2'])],
      ['Sump sizing — total system volume (m³)', formatNum(stage7Report['vol.TotalSyst_Stage2'])]
    ];
    
    yPos = checkPageBreak(doc, yPos, 30);
    autoTable(doc, {
      ...tableConfig,
      startY: yPos,
      body: cleanTableData(stage2Data),
    });
    yPos = (doc.lastAutoTable?.finalY || yPos) + PDF_STYLES.SUBSECTION_SPACING;
    
    // Stage 3 (Growout) Results
    yPos = addSubsectionHeader(doc, 'Stage 3 (Growout) Results', yPos);

    const stage3Data = [
      // Daily TAN production
      ['Daily TAN production rate (g/day)', formatNum(stage7Report.DailyTAN_gday_Stage3)],
      ['Daily TAN — after passive nitrification (g/day)', formatNum(stage7Report.DailyTANpassive_gday_Stage3)],
      // Design VTR
      ['Design VTR', formatNum(stage7Report['design.VTR_Stage3'])],
      // Media required
      ['Media volume required (m³)', formatNum(stage7Report['biomedia.Required_Stage3'])],
      // MBBR volume
      ['MBBR volume (m³)', formatNum(stage7Report['MBBR.vol_Stage3'])],
      // Round vessel
      ['Round vessel — vessel diameter (m)', formatNum(stage7Report['MBBR.dia_Stage3'])],
      ['Round vessel — vessel height (m)', formatNum(stage7Report['MBBR.high_Stage3'])],
      // Rectangular vessel
      ['Rectangular vessel — vessel height (m)', formatNum(stage7Report['MBBR.highRect_Stage3'])],
      ['Rectangular vessel — vessel width (m)', formatNum(stage7Report['MBBR.wid_Stage3'])],
      ['Rectangular vessel — vessel length (m)', formatNum(stage7Report['MBBR.len_Stage3'])],
      // Aeration
      ['Aeration — volume air required for mixing (x5 vol) (m³)', formatNum(stage7Report['MBBR.air_Stage3'])],
      ['Aeration — volume air required (with 50% spare capacity) (m³)', formatNum(stage7Report['MBBR.air_Stage3_spare'])],
      // Sump sizing
      ['Sump sizing — 3 min full flow (m³)', formatNum(stage7Report['sump.Size_3min_Stage3'])],
      ['Sump sizing — 5 min full flow (m³)', formatNum(stage7Report['sump.Size_5min_Stage3'])],
      ['Sump sizing — sump total volume (m³)', formatNum(stage7Report['sump.totvol_Stage3'])],
      ['Sump sizing — total system volume (m³)', formatNum(stage7Report['vol.TotalSyst_Stage3'])]
    ];
    
    yPos = checkPageBreak(doc, yPos, 30);
    autoTable(doc, {
      ...tableConfig,
      startY: yPos,
      body: cleanTableData(stage3Data),
    });
    yPos = (doc.lastAutoTable?.finalY || yPos) + PDF_STYLES.SUBSECTION_SPACING;
  }
  
  // Stage 8 Report - Basic Pump Size
  if (stagesToInclude.includes('stage8') && stage8Report) {
    yPos = addSectionHeader(doc, 'Stage 8: Basic Pump Size', yPos);
    
    const formatNum = (n, digits = 2) => 
      (typeof n === 'number' && isFinite(n)) ? n.toFixed(digits) : '-';
    
    // Stage 1 (Juvenile) Results
    if (stage8Report.stage1) {
      yPos = addSubsectionHeader(doc, 'Stage 1 (Juvenile) Results', yPos);
      
      const stage1Data = [
        ['Parameter', 'Value'],
        ['Limiting Flow Rate', formatNum(stage8Report.stage1.limitingFlowRateStage1)],
        ['Q_l.s_Stage1', formatNum(stage8Report.stage1.Q_l_s_Stage1)],
        ['Total Dynamic Head Pressure', formatNum(stage8Report.stage1.pump_Head_Stage1)],
        ['Pump Efficiency', formatNum(stage8Report.stage1.n_Pump_Stage1)],
        ['Motor Efficiency', formatNum(stage8Report.stage1.n_Motor_Stage1)],
        ['Hydraulic Power', formatNum(stage8Report.stage1.pump_HydPower_Stage1)],
        ['Required Shaft Power', formatNum(stage8Report.stage1.pump_PowerkW_Stage1)]
      ];
      
      yPos = checkPageBreak(doc, yPos, 25);
      autoTable(doc, {
        ...tableConfig,
        startY: yPos,
        body: cleanTableData(stage1Data),
      });
      yPos = (doc.lastAutoTable?.finalY || yPos) + PDF_STYLES.SUBSECTION_SPACING;
    }
    
    // Stage 2 (Fingerling) Results
    if (stage8Report.stage2) {
      yPos = addSubsectionHeader(doc, 'Stage 2 (Fingerling) Results', yPos);
      
      const stage2Data = [
        ['Parameter', 'Value'],
        ['Limiting Flow Rate', formatNum(stage8Report.stage2.limitingFlowRateStage2)],
        ['Q_l.s_Stage2', formatNum(stage8Report.stage2.Q_l_s_Stage2)],
        ['Total Dynamic Head Pressure', formatNum(stage8Report.stage2.pump_Head_Stage2)],
        ['Pump Efficiency', formatNum(stage8Report.stage2.n_Pump_Stage2)],
        ['Motor Efficiency', formatNum(stage8Report.stage2.n_Motor_Stage2)],
        ['Hydraulic Power', formatNum(stage8Report.stage2.pump_HydPower_Stage2)],
        ['Required Shaft Power', formatNum(stage8Report.stage2.pump_PowerkW_Stage2)]
      ];
      
      yPos = checkPageBreak(doc, yPos, 25);
      autoTable(doc, {
        ...tableConfig,
        startY: yPos,
        body: cleanTableData(stage2Data),
      });
      yPos = (doc.lastAutoTable?.finalY || yPos) + PDF_STYLES.SUBSECTION_SPACING;
    }
    
    // Stage 3 (Growout) Results
    if (stage8Report.stage3) {
      yPos = addSubsectionHeader(doc, 'Stage 3 (Growout) Results', yPos);
      
      const stage3Data = [
        ['Parameter', 'Value'],
        ['Limiting Flow Rate', formatNum(stage8Report.stage3.limitingFlowRateStage3)],
        ['Q_l.s_Stage3', formatNum(stage8Report.stage3.Q_l_s_Stage3)],
        ['Total Dynamic Head Pressure', formatNum(stage8Report.stage3.pump_Head_Stage3)],
        ['Pump Efficiency', formatNum(stage8Report.stage3.n_Pump_Stage3)],
        ['Motor Efficiency', formatNum(stage8Report.stage3.n_Motor_Stage3)],
        ['Hydraulic Power', formatNum(stage8Report.stage3.pump_HydPower_Stage3)],
        ['Required Shaft Power', formatNum(stage8Report.stage3.pump_PowerkW_Stage3)]
      ];
      
      yPos = checkPageBreak(doc, yPos, 25);
      autoTable(doc, {
        ...tableConfig,
        startY: yPos,
        body: cleanTableData(stage3Data),
      });
      yPos = (doc.lastAutoTable?.finalY || yPos) + PDF_STYLES.SUBSECTION_SPACING;
    }
  }
  
  // Footer is now added automatically to all pages via didDrawPage function
  
  return doc;
};

export const generateBasicCompleteReportPdf = (formData, results, basicStep6Results, basicLimitingFactor) => {
  const doc = new jsPDF();
  const margin = PDF_STYLES.MARGIN;
  let yPos = PDF_STYLES.MARGIN;

  // Title
  setTextStyle(doc, PDF_STYLES.TITLE, PDF_STYLES.PRIMARY, true);
  doc.text('Basic Design System Report', margin, yPos);
  yPos += PDF_STYLES.SECTION_SPACING;

  // Timestamp
  setTextStyle(doc, PDF_STYLES.BODY_TEXT, PDF_STYLES.TEXT_GRAY);
  doc.text(`Generated on ${new Date().toLocaleString()}`, margin, yPos);
  yPos += PDF_STYLES.SECTION_SPACING;

  const tableConfig = {
    head: [['Parameter', 'Value']],
    theme: 'grid',
    headStyles: { 
      fillColor: PDF_STYLES.SECONDARY,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: PDF_STYLES.BODY_TEXT,
      font: 'helvetica'
    },
    bodyStyles: {
      fontSize: PDF_STYLES.BODY_TEXT,
      textColor: PDF_STYLES.PRIMARY,
      font: 'helvetica'
    },
    styles: { 
      fontSize: PDF_STYLES.BODY_TEXT,
      cellPadding: 4,
      font: 'helvetica',
      overflow: 'linebreak',
      cellWidth: 'wrap'
    },
    margin: { left: margin },
    tableLineColor: PDF_STYLES.LIGHT_GRAY,
    tableLineWidth: 0.5,
    showHead: 'everyPage',
    startY: false,
    pageBreak: 'auto',
    didDrawPage: function () {
      const pageSize = doc.internal.pageSize;
      const pageHeight = pageSize.height || pageSize.getHeight();
      const pageWidth = pageSize.width || pageSize.getWidth();
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text('Page ' + doc.internal.getNumberOfPages(), pageWidth - 20, pageHeight - 10);
      doc.text('Generated by Aqua BluePrint', 20, pageHeight - 10);
    }
  };

  const formatNum = (n, digits = 2) => (typeof n === 'number' && isFinite(n)) ? n.toFixed(digits) : '-';

  // Project Input Parameters
  yPos = addSectionHeader(doc, 'Project Input Parameters', yPos);

  // Water Quality Parameters
  yPos = addSubsectionHeader(doc, 'Water Quality Parameters', yPos);
  const waterQuality = [
    ['Water Temperature', formData.waterTemp != null ? `${formData.waterTemp}°C` : '-'],
    ['pH', (formData.pH ?? formData.ph) ?? '-'],
    ['Minimum DO', formData.minDO != null ? `${formData.minDO} mg/L` : '-'],
    ['Maximum CO2', formData.maxCO2 != null ? `${formData.maxCO2} mg/L` : '-'],
    ['Maximum TAN', formData.maxTAN != null ? `${formData.maxTAN} mg/L` : '-'],
    ['Minimum TSS', formData.minTSS != null ? `${formData.minTSS} mg/L` : '-'],
    ['Salinity', formData.salinity != null ? `${formData.salinity} ppt` : '-'],
    ['Site Elevation', formData.siteElevation != null ? `${formData.siteElevation} m` : '-']
  ];
  yPos = checkPageBreak(doc, yPos, 25);
  autoTable(doc, { ...tableConfig, startY: yPos, body: cleanTableData(waterQuality) });
  yPos = (doc.lastAutoTable?.finalY || yPos) + PDF_STYLES.SUBSECTION_SPACING;

  // Production Parameters
  yPos = addSubsectionHeader(doc, 'Production Parameters', yPos);
  const production = [
    ['Tank Volume', formData.tankVolume != null ? `${formData.tankVolume} m³` : '-'],
    ['Number of Tanks', formData.numTanks ?? '-'],
    ['Target Fish Weight', formData.targetFishWeight != null ? `${formData.targetFishWeight} g` : '-'],
    ['Number of Fish', formData.targetNumFish ?? '-'],
    ['Feed Rate', formData.feedRate != null ? `${formData.feedRate}%` : '-'],
    ['Feed Protein', formData.feedProtein != null ? `${formData.feedProtein}%` : '-'],
    ['Feed Conversion Ratio', formData.feedConversionRatio != null ? `${formData.feedConversionRatio}` : '-']
  ];
  yPos = checkPageBreak(doc, yPos, 25);
  autoTable(doc, { ...tableConfig, startY: yPos, body: cleanTableData(production) });
  yPos = (doc.lastAutoTable?.finalY || yPos) + PDF_STYLES.SUBSECTION_SPACING;

  // Stage-wise Parameters
  yPos = addSubsectionHeader(doc, 'Stage-wise Parameters', yPos);
  const stageWise = [
    ['FCR Stage 1', formData.FCR_Stage1 != null ? `${formData.FCR_Stage1}` : '-'],
    ['FCR Stage 2', formData.FCR_Stage2 != null ? `${formData.FCR_Stage2}` : '-'],
    ['FCR Stage 3', formData.FCR_Stage3 != null ? `${formData.FCR_Stage3}` : '-'],
    ['Feed Protein Stage 1', formData.FeedProtein_Stage1 != null ? `${formData.FeedProtein_Stage1}%` : '-'],
    ['Feed Protein Stage 2', formData.FeedProtein_Stage2 != null ? `${formData.FeedProtein_Stage2}%` : '-'],
    ['Feed Protein Stage 3', formData.FeedProtein_Stage3 != null ? `${formData.FeedProtein_Stage3}%` : '-'],
    ['Estimated Mortality Stage 1', formData.Estimated_mortality_Stage1 != null ? `${formData.Estimated_mortality_Stage1}%` : '-'],
    ['Estimated Mortality Stage 2', formData.Estimated_mortality_Stage2 != null ? `${formData.Estimated_mortality_Stage2}%` : '-'],
    ['Estimated Mortality Stage 3', formData.Estimated_mortality_Stage3 != null ? `${formData.Estimated_mortality_Stage3}%` : '-']
  ];
  yPos = checkPageBreak(doc, yPos, 30);
  autoTable(doc, { ...tableConfig, startY: yPos, body: cleanTableData(stageWise) });
  yPos = (doc.lastAutoTable?.finalY || yPos) + PDF_STYLES.SUBSECTION_SPACING;

  // System Efficiency Parameters
  yPos = addSubsectionHeader(doc, 'System Efficiency Parameters', yPos);
  const efficiency = [
    ['O2 Absorption', formData.o2Absorption != null ? `${formData.o2Absorption}%` : '-'],
    ['CO2 Removal', formData.co2Removal != null ? `${formData.co2Removal}%` : '-'],
    ['TAN Removal', formData.tanRemoval != null ? `${formData.tanRemoval}%` : '-'],
    ['TSS Removal', formData.tssRemoval != null ? `${formData.tssRemoval}%` : '-']
  ];
  yPos = checkPageBreak(doc, yPos, 25);
  autoTable(doc, { ...tableConfig, startY: yPos, body: cleanTableData(efficiency) });
  yPos = (doc.lastAutoTable?.finalY || yPos) + PDF_STYLES.SECTION_SPACING;

  // Mass Balance Report (from results)
  yPos = addSectionHeader(doc, 'Mass Balance Report', yPos);
  const oxy = results?.oxygen || {};
  const tss = results?.tss || {};
  const co2 = results?.co2 || {};
  const tan = results?.tan || {};

  const o2Effluent = (oxy.effluentMgL ?? oxy.effluentConc ?? 0);
  const o2ProdMg = (oxy.consMgPerDay ?? oxy.prodMgPerDay ?? 0);
  const o2ProdKg = (oxy.consKgPerDay ?? oxy.prodKgPerDay ?? (o2ProdMg / 1_000_000));
  const o2SatAdj = (oxy.saturationAdjustedMgL ?? 0);
  const o2MinDoUse = (oxy.MINDO_use ?? null);

  const tssEffluent = (tss.effluentMgL ?? tss.effluentConc ?? 0);
  const tssProdMg = (tss.prodMgPerDay ?? 0);
  const tssProdKg = (tss.prodKgPerDay ?? (tssProdMg / 1_000_000));
  const tssMaxUse = (tss.MAXTSS_use ?? null);

  const co2Effluent = (co2.effluentMgL ?? co2.effluentConc ?? 0);
  const co2ProdMg = (co2.prodMgPerDay ?? 0);
  const co2ProdKg = (co2.prodKgPerDay ?? (co2ProdMg / 1_000_000));
  const co2MaxUse = (co2.MAXCO2_use ?? null);

  const tanEffluent = (tan.effluentMgL ?? tan.effluentConc ?? 0);
  const tanProdMg = (tan.prodMgPerDay ?? 0);
  const tanProdKg = (tan.prodKgPerDay ?? (tanProdMg / 1_000_000));
  const tanMaxUse = (tan.MAXTAN_use ?? null);

  const massBalanceResults = [
    ['Oxygen - O₂ Saturation Adjusted', `${formatNum(o2SatAdj)} mg/L`],
    ['Oxygen - Min DO (use)', o2MinDoUse != null ? `${o2MinDoUse} mg/L` : '-'],
    ['Oxygen - Effluent Conc.', `${formatNum(o2Effluent)} mg/L`],
    ['Oxygen - Consumption (mg/day)', `${formatNum(o2ProdMg, 0)} mg/day`],
    ['Oxygen - Consumption (kg/day)', `${formatNum(o2ProdKg)} kg/day`],
    ['TSS - Max TSS (use)', tssMaxUse != null ? `${tssMaxUse} mg/L` : '-'],
    ['TSS - Effluent Conc.', `${formatNum(tssEffluent)} mg/L`],
    ['TSS - Production (mg/day)', `${formatNum(tssProdMg, 0)} mg/day`],
    ['TSS - Production (kg/day)', `${formatNum(tssProdKg)} kg/day`],
    ['CO2 - Max CO2 (use)', co2MaxUse != null ? `${co2MaxUse} mg/L` : '-'],
    ['CO2 - Effluent Conc.', `${formatNum(co2Effluent)} mg/L`],
    ['CO2 - Production (mg/day)', `${formatNum(co2ProdMg, 0)} mg/day`],
    ['CO2 - Production (kg/day)', `${formatNum(co2ProdKg)} kg/day`],
    ['TAN - Max TAN (use)', tanMaxUse != null ? `${tanMaxUse} mg/L` : '-'],
    ['TAN - Effluent Conc.', `${formatNum(tanEffluent)} mg/L`],
    ['TAN - Production (mg/day)', `${formatNum(tanProdMg, 0)} mg/day`],
    ['TAN - Production (kg/day)', `${formatNum(tanProdKg)} kg/day`]
  ];
  yPos = checkPageBreak(doc, yPos, 40);
  autoTable(doc, { ...tableConfig, startY: yPos, body: cleanTableData(massBalanceResults) });
  yPos = (doc.lastAutoTable?.finalY || yPos) + PDF_STYLES.SECTION_SPACING;

  // Controlling Flow Rate: Juvenile (basicStep6Results.step_6)
  if (basicStep6Results && basicStep6Results.step_6) {
    const s1 = basicStep6Results.step_6;
    yPos = addSectionHeader(doc, 'Controlling Flow Rate: Juvenile', yPos);

    const stage1Rows = [
      ['Oxygen - L/min', formatNum(s1.oxygen?.l_per_min)],
      ['Oxygen - m3/hr', formatNum(s1.oxygen?.m3_per_hr)],
      ['CO2 - L/min', formatNum(s1.co2?.l_per_min)],
      ['CO2 - m3/hr', formatNum(s1.co2?.m3_per_hr)],
      ['TSS - L/min', formatNum(s1.tss?.l_per_min)],
      ['TSS - m3/hr', formatNum(s1.tss?.m3_per_hr)],
      ['TAN - L/min', formatNum(s1.tan?.l_per_min)],
      ['TAN - m3/hr', formatNum(s1.tan?.m3_per_hr)],
    ];

    yPos = checkPageBreak(doc, yPos, 30);
    autoTable(doc, { ...tableConfig, startY: yPos, body: cleanTableData(stage1Rows) });
    yPos = (doc.lastAutoTable?.finalY || yPos) + PDF_STYLES.SECTION_SPACING;
  }

  // Limiting Factor (Juvenile)
  if (basicLimitingFactor && basicLimitingFactor.stage1) {
    const lf = basicLimitingFactor.stage1;
    yPos = addSectionHeader(doc, 'Limiting Factor (Juvenile)', yPos);

    const lfRows = [
      ['Factor', lf.factor || '-'],
      ['Flow (L/min)', formatNum(lf.flow_l_per_min)],
      ['Flow (m3/hr)', formatNum(lf.flow_m3_per_hr)]
    ];

    yPos = checkPageBreak(doc, yPos, 20);
    autoTable(doc, { ...tableConfig, startY: yPos, body: cleanTableData(lfRows) });
    yPos = (doc.lastAutoTable?.finalY || yPos) + PDF_STYLES.SECTION_SPACING;
  }

  return doc;
};