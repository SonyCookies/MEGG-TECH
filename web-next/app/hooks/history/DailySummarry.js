import { useState, useEffect } from "react"
import {
  getMachineLinkedTodayDefects,
  getMachineLinkedPreviousDayDefects,
  getMachineLinkedWeekDefects,
  calculateDailyAverage,
  findPeakTime,
  getHourlyDistribution,
  getDefectCounts,
  calculatePercentageChange,
} from "../../lib/history/DailySummarry"

export function useMachineLinkedDefectData() {
  const [periodTotal, setPeriodTotal] = useState(0)
  const [dailyAverage, setDailyAverage] = useState(0)
  const [peakTime, setPeakTime] = useState("N/A")
  const [percentageChange, setPercentageChange] = useState(0)
  const [hourlyDistribution, setHourlyDistribution] = useState([])
  const [defectCounts, setDefectCounts] = useState({ dirty: 0, cracked: 0, good: 0 })
  const [lastUpdated, setLastUpdated] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get defects for today, yesterday, and last week
      const todayDefects = await getMachineLinkedTodayDefects()
      const yesterdayDefects = await getMachineLinkedPreviousDayDefects()
      const weekDefects = await getMachineLinkedWeekDefects()

      // Calculate metrics
      const todayTotal = todayDefects.length
      const yesterdayTotal = yesterdayDefects.length
      const average = calculateDailyAverage(weekDefects)
      const peak = findPeakTime(weekDefects)
      const hourlyData = getHourlyDistribution(weekDefects)
      const counts = getDefectCounts(weekDefects)
      const change = calculatePercentageChange(todayTotal, yesterdayTotal)

      // Update state
      setPeriodTotal(todayTotal)
      setDailyAverage(average)
      setPeakTime(peak)
      setPercentageChange(change)
      setHourlyDistribution(hourlyData)
      setDefectCounts(counts)
      setLastUpdated(new Date())
    } catch (err) {
      console.error("Error fetching defect data:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Fetch data on component mount
  useEffect(() => {
    fetchData()
  }, [])

  // Function to manually refresh data
  const refreshData = () => {
    fetchData()
  }

  return {
    periodTotal,
    dailyAverage,
    peakTime,
    percentageChange,
    hourlyDistribution,
    defectCounts,
    lastUpdated,
    loading,
    error,
    refreshData,
  }
}