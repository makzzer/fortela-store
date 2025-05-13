"use client"

import { useEffect, useState } from "react"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

// This would be fetched from the API in a real app
const getSalesData = async () => {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 500))

  // Generate mock data for the last 7 days
  const data = []
  const today = new Date()

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)

    data.push({
      date: date.toLocaleDateString("en-US", { weekday: "short" }),
      sales: Math.floor(Math.random() * 1000) + 500,
      orders: Math.floor(Math.random() * 20) + 5,
    })
  }

  return data
}

export default function SalesChart() {
  const [data, setData] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
      const salesData = await getSalesData()
      setData(salesData)
    }

    fetchData()
  }, [])

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
          <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
          <Tooltip />
          <Legend />
          <Bar yAxisId="left" dataKey="sales" name="Sales ($)" fill="#8884d8" />
          <Bar yAxisId="right" dataKey="orders" name="Orders" fill="#82ca9d" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
