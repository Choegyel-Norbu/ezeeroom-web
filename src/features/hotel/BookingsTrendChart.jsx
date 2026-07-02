import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Calendar,
  TrendingUp,
  BarChart3,
  LineChart as LineChartIcon,
  Download,
  XCircle,
} from "lucide-react";
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

const BookingsTrendChart = ({ hotelId }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartType, setChartType] = useState("bar");
  const [selectedDate, setSelectedDate] = useState(getDefaultStartDate);

  const formatMonthLabel = (monthString) => {
    const date = new Date(monthString + "-01");
    return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
  };

  const exportToExcel = () => {
    if (!data || data.length === 0) {
      alert("No data available to export");
      return;
    }
    try {
      const exportData = data.map((item, index) => ({
        'Month': item.monthLabel,
        'Month-Year': item.month,
        'Total Bookings': item.bookings,
        'Rank': index + 1,
      }));
      const totalBookings = data.reduce((sum, item) => sum + item.bookings, 0);
      const averageBookings = Math.round(totalBookings / data.length);
      const peakBookings = Math.max(...data.map((item) => item.bookings));
      const peakMonth = data.find(item => item.bookings === peakBookings)?.monthLabel || 'N/A';
      exportData.push({});
      exportData.push({ 'Month': 'SUMMARY STATISTICS', 'Month-Year': '', 'Total Bookings': '', 'Rank': '' });
      exportData.push({ 'Month': `Total Bookings (${data.length} ${data.length === 1 ? 'month' : 'months'})`, 'Month-Year': '', 'Total Bookings': totalBookings, 'Rank': '' });
      exportData.push({ 'Month': 'Average per Month', 'Month-Year': '', 'Total Bookings': averageBookings, 'Rank': '' });
      exportData.push({ 'Month': 'Peak Month', 'Month-Year': peakMonth, 'Total Bookings': peakBookings, 'Rank': '' });
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);
      ws['!cols'] = [{ wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 8 }];
      XLSX.utils.book_append_sheet(wb, ws, "Booking Trends");
      const currentDate = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `booking-trends-report-${currentDate}.xlsx`);
    } catch {
      alert("Failed to export data. Please try again.");
    }
  };

  const fetchBookingsData = async () => {
    if (!hotelId) { setLoading(false); return; }
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/booking-statistics/monthly/hotel/${hotelId}?startDate=${selectedDate}`);
      const result = res.data;
      if (!Array.isArray(result)) throw new Error("Invalid API response: Expected an array of booking data");
      const processedData = result
        .map((item) => {
          if (!item.monthYear || typeof item.bookingCount !== "number") return null;
          return { month: item.monthYear, bookings: item.bookingCount, monthLabel: formatMonthLabel(item.monthYear) };
        })
        .filter(Boolean);
      if (processedData.length === 0) throw new Error("No valid booking data received from API");
      setData(processedData);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookingsData(); }, [selectedDate, hotelId]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-neutral-200 rounded-md px-3 py-2.5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400 mb-1.5">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-[14px] font-semibold text-neutral-950 tabular-nums">
              {entry.value}{" "}
              <span className="text-[11px] font-normal text-neutral-500">bookings</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Derived stats
  const totalBookings = data.reduce((sum, item) => sum + item.bookings, 0);
  const avgBookings = data.length > 0 ? Math.round(totalBookings / data.length) : 0;
  const peakBookings = data.length > 0 ? Math.max(...data.map(i => i.bookings)) : 0;
  const peakMonthItem = data.find(item => item.bookings === peakBookings);
  const peakMonthLabel = peakMonthItem?.monthLabel || '—';

  const chartSharedProps = {
    data,
    margin: { top: 10, right: 16, left: -8, bottom: 0 },
  };

  const axisProps = {
    tick: { fontSize: 11, fill: "#a3a3a3" },
    tickLine: false,
    axisLine: false,
  };

  return (
    <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">

      {/* Header */}
      <div className="px-5 py-4 border-b border-neutral-100">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-[14px] w-[14px] text-neutral-500" />
            <h3 className="text-[13px] font-semibold text-neutral-950">Monthly Booking Trends</h3>
          </div>
          <button
            onClick={exportToExcel}
            disabled={loading || !data.length}
            className="flex items-center gap-1.5 h-7 px-3 rounded-md border border-neutral-200 bg-white text-[12px] font-medium text-neutral-600 hover:bg-neutral-50 transition-colors disabled:opacity-40"
          >
            <Download className="h-3.5 w-3.5" />
            Export Excel
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-3">
          {/* Bar / Line toggle */}
          <div className="flex rounded-md border border-neutral-200 overflow-hidden h-7">
            <button
              onClick={() => setChartType("bar")}
              className={`flex items-center gap-1.5 px-3 text-[12px] font-medium transition-colors ${
                chartType === "bar"
                  ? "bg-neutral-950 text-white"
                  : "bg-white text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              <BarChart3 className="h-3 w-3" />
              Bar
            </button>
            <button
              onClick={() => setChartType("line")}
              className={`flex items-center gap-1.5 px-3 text-[12px] font-medium border-l border-neutral-200 transition-colors ${
                chartType === "line"
                  ? "bg-neutral-950 text-white"
                  : "bg-white text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              <LineChartIcon className="h-3 w-3" />
              Line
            </button>
          </div>

          {/* Date picker */}
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-neutral-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={DATA_START_DATE}
              className="h-7 rounded-md border border-neutral-200 bg-neutral-50 px-2.5 text-[12px] text-neutral-950 focus:outline-none focus:border-neutral-400 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <div className="flex items-center justify-center h-64 gap-2.5 text-neutral-500">
          <span className="animate-spin rounded-full h-5 w-5 border-2 border-neutral-200 border-t-neutral-950" />
          <span className="text-[13px]">Loading booking data…</span>
        </div>
      ) : error ? (
        <div className="mx-5 my-4 flex items-start gap-3 rounded-lg border border-neutral-200 border-l-2 border-l-red-500 bg-white px-4 py-3">
          <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-[13px] font-medium text-neutral-950">Failed to load booking data</p>
            <p className="text-[12px] text-neutral-500 mt-0.5 leading-snug">{error}</p>
            <button
              onClick={fetchBookingsData}
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
            <div className="h-64 md:h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === "bar" ? (
                  <BarChart {...chartSharedProps}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
                    <XAxis dataKey="monthLabel" {...axisProps} />
                    <YAxis {...axisProps} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f5f5f5" }} />
                    <Bar dataKey="bookings" name="Bookings" fill="#171717" radius={[2, 2, 0, 0]} />
                  </BarChart>
                ) : (
                  <LineChart {...chartSharedProps}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
                    <XAxis dataKey="monthLabel" {...axisProps} />
                    <YAxis {...axisProps} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="bookings"
                      name="Bookings"
                      stroke="#171717"
                      strokeWidth={2}
                      dot={{ fill: "#171717", strokeWidth: 0, r: 3 }}
                      activeDot={{ r: 5, fill: "#171717", strokeWidth: 0 }}
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-3 border-t border-neutral-100 mt-4">
            <div className="px-5 py-4 border-r border-neutral-100">
              <p className="text-[11px] font-medium uppercase tracking-widest text-neutral-400">Total Bookings</p>
              <p className="text-[22px] font-semibold text-neutral-950 tabular-nums mt-0.5 leading-none">
                {totalBookings.toLocaleString()}
              </p>
              <p className="text-[11px] text-neutral-400 mt-1">
                {data.length} {data.length === 1 ? "month" : "months"}
              </p>
            </div>
            <div className="px-5 py-4 border-r border-neutral-100">
              <p className="text-[11px] font-medium uppercase tracking-widest text-neutral-400">Avg / Month</p>
              <p className="text-[22px] font-semibold text-neutral-950 tabular-nums mt-0.5 leading-none">
                {avgBookings.toLocaleString()}
              </p>
            </div>
            <div className="px-5 py-4">
              <p className="text-[11px] font-medium uppercase tracking-widest text-neutral-400">Peak Month</p>
              <p className="text-[22px] font-semibold text-neutral-950 tabular-nums mt-0.5 leading-none">
                {peakBookings.toLocaleString()}
              </p>
              <p className="text-[11px] text-neutral-400 mt-1">{peakMonthLabel}</p>
            </div>
          </div>
        </>
      )}

    </div>
  );
};

export default BookingsTrendChart;
