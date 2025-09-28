import { db } from "../../../config/firebaseConfig"
import { collection, getDocs, query, where, orderBy, doc, getDoc } from "firebase/firestore"
import { getCurrentUser } from "../../../utils/auth-utils"

/**
 * Get the current user's linked machines
 * @returns {Promise<string[]>} Array of machine IDs linked to the current user
 */
export const getUserLinkedMachines = async () => {
  try {
    // Get current user using our unified auth utility
    const user = getCurrentUser()
    if (!user) {
      console.error("No authenticated user found")
      return []
    }

    // Get user document from Firestore
    const userDocRef = doc(db, "users", user.uid)
    const userDoc = await getDoc(userDocRef)

    if (!userDoc.exists()) {
      console.error("User document not found")
      return []
    }

    // Get linked machines from user document
    const userData = userDoc.data()
    const linkedMachines = userData.linkedMachines || []
    
    return Array.isArray(linkedMachines) ? linkedMachines : []
  } catch (error) {
    console.error("Error getting user's linked machines:", error)
    return []
  }
}

// Fetch defect logs for a specific time period for machines linked to the current user
export async function fetchMachineLinkedDefectLogsByTimeRange(startDate, endDate) {
  try {
    // Get user's linked machines
    const linkedMachines = await getUserLinkedMachines()
    
    // If no linked machines, return empty array
    if (linkedMachines.length === 0) {
      return []
    }

    const defectLogsRef = collection(db, "defect_logs")
    
    // Modified approach: First query by timestamp range only to avoid composite index requirement
    const q = query(
      defectLogsRef,
      where("timestamp", ">=", startDate),
      where("timestamp", "<=", endDate),
      orderBy("timestamp")
    )
    
    const snapshot = await getDocs(q)
    
    // Then filter the results in memory for the linked machines
    return snapshot.docs
      .filter(doc => linkedMachines.includes(doc.data().machine_id))
      .map((doc) => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    console.error("Error fetching machine-linked defect logs by time range:", error)
    throw error
  }
}

// Get daily defect data for machines linked to the current user
export async function getMachineLinkedDailyDefectData() {
  try {
    // Get current date and date from 7 days ago
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 7)

    const logs = await fetchMachineLinkedDefectLogsByTimeRange(startDate.toISOString(), endDate.toISOString())

    // Group by day
    const dailyData = logs.reduce((acc, log) => {
      const date = new Date(log.timestamp)
      const day = date.toLocaleDateString("en-US", { weekday: "short" })

      if (!acc[day]) {
        acc[day] = {
          day,
          cracks: 0,
          good: 0,
          dirty: 0,
          bloodSpots: 0,
          other: 0,
        }
      }

      // Increment the appropriate defect type
      if (log.defect_type === "cracked") acc[day].cracks++
      else if (log.defect_type === "good") acc[day].good++
      else if (log.defect_type === "dirty") acc[day].dirty++
      else if (log.defect_type === "blood_spot") acc[day].bloodSpots++
      else acc[day].other++

      return acc
    }, {})

    // Convert to array and ensure all days of the week are included
    const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    return daysOfWeek.map((day) => {
      return (
        dailyData[day] || {
          day,
          cracks: 0,
          good: 0,
          dirty: 0,
          bloodSpots: 0,
          other: 0,
        }
      )
    })
  } catch (error) {
    console.error("Error getting machine-linked daily defect data:", error)
    throw error
  }
}

// Get monthly defect data for machines linked to the current user
export async function getMachineLinkedMonthlyDefectData() {
  try {
    // Get current date and date from 6 months ago
    const endDate = new Date()
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - 6)

    const logs = await fetchMachineLinkedDefectLogsByTimeRange(startDate.toISOString(), endDate.toISOString())

    // Group by month
    const monthlyData = logs.reduce((acc, log) => {
      const date = new Date(log.timestamp)
      const month = date.toLocaleDateString("en-US", { month: "short" })

      if (!acc[month]) {
        acc[month] = {
          month,
          cracks: 0,
          good: 0,
          dirty: 0,
          bloodSpots: 0,
          other: 0,
        }
      }

      // Increment the appropriate defect type
      if (log.defect_type === "cracked") acc[month].cracks++
      else if (log.defect_type === "good") acc[month].good++
      else if (log.defect_type === "dirty") acc[month].dirty++
      else if (log.defect_type === "blood_spot") acc[month].bloodSpots++
      else acc[month].other++

      return acc
    }, {})

    // Convert to array and ensure all months are included
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
    return months.map((month) => {
      return (
        monthlyData[month] || {
          month,
          cracks: 0,
          good: 0,
          dirty: 0,
          bloodSpots: 0,
          other: 0,
        }
      )
    })
  } catch (error) {
    console.error("Error getting machine-linked monthly defect data:", error)
    throw error
  }
}