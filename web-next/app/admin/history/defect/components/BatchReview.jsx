"use client"

import { useState, useRef, useEffect } from "react"
import { RefreshCw, Clock8, Package, Bug, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Download } from 'lucide-react'
import {
  getMachineLinkedBatches,
  getMachineLinkedTotalBatchesCount,
  getMachineLinkedBatchByNumber,
  getMachineLinkedBatchesOverview,
  subscribeToMachineLinkedBatches,
} from "../../../../lib/history/BatchReview"
import { exportBatchReview, exportToImage } from "../../../../utils/export-utils"

export default function MachineLinkedBatchReview() {
  // Batch data state
  const [batchReviews, setBatchReviews] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(6)
  const [showRowsDropdown, setShowRowsDropdown] = useState(false)
  const [totalItems, setTotalItems] = useState(0)
  const [lastVisible, setLastVisible] = useState(null)
  const rowsDropdownRef = useRef(null)

  // Selected batch state
  const [selectedBatch, setSelectedBatch] = useState(null)
  const [selectedBatchData, setSelectedBatchData] = useState(null)

  // Overview data state
  const [overviewData, setOverviewData] = useState({
    totalDefects: 0,
    uniqueDefectTypes: 0,
    timeRange: "N/A",
  })

  // Export state
  const [showExportDropdown, setShowExportDropdown] = useState(false)
  const exportDropdownRef = useRef(null)
  const tableRef = useRef(null)

  // Total pages calculation
  const totalPages = Math.ceil(totalItems / rowsPerPage)

  // Get current page data
  const currentItems = batchReviews

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true)

        // Get total count for pagination
        const totalCount = await getMachineLinkedTotalBatchesCount()
        setTotalItems(totalCount)

        // Get overview data
        const overview = await getMachineLinkedBatchesOverview()
        setOverviewData(overview)

        // Set up real-time listener for batches
        const unsubscribe = await subscribeToMachineLinkedBatches(rowsPerPage, (batches) => {
          setBatchReviews(batches)
          setIsLoading(false)
        })

        // Clean up listener on unmount
        return () => unsubscribe()
      } catch (err) {
        console.error("Error loading initial data:", err)
        setError("Failed to load batch data. Please try again.")
        setIsLoading(false)
      }
    }

    loadInitialData()
  }, [rowsPerPage])

  // Load data when page changes
  useEffect(() => {
    const loadPageData = async () => {
      try {
        setIsLoading(true)

        // If we're on the first page, we already have the data from the real-time listener
        if (currentPage === 1) {
          setIsLoading(false)
          return
        }

        // For other pages, we need to fetch the data
        const { batches, lastVisibleDoc } = await getMachineLinkedBatches(rowsPerPage, lastVisible)

        setBatchReviews(batches)
        setLastVisible(lastVisibleDoc)
        setIsLoading(false)
      } catch (err) {
        console.error("Error loading page data:", err)
        setError("Failed to load batch data. Please try again.")
        setIsLoading(false)
      }
    }

    loadPageData()
  }, [currentPage, rowsPerPage])

  // Load selected batch data
  useEffect(() => {
    const loadSelectedBatchData = async () => {
      if (!selectedBatch) {
        setSelectedBatchData(null)
        return
      }

      try {
        const batchData = await getMachineLinkedBatchByNumber(selectedBatch)
        setSelectedBatchData(batchData)
      } catch (err) {
        console.error("Error loading selected batch:", err)
        setError("Failed to load batch details. Please try again.")
      }
    }

    loadSelectedBatchData()
  }, [selectedBatch])

  // Handle outside click for rows dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (rowsDropdownRef.current && !rowsDropdownRef.current.contains(event.target)) {
        setShowRowsDropdown(false)
      }
    }

    if (showRowsDropdown) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showRowsDropdown])

  // Handle outside click for export dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target)) {
        setShowExportDropdown(false)
      }
    }

    if (showExportDropdown) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showExportDropdown])

  // Refresh data
  const handleRefresh = async () => {
    try {
      setIsLoading(true)

      // Get total count for pagination
      const totalCount = await getMachineLinkedTotalBatchesCount()
      setTotalItems(totalCount)

      // Get overview data
      const overview = await getMachineLinkedBatchesOverview()
      setOverviewData(overview)

      // Get batches for current page
      const { batches, lastVisibleDoc } = await getMachineLinkedBatches(rowsPerPage)
      setBatchReviews(batches)
      setLastVisible(lastVisibleDoc)

      // Reset to first page
      setCurrentPage(1)

      setIsLoading(false)
    } catch (err) {
      console.error("Error refreshing data:", err)
      setError("Failed to refresh data. Please try again.")
      setIsLoading(false)
    }
  }

  // Handle export format
  const handleExportFormat = (format) => {
    if (format === 'image') {
      exportToImage(tableRef, `batch-review-${new Date().toISOString().split('T')[0]}`)
    } else {
      exportBatchReview(batchReviews, format)
    }
    setShowExportDropdown(false)
  }

  // Navigation functions
  const goToFirstPage = () => {
    setCurrentPage(1)
    setLastVisible(null)
  }

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1)
    }
  }

  const goToNextPage = async () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1)
    }
  }

  const goToLastPage = async () => {
    // This is a simplified approach - for a real app, you might want to
    // implement a more efficient way to jump to the last page
    setCurrentPage(totalPages)
  }

  // Handle batch selection
  const handleBatchSelect = (batchNumber) => {
    if (selectedBatch === batchNumber) {
      setSelectedBatch(null)
      setSelectedBatchData(null)
    } else {
      setSelectedBatch(batchNumber)
    }
  }

  // Get current overview data
  const currentOverviewData = selectedBatchData || overviewData

  return (
    <div className="flex flex-col gap-6 bg-white border p-6 rounded-2xl shadow relative flex-1">
      {/* Header */}
      <div className="flex justify-between items-center ">
        <div className="flex flex-col gap-1">
          <h3 className="text-xl font-medium"> Batch Review</h3>
          <p className="text-gray-500 text-sm">View and analyze defect detection patterns for your linked machines</p>
        </div>
        <div className="flex items-center gap-2 absolute right-6 top-6">
          <div className="relative" ref={exportDropdownRef}>
            <button
              className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100"
              onClick={() => setShowExportDropdown(!showExportDropdown)}
            >
              <Download className="w-5 h-5" />
            </button>
            {showExportDropdown && (
              <div className="absolute top-full mt-2 right-0 border bg-white shadow rounded-lg overflow-hidden z-40 w-40">
                <button
                  onClick={() => handleExportFormat('csv')}
                  className="px-4 py-2 text-sm w-full text-left hover:bg-gray-50 flex items-center gap-2"
                >
                  <span className="text-green-600">CSV</span>
                </button>
                <button
                  onClick={() => handleExportFormat('excel')}
                  className="px-4 py-2 text-sm w-full text-left hover:bg-gray-50 flex items-center gap-2"
                >
                  <span className="text-green-600">Excel</span>
                </button>
                <button
                  onClick={() => handleExportFormat('pdf')}
                  className="px-4 py-2 text-sm w-full text-left hover:bg-gray-50 flex items-center gap-2"
                >
                  <span className="text-red-600">PDF</span>
                </button>
                <button
                  onClick={() => handleExportFormat('docx')}
                  className="px-4 py-2 text-sm w-full text-left hover:bg-gray-50 flex items-center gap-2"
                >
                  <span className="text-blue-600">DOCX</span>
                </button>
                <button
                  onClick={() => handleExportFormat('image')}
                  className="px-4 py-2 text-sm w-full text-left hover:bg-gray-50 flex items-center gap-2"
                >
                  <span className="text-purple-600">Image</span>
                </button>
              </div>
            )}
          </div>
          <button
            className="text-gray-500 hover:text-gray-700"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <div className="flex flex-col gap-8" ref={tableRef}>
        {/* overview */}
        {selectedBatch ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-4 border rounded-lg p-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-500">
                <Package className="w-5 h-5" />
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <h3 className="font-medium text-gray-500 text-sm">Total Defects</h3>
                <span className="text-4xl font-semibold text-blue-500">{currentOverviewData.totalDefects}</span>
              </div>
            </div>

            <div className="flex items-center gap-4 border rounded-lg p-4">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-500">
                <Bug className="w-5 h-5" />
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <h3 className="font-medium text-gray-500 text-sm">Unique Defect Types</h3>
                <span className="text-4xl font-semibold text-orange-500">{currentOverviewData.uniqueDefectTypes}</span>
              </div>
            </div>

            <div className="flex items-center gap-4 border rounded-lg p-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-500">
                <Clock8 className="w-5 h-5" />
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <h3 className="font-medium text-gray-500 text-sm">Time Range</h3>
                <span className="text-4xl font-semibold text-green-500">{currentOverviewData.timeRange}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-4 border rounded-lg p-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-500">
                <Package className="w-5 h-5" />
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <h3 className="font-medium text-gray-500 text-sm">Total Defects</h3>
                <span className="text-4xl font-semibold text-blue-500">{overviewData.totalDefects}</span>
              </div>
            </div>

            <div className="flex items-center gap-4 border rounded-lg p-4">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-500">
                <Bug className="w-5 h-5" />
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <h3 className="font-medium text-gray-500 text-sm">Unique Defect Types</h3>
                <span className="text-4xl font-semibold text-orange-500">{overviewData.uniqueDefectTypes}</span>
              </div>
            </div>

            <div className="flex items-center gap-4 border rounded-lg p-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-500">
                <Clock8 className="w-5 h-5" />
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <h3 className="font-medium text-gray-500 text-sm">Time Range</h3>
                <span className="text-4xl font-semibold text-green-500">{overviewData.timeRange}</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4">
          <h3 className="font-medium">
            {selectedBatch ? (
              <>
                Selected Batch: {selectedBatch}
                <button
                  onClick={() => setSelectedBatch(null)}
                  className="ml-2 text-sm text-blue-500 hover:text-blue-700"
                >
                  (Clear Selection)
                </button>
              </>
            ) : (
              "Available Batches from Your Linked Machines"
            )}
          </h3>

          {/* Loading state */}
          {isLoading && (
            <div className="flex justify-center items-center p-8">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          )}

          {/* Empty state */}
          {!isLoading && batchReviews.length === 0 && (
            <div className="flex flex-col items-center justify-center p-8 border rounded-lg">
              <Package className="w-10 h-10 text-gray-400 mb-2" />
              <p className="text-gray-500">No batch data available for your linked machines</p>
            </div>
          )}

          {/* batches */}
          {!isLoading && batchReviews.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {currentItems.map((batch, index) => (
                <div
                  key={batch.id || index}
                  onClick={() => handleBatchSelect(batch.batchNumber)}
                  className={`flex flex-col gap-4 rounded-lg border transition-colors duration-150 hover:bg-gray-300/20 p-4 cursor-pointer ${
                    selectedBatch === batch.batchNumber ? "border-2 border-blue-500" : ""
                  }`}
                >
                  {/* title and date */}
                  <div className="flex items-center">
                    <div className="flex flex-1 flex-col gap-1">
                      <h3 className="font-medium">{batch.batchNumber}</h3>
                      <span className="text-xs text-gray-500">Machine ID: {batch.machineId}</span>
                    </div>
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-500">
                      <Package className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="flex flex-1 flex-col gap-1 text-xs text-gray-500">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded-full bg-blue-500"></div>
                        From
                      </div>
                      <span className=" flex gap-2 text-sm items-center">{batch.fromDate}</span>
                    </div>

                    <div className="flex flex-1 flex-col gap-1 text-xs text-gray-500">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded-full bg-green-500"></div>
                        To
                      </div>
                      <span className=" flex gap-2 text-sm items-center">{batch.toDate}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* pagination */}
          {!isLoading && batchReviews.length > 0 && (
            <div className="flex flex-col-reverse gap-4 sm:flex-row sm:gap-0 items-center justify-between py-2">
              {/* Pagination controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={goToFirstPage}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg border ${
                    currentPage === 1 ? "text-gray-300 cursor-not-allowed" : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg border ${
                    currentPage === 1 ? "text-gray-300 cursor-not-allowed" : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="text-sm border rounded-lg px-4 py-2 bg-blue-50 text-blue-600">{currentPage}</div>

                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className={`p-2 rounded-lg border ${
                    currentPage === totalPages || totalPages === 0
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={goToLastPage}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className={`p-2 rounded-lg border ${
                    currentPage === totalPages || totalPages === 0
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>

              {/* Rows per page selector */}
              <div className="relative" ref={rowsDropdownRef}>
                <button
                  onClick={() => setShowRowsDropdown(!showRowsDropdown)}
                  className="text-sm border rounded-lg px-4 py-2 flex items-center gap-2 hover:bg-gray-50"
                >
                  {rowsPerPage} per page
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${showRowsDropdown ? "rotate-180" : ""}`}
                  />
                </button>

                {showRowsDropdown && (
                  <div className="absolute bottom-full mb-2 border bg-white shadow rounded-lg overflow-hidden z-40">
                    {[6, 9, 12, 15].map((value) => (
                      <button
                        key={value}
                        onClick={() => {
                          setRowsPerPage(value)
                          setShowRowsDropdown(false)
                          setCurrentPage(1) // Reset to first page when changing rows per page
                          setLastVisible(null)
                        }}
                        className={`px-4 py-2 text-sm w-full text-left hover:bg-gray-50 ${
                          rowsPerPage === value ? "bg-blue-50 text-blue-600" : ""
                        }`}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}