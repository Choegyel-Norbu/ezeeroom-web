import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { Calendar, TrendingUp, Download, XCircle } from "lucide-react";
import * as XLSX from 'xlsx';
import api from "../../shared/services/Api";

// Earliest date booking data exists for (system launch). Used as the picker floor.
const DATA_START_DATE = "2025-01-01";

// Default the picker to the start of the trailing 12-month window (first of the
// month, 11 months ago), but never before DATA_START_DATE. Computed at runtime
// so the dashboard stays current as time passes instead of anchoring to a fixed
// past date.
const getDefaultStartDate = () => {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 11);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const trailing = `${y}-${m}-01`;
  return trailing < DATA_START_DATE ? DATA_START_DATE : trailing;
};

const MonthlyPerformanceChart = ({ hotelId }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(getDefaultStartDate);

  const hotelName = data.length > 0 ? data[0].hotelName : "Hotel";

  const formatMonthYear = (monthYear) => {
    const date = new Date(monthYear + "-01");
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  };

  const chartData = data.map((item) => ({
    ...item,
    displayMonth: formatMonthYear(item.monthYear),
  }));

  // Custom label: booking count + avg value above bars
  const CustomLabel = (props) => {
    const { x, y, width, payload } = props;
    if (!payload) return null;
    return (
      <g>
        <text x={x + width / 2} y={y - 22} fill="#a3a3a3" textAnchor="middle" fontSize="11" fontWeight="500">
          {payload.bookingCount} bookings
        </text>
        <text x={x + width / 2} y={y - 8} fill="#d4d4d4" textAnchor="middle" fontSize="10" fontWeight="500">
          Nu. {payload.averageBookingValue?.toLocaleString()}
        </text>
      </g>
    );
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-white border border-neutral-200 rounded-md px-3 py-2.5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400 mb-2">{label}</p>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-6">
              <span className="text-[12px] text-neutral-500">Total Revenue</span>
              <span className="text-[12px] font-semibold text-neutral-950 tabular-nums">
                Nu. {d.totalRevenue?.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between gap-6">
              <span className="text-[12px] text-neutral-500">Bookings</span>
              <span className="text-[12px] font-semibold text-neutral-950 tabular-nums">{d.bookingCount}</span>
            </div>
            <div className="flex items-center justify-between gap-6">
              <span className="text-[12px] text-neutral-500">Avg. Value</span>
              <span className="text-[12px] font-semibold text-neutral-950 tabular-nums">
                Nu. {d.averageBookingValue?.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const fetchPerformanceData = async () => {
    if (!hotelId) { setLoading(false); return; }
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/booking-statistics/revenue/monthly/${hotelId}?startDate=${selectedDate}`);
      const result = res.data;
      if (!Array.isArray(result)) throw new Error("Invalid API response: Expected an array of performance data");
      const processedData = result
        .map((item) => {
          if (!item.monthYear || typeof item.totalRevenue !== "number") return null;
          return { ...item, displayMonth: formatMonthYear(item.monthYear) };
        })
        .filter(Boolean);
      if (processedData.length === 0) throw new Error("No valid performance data received from API");
      setData(processedData);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => { fetchPerformanceData(); }, [selectedDate, hotelId]);

  const exportToExcel = () => {
    if (!data || data.length === 0) { alert("No data available to export"); return; }
    try {
      const exportData = data.map((item, index) => ({
        'S.No': index + 1,
        'Month': item.displayMonth || item.monthYear,
        'Hotel Name': item.hotelName || hotelName || 'Hotel',
        'Total Revenue (Nu.)': item.totalRevenue || 0,
        'Booking Count': item.bookingCount || 0,
        'Average Booking Value (Nu.)': item.averageBookingValue || 0,
        'Revenue per Booking (Nu.)': item.totalRevenue && item.bookingCount
          ? Math.round(item.totalRevenue / item.bookingCount)
          : 0,
      }));
      const totalRevenue = data.reduce((sum, item) => sum + (item.totalRevenue || 0), 0);
      const totalBookings = data.reduce((sum, item) => sum + (item.bookingCount || 0), 0);
      const avgBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;
      exportData.push({});
      exportData.push({ 'S.No': '', 'Month': 'SUMMARY STATISTICS', 'Hotel Name': '', 'Total Revenue (Nu.)': '', 'Booking Count': '', 'Average Booking Value (Nu.)': '', 'Revenue per Booking (Nu.)': '' });
      exportData.push({ 'S.No': '', 'Month': 'Total Revenue', 'Hotel Name': '', 'Total Revenue (Nu.)': totalRevenue, 'Booking Count': '', 'Average Booking Value (Nu.)': '', 'Revenue per Booking (Nu.)': '' });
      exportData.push({ 'S.No': '', 'Month': 'Total Bookings', 'Hotel Name': '', 'Total Revenue (Nu.)': '', 'Booking Count': totalBookings, 'Average Booking Value (Nu.)': '', 'Revenue per Booking (Nu.)': '' });
      exportData.push({ 'S.No': '', 'Month': 'Average Booking Value', 'Hotel Name': '', 'Total Revenue (Nu.)': '', 'Booking Count': '', 'Average Booking Value (Nu.)': Math.round(avgBookingValue), 'Revenue per Booking (Nu.)': '' });
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);
      ws['!cols'] = [{ wch: 8 }, { wch: 15 }, { wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 25 }, { wch: 25 }];
      XLSX.utils.book_append_sheet(wb, ws, "Monthly Performance");
      const sanitizedHotelName = (hotelName || 'Hotel').replace(/[^a-zA-Z0-9]/g, '_');
      const currentDate = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `monthly-performance-report-${sanitizedHotelName}-${currentDate}.xlsx`);
    } catch {
      alert("Failed to export data. Please try again.");
    }
  };

  // Derived stats (from last month in dataset)
  const lastMonth = chartData[chartData.length - 1];
  const totalRevAll = chartData.reduce((sum, item) => sum + (item.totalRevenue || 0), 0);
  const totalBkgsAll = chartData.reduce((sum, item) => sum + (item.bookingCount || 0), 0);
  const avgBkgValueAll = totalBkgsAll > 0 ? Math.round(totalRevAll / totalBkgsAll) : 0;

  return (
    <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">

      {/* Header */}
      <div className="px-5 py-4 border-b border-neutral-100">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <TrendingUp className="h-[14px] w-[14px] text-neutral-500" />
            <h3 className="text-[13px] font-semibold text-neutral-950">Monthly Performance</h3>
            {data.length > 0 && (
              <span className="inline-flex items-center rounded bg-neutral-100 px-1.5 py-0.5 text-[11px] font-medium text-neutral-600">
                {hotelName}
              </span>
            )}
          </div>
          <button
            onClick={exportToExcel}
            disabled={loading || !data.length}
            className="flex items-center gap-1.5 h-7 px-3 rounded-md border border-neutral-200 bg-white text-[12px] font-medium text-neutral-600 hover:bg-neutral-50 transition-colors disabled:opacity-40 flex-shrink-0"
          >
            <Download className="h-3.5 w-3.5" />
            Export Excel
          </button>
        </div>

        {/* Date picker */}
        <div className="flex items-center gap-1.5 mt-3">
          <Calendar className="h-3.5 w-3.5 text-neutral-400" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={DATA_START_DATE}
            className="h-7 rounded-md border border-neutral-200 bg-neutral-50 px-2.5 text-[12px] text-neutral-950 focus:outline-none focus:border-neutral-400 transition-colors"
          />
          <span className="text-[11px] text-neutral-400">Select start date</span>
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <div className="flex items-center justify-center h-64 gap-2.5 text-neutral-500">
          <span className="animate-spin rounded-full h-5 w-5 border-2 border-neutral-200 border-t-neutral-950" />
          <span className="text-[13px]">Loading performance data…</span>
        </div>
      ) : error ? (
        <div className="mx-5 my-4 flex items-start gap-3 rounded-lg border border-neutral-200 border-l-2 border-l-red-500 bg-white px-4 py-3">
          <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-[13px] font-medium text-neutral-950">Failed to load performance data</p>
            <p className="text-[12px] text-neutral-500 mt-0.5 leading-snug">{error}</p>
            <button
              onClick={fetchPerformanceData}
              className="mt-2 text-[12px] font-medium text-neutral-950 underline underline-offset-2 hover:no-underline transition-all"
            >
              Try again
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Chart */}
          <div className="px-2 pt-5 pb-0">
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 55, right: 16, left: -8, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
                  <XAxis
                    dataKey="displayMonth"
                    tick={{ fontSize: 11, fill: "#a3a3a3" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#a3a3a3" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `Nu. ${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f5f5f5" }} />
                  <Bar dataKey="totalRevenue" fill="#171717" radius={[2, 2, 0, 0]} name="totalRevenue">
                    <LabelList content={<CustomLabel />} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-5 px-5 pt-3 pb-1">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-3 rounded-sm bg-neutral-900 inline-block" />
              <span className="text-[11px] text-neutral-500">Total Revenue</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-[1px] w-3 bg-neutral-400 inline-block" />
              <span className="text-[11px] text-neutral-400">Booking count</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-[1px] w-3 bg-neutral-300 inline-block" />
              <span className="text-[11px] text-neutral-400">Avg. value</span>
            </div>
          </div>

          {/* Summary stats */}
          {chartData.length > 0 && (
            <div className="grid grid-cols-3 border-t border-neutral-100 mt-4">
              <div className="px-5 py-4 border-r border-neutral-100">
                <p className="text-[11px] font-medium uppercase tracking-widest text-neutral-400">Total Revenue</p>
                <p className="text-[18px] font-semibold text-neutral-950 tabular-nums mt-0.5 leading-none">
                  Nu. {totalRevAll.toLocaleString()}
                </p>
                <p className="text-[11px] text-neutral-400 mt-1">{chartData.length} months</p>
              </div>
              <div className="px-5 py-4 border-r border-neutral-100">
                <p className="text-[11px] font-medium uppercase tracking-widest text-neutral-400">Total Bookings</p>
                <p className="text-[18px] font-semibold text-neutral-950 tabular-nums mt-0.5 leading-none">
                  {totalBkgsAll.toLocaleString()}
                </p>
                <p className="text-[11px] text-neutral-400 mt-1">across period</p>
              </div>
              <div className="px-5 py-4">
                <p className="text-[11px] font-medium uppercase tracking-widest text-neutral-400">Avg. Booking Value</p>
                <p className="text-[18px] font-semibold text-neutral-950 tabular-nums mt-0.5 leading-none">
                  Nu. {avgBkgValueAll.toLocaleString()}
                </p>
                <p className="text-[11px] text-neutral-400 mt-1">per booking</p>
              </div>
            </div>
          )}
        </>
      )}

    </div>
  );
};

export default MonthlyPerformanceChart;
