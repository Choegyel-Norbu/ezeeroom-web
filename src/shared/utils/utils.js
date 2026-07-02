import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import * as XLSX from 'xlsx';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Validates file sizes against a maximum limit
 * @param {File[]} files - Array of files to validate
 * @param {number} maxSizeMB - Maximum file size in MB (default: 4MB)
 * @returns {Object} - Validation result with isValid boolean and error details
 */
export function validateFileSizes(files, maxSizeMB = 4) {
  const maxFileSize = maxSizeMB * 1024 * 1024; // Convert MB to bytes
  const oversizedFiles = files.filter(file => file.size > maxFileSize);
  
  if (oversizedFiles.length > 0) {
    const fileNames = oversizedFiles.map(file => file.name).join(', ');
    return {
      isValid: false,
      error: {
        title: `File size too large: ${fileNames}`,
        description: `Each file must be smaller than ${maxSizeMB}MB. Please compress your files and try again.`
      },
      oversizedFiles
    };
  }
  
  return {
    isValid: true,
    error: null,
    oversizedFiles: []
  };
}

/**
 * Formats file size in human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size (e.g., "2.5 MB")
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Exports data to Excel file with professional formatting
 * @param {Array} data - Array of data objects to export
 * @param {string} filename - Name of the file (without extension)
 * @param {string} sheetName - Name of the worksheet
 * @param {Object} options - Additional options for formatting
 */
export function exportToExcel(data, filename = 'export', sheetName = 'Sheet1', options = {}) {
  try {
    // Create a new workbook
    const workbook = XLSX.utils.book_new();
    
    // Convert data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Apply column widths if provided
    if (options.columnWidths) {
      worksheet['!cols'] = options.columnWidths;
    } else {
      // Auto-size columns based on content
      const colWidths = [];
      if (data.length > 0) {
        Object.keys(data[0]).forEach((key, index) => {
          const maxLength = Math.max(
            key.length,
            ...data.map(row => String(row[key] || '').length)
          );
          colWidths[index] = { wch: Math.min(maxLength + 2, 50) };
        });
        worksheet['!cols'] = colWidths;
      }
    }
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // Generate Excel file and trigger download
    const excelBuffer = XLSX.write(workbook, { 
      bookType: 'xlsx', 
      type: 'array',
      cellStyles: true 
    });
    
    // Create blob and download
    const blob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return { success: true, message: 'Excel file downloaded successfully' };
  } catch (error) {
    
    return { success: false, message: 'Failed to export Excel file', error };
  }
}

/**
 * Exports monthly performance data to Excel with proper formatting
 * @param {Array} performanceData - Array of monthly performance data
 * @param {string} hotelName - Name of the hotel for filename
 * @param {string} dateRange - Date range for the report
 */
export function exportMonthlyPerformanceToExcel(performanceData, hotelName = 'Hotel', dateRange = '') {
  if (!performanceData || performanceData.length === 0) {
    return { success: false, message: 'No data available to export' };
  }
  
  // Prepare data for Excel export with proper column names and formatting
  const excelData = performanceData.map((item, index) => ({
    'S.No': index + 1,
    'Month': item.displayMonth || item.monthYear,
    'Hotel Name': item.hotelName || hotelName,
    'Total Revenue (Nu.)': item.totalRevenue || 0,
    'Booking Count': item.bookingCount || 0,
    'Average Booking Value (Nu.)': item.averageBookingValue || 0,
    'Revenue per Booking (Nu.)': item.totalRevenue && item.bookingCount 
      ? Math.round(item.totalRevenue / item.bookingCount) 
      : 0
  }));
  
  // Add summary row
  const totalRevenue = performanceData.reduce((sum, item) => sum + (item.totalRevenue || 0), 0);
  const totalBookings = performanceData.reduce((sum, item) => sum + (item.bookingCount || 0), 0);
  const avgBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;
  
  excelData.push({
    'S.No': '',
    'Month': 'TOTAL',
    'Hotel Name': '',
    'Total Revenue (Nu.)': totalRevenue,
    'Booking Count': totalBookings,
    'Average Booking Value (Nu.)': Math.round(avgBookingValue),
    'Revenue per Booking (Nu.)': Math.round(avgBookingValue)
  });
  
  // Generate filename with hotel name and date
  const sanitizedHotelName = hotelName.replace(/[^a-zA-Z0-9]/g, '_');
  const dateStr = dateRange ? `_${dateRange}` : `_${new Date().toISOString().split('T')[0]}`;
  const filename = `Monthly_Performance_Report_${sanitizedHotelName}${dateStr}`;
  
  // Column widths for better formatting
  const columnWidths = [
    { wch: 8 },   // S.No
    { wch: 15 },  // Month
    { wch: 25 },  // Hotel Name
    { wch: 20 },  // Total Revenue
    { wch: 15 },  // Booking Count
    { wch: 25 },  // Average Booking Value
    { wch: 25 }   // Revenue per Booking
  ];
  
  return exportToExcel(excelData, filename, 'Monthly Performance', { columnWidths });
}

/**
 * Converts 24-hour time format to 12-hour format with AM/PM
 * @param {string} time24 - Time in 24-hour format (e.g., "19:00", "09:30", "00:00")
 * @returns {string} - Time in 12-hour format (e.g., "7:00 PM", "9:30 AM", "12:00 AM")
 */
export function formatTimeTo12Hour(time24) {
  if (!time24) return '';
  
  // Handle different time formats (HH:MM:SS or HH:MM)
  let time = time24;
  if (time.includes(':') && time.split(':').length === 3) {
    time = time.substring(0, 5); // Remove seconds
  }
  
  const [hours, minutes] = time.split(':').map(Number);
  
  if (isNaN(hours) || isNaN(minutes)) return time24;
  
  let period = 'AM';
  let displayHours = hours;
  
  if (hours === 0) {
    displayHours = 12; // Midnight
  } else if (hours === 12) {
    period = 'PM'; // Noon
  } else if (hours > 12) {
    displayHours = hours - 12;
    period = 'PM';
  }
  
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Formats a time range from 24-hour to 12-hour format
 * @param {string} startTime - Start time in 24-hour format
 * @param {string} endTime - End time in 24-hour format
 * @returns {string} - Formatted time range (e.g., "7:00 PM - 8:00 PM")
 */
export function formatTimeRangeTo12Hour(startTime, endTime) {
  if (!startTime || !endTime) return '';
  
  const formattedStart = formatTimeTo12Hour(startTime);
  const formattedEnd = formatTimeTo12Hour(endTime);
  
  return `${formattedStart} - ${formattedEnd}`;
}
