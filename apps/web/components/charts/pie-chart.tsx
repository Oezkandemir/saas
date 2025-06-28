"use client";

import { useEffect, useRef } from "react";
import {
  ArcElement,
  Chart,
  ChartData,
  ChartOptions,
  Legend,
  Tooltip,
} from "chart.js";
import { Pie } from "react-chartjs-2";

// Register required Chart.js components
Chart.register(ArcElement, Tooltip, Legend);

interface PieChartProps {
  data: ChartData<"pie">;
  options?: ChartOptions<"pie">;
}

export function PieChart({ data, options = {} }: PieChartProps) {
  // Set default options
  const defaultOptions: ChartOptions<"pie"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          usePointStyle: true,
          boxWidth: 10,
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.label || "";
            const value = context.formattedValue;
            const total = context.chart.data.datasets[0].data.reduce(
              (a: number, b: number) => a + b,
              0,
            ) as number;
            const percentage = parseFloat(context.raw as string);
            return `${label}: ${value} (${total > 0 ? ((percentage / total) * 100).toFixed(1) : 0}%)`;
          },
        },
      },
    },
  };

  // Merge default options with provided options
  const chartOptions = {
    ...defaultOptions,
    ...options,
    plugins: {
      ...defaultOptions.plugins,
      ...options.plugins,
    },
  };

  return <Pie data={data} options={chartOptions} />;
}
