import { AttendanceRecord, RiskAnalysisItem, AIPredictionResult } from '../types/attendance';

export const ExportService = {
  /**
   * Download a string content as a file in the browser.
   */
  downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /**
   * Export attendance records to CSV.
   */
  exportAttendanceToCSV(records: AttendanceRecord[], filename: string = 'attendance_history.csv') {
    const headers = ['Record ID', 'UID', 'Student Name', 'Status', 'Date', 'Day of Week', 'Time', 'Timestamp', 'Device ID', 'Verification'];
    const rows = records.map(r => [
      `"${r.id}"`,
      `"${r.uid}"`,
      `"${r.studentName}"`,
      `"${r.status}"`,
      `"${r.date}"`,
      `"${r.dayOfWeek}"`,
      `"${r.time}"`,
      `"${r.timestamp}"`,
      `"${r.deviceId || 'ESP32_RC522'}"`,
      `"${r.verifiedVia}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\r\n');
    this.downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
  },

  /**
   * Export attendance records to Excel-compatible XML format.
   */
  exportAttendanceToExcel(records: AttendanceRecord[], filename: string = 'attendance_history.xls') {
    let xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Header">
   <Font ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#1E293B" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center"/>
  </Style>
  <Style ss:ID="Present"><Font ss:Color="#059669"/></Style>
  <Style ss:ID="Absent"><Font ss:Color="#DC2626"/></Style>
  <Style ss:ID="Late"><Font ss:Color="#D97706"/></Style>
 </Styles>
 <Worksheet ss:Name="Attendance Logs">
  <Table>
   <Row ss:StyleID="Header">
    <Cell><Data ss:Type="String">UID</Data></Cell>
    <Cell><Data ss:Type="String">Student Name</Data></Cell>
    <Cell><Data ss:Type="String">Status</Data></Cell>
    <Cell><Data ss:Type="String">Date</Data></Cell>
    <Cell><Data ss:Type="String">Day</Data></Cell>
    <Cell><Data ss:Type="String">Time</Data></Cell>
    <Cell><Data ss:Type="String">Verification</Data></Cell>
    <Cell><Data ss:Type="String">ISO Timestamp</Data></Cell>
   </Row>`;

    for (const r of records) {
      const style = r.status === 'Present' ? 'Present' : r.status === 'Absent' ? 'Absent' : 'Late';
      xml += `
   <Row>
    <Cell><Data ss:Type="String">${r.uid}</Data></Cell>
    <Cell><Data ss:Type="String">${r.studentName}</Data></Cell>
    <Cell ss:StyleID="${style}"><Data ss:Type="String">${r.status}</Data></Cell>
    <Cell><Data ss:Type="String">${r.date}</Data></Cell>
    <Cell><Data ss:Type="String">${r.dayOfWeek}</Data></Cell>
    <Cell><Data ss:Type="String">${r.time}</Data></Cell>
    <Cell><Data ss:Type="String">${r.verifiedVia}</Data></Cell>
    <Cell><Data ss:Type="String">${r.timestamp}</Data></Cell>
   </Row>`;
    }

    xml += `
  </Table>
 </Worksheet>
</Workbook>`;

    this.downloadFile(xml, filename, 'application/vnd.ms-excel;charset=utf-8;');
  },

  /**
   * Export student risk assessment report to CSV.
   */
  exportRiskAnalysisToCSV(items: RiskAnalysisItem[], filename: string = 'student_risk_assessment_report.csv') {
    const headers = [
      'UID',
      'Student Name',
      'Current Attendance %',
      'Risk Classification',
      'Consecutive Absences',
      'Classes Needed for 75%',
      'Buffer Absences Allowed',
      'Trend Trajectory',
      'Warning Level'
    ];

    const rows = items.map(item => [
      `"${item.uid}"`,
      `"${item.name}"`,
      `"${item.currentPercentage}%"`,
      `"${item.riskLevel}"`,
      item.consecutiveAbsences,
      item.classesNeededFor75,
      item.safeAbsencesAllowed,
      `"${item.trend}"`,
      `"${item.warningLevel}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\r\n');
    this.downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
  },

  /**
   * Export AI Predictions to CSV.
   */
  exportPredictionsToCSV(predictions: AIPredictionResult[], filename: string = 'ai_random_forest_predictions.csv') {
    const headers = [
      'UID',
      'Student Name',
      'Predicted Status Next Class',
      'RF Confidence %',
      'Risk Level',
      'Current %',
      'Projected %',
      'Early Warning Triggered',
      'Primary AI Insight'
    ];

    const rows = predictions.map(p => [
      `"${p.uid}"`,
      `"${p.studentName}"`,
      `"${p.predictedStatus}"`,
      `"${p.confidencePercentage}%"`,
      `"${p.attendanceRisk}"`,
      `"${p.currentAttendancePercentage}%"`,
      `"${p.projectedAttendancePercentage}%"`,
      p.earlyWarning ? 'YES' : 'NO',
      `"${(p.personalizedInsights[0] || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\r\n');
    this.downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
  }
};
