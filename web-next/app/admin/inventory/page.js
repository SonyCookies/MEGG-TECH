"use client";

import { Navbar } from "../../components/NavBar";
import { Header } from "../../components/Header";
import { useState, useRef, useEffect } from "react";
import {
  RefreshCw,
  Clock8,
  Package,
  Weight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  QrCode,
} from "lucide-react";

// Function to get color based on size type
const getSizeTypeColor = (sizeType) => {
  switch (sizeType) {
    case "Small":
      return "text-blue-500";
    case "Medium":
      return "text-green-500";
    case "Large":
      return "text-yellow-500";
    case "Extra Large":
      return "text-orange-500";
    case "Jumbo":
      return "text-red-500";
    default:
      return "text-gray-500";
  }
};

// Function to get background color based on size type
const getSizeTypeBgColor = (sizeType) => {
  switch (sizeType) {
    case "Small":
      return "bg-blue-100";
    case "Medium":
      return "bg-green-100";
    case "Large":
      return "bg-yellow-100";
    case "Extra Large":
      return "bg-orange-100";
    case "Jumbo":
      return "bg-red-100";
    default:
      return "bg-gray-100";
  }
};

// Enhanced static data for batch reviews with egg counts
const batchReviews = [
  {
    batchNumber: "B20250304-2314",
    totalEggs: 1250,
    totalSort: 6,
    commonSize: "Large",
    timeRange: "11:18:47 PM - 11:18:57 PM",
    fromDate: "March 4, 2025 11:18:47 PM",
    toDate: "March 4, 2025 11:18:57 PM",
    eggSizes: {
      Small: 180,
      Medium: 320,
      Large: 450,
      "Extra Large": 220,
      Jumbo: 80,
    },
  },
  {
    batchNumber: "B20250304-2315",
    totalEggs: 980,
    totalSort: 3,
    commonSize: "Small",
    timeRange: "11:17:47 PM - 11:17:57 PM",
    fromDate: "March 4, 2025 11:17:47 PM",
    toDate: "March 4, 2025 11:17:57 PM",
    eggSizes: {
      Small: 420,
      Medium: 280,
      Large: 180,
      "Extra Large": 80,
      Jumbo: 20,
    },
  },
  {
    batchNumber: "B20250304-2316",
    totalEggs: 1100,
    totalSort: 3,
    commonSize: "Medium",
    timeRange: "11:16:47 PM - 11:16:57 PM",
    fromDate: "March 4, 2025 11:16:47 PM",
    toDate: "March 4, 2025 11:16:57 PM",
    eggSizes: {
      Small: 150,
      Medium: 380,
      Large: 320,
      "Extra Large": 180,
      Jumbo: 70,
    },
  },
];

export default function InventoryPage() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(6);
  const [showRowsDropdown, setShowRowsDropdown] = useState(false);
  const rowsDropdownRef = useRef(null);

  // Selected batch state
  const [selectedBatch, setSelectedBatch] = useState(null);

  // Total pages calculation
  const totalPages = Math.ceil(batchReviews.length / rowsPerPage);

  // Get current page data
  const indexOfLastItem = currentPage * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;
  const currentItems = batchReviews.slice(indexOfFirstItem, indexOfLastItem);

  // Get overview data based on selected batch or all batches
  const overviewData = selectedBatch
    ? batchReviews.find((batch) => batch.batchNumber === selectedBatch)
    : null;

  // Handle outside click for rows dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        rowsDropdownRef.current &&
        !rowsDropdownRef.current.contains(event.target)
      ) {
        setShowRowsDropdown(false);
      }
    }

    if (showRowsDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showRowsDropdown]);

  // Navigation functions
  const goToFirstPage = () => setCurrentPage(1);
  const goToPreviousPage = () =>
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  const goToNextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const goToLastPage = () => setCurrentPage(totalPages);

  // Handle batch selection
  const handleBatchSelect = (batchNumber) => {
    if (selectedBatch === batchNumber) {
      setSelectedBatch(null); // Deselect if already selected
    } else {
      setSelectedBatch(batchNumber);
    }
  };

  return (
    <div className="min-h-screen container mx-auto text-[#1F2421] relative">
      {/* Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={`fixed z-50 inset-y-0 left-0 w-80 bg-white transform shadow-lg transition-transform duration-300 ease-in-out lg:hidden ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Navbar />
      </div>

      {/* MAIN */}
      <div className="flex gap-6 p-4 md:p-6">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <Navbar />
        </div>

        <div className="flex flex-1 flex-col gap-6 w-full">
          {/* Header */}
          <Header setSidebarOpen={setSidebarOpen} />

          {/* Main container */}
          <div className="flex flex-col gap-6">
            {/* batch review display */}
            <div className="bg-white rounded-2xl border border-gray-300 p-6">
              {selectedBatch ? (
                <div className="flex flex-col-reverse  xl:flex-row gap-6">
                  {/* left */}
                  <div className="flex flex-1 flex-col gap-6">
                    {/* Main overview cards */}
                    <div className="grid grid-cols-4 gap-4">
                      <div className="col-span-4 sm:col-span-2 flex items-center gap-4 border border-gray-300 rounded-lg p-4">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-500">
                          <Package className="w-5 h-5" />
                        </div>
                        <div className="flex flex-1 flex-col gap-1">
                          <h3 className="font-medium text-gray-500 text-sm">
                            Total Eggs
                          </h3>
                          <span className="text-4xl font-semibold text-purple-500">
                            {overviewData.totalEggs.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className=" col-span-4 sm:col-span-2 flex items-center gap-4 border border-gray-300 rounded-lg p-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-500">
                          <Package className="w-5 h-5" />
                        </div>
                        <div className="flex flex-1 flex-col gap-1">
                          <h3 className="font-medium text-gray-500 text-sm">
                            Total Sort
                          </h3>
                          <span className="text-4xl font-semibold text-blue-500">
                            {overviewData.totalSort}
                          </span>
                        </div>
                      </div>

                      <div
                        className={`col-span-4 sm:col-span-2 flex items-center gap-4 border border-gray-300 rounded-lg p-4`}
                      >
                        <div
                          className={`w-10 h-10 ${getSizeTypeBgColor(
                            overviewData.commonSize
                          )} rounded-full flex items-center justify-center ${getSizeTypeColor(
                            overviewData.commonSize
                          )}`}
                        >
                          <Weight className="w-5 h-5" />
                        </div>
                        <div className="flex flex-1 flex-col gap-1">
                          <h3 className="font-medium text-gray-500 text-sm">
                            Most Common Size
                          </h3>
                          <span
                            className={`text-2xl font-semibold ${getSizeTypeColor(
                              overviewData.commonSize
                            )}`}
                          >
                            {overviewData.commonSize}
                          </span>
                        </div>
                      </div>

                      <div className="col-span-4 sm:col-span-2 flex items-center gap-4 border border-gray-300 rounded-lg p-4">
                        <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-500">
                          <Clock8 className="w-5 h-5" />
                        </div>
                        <div className="flex flex-1 flex-col gap-1">
                          <h3 className="font-medium text-gray-500 text-sm">
                            Time Range
                          </h3>
                          <span className="text-sm font-semibold text-yellow-500">
                            {overviewData.timeRange}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Egg Size Distribution */}
                    <div className="">
                      <h4 className="font-medium text-gray-700 mb-4">
                        Egg Size Distribution
                      </h4>
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
                        {Object.entries(overviewData.eggSizes).map(
                          ([size, count]) => (
                            <div
                              key={size}
                              className="col-span-1 flex flex-col items-center gap-2"
                            >
                              <div
                                className={`w-12 h-12 ${getSizeTypeBgColor(
                                  size
                                )} rounded-full flex items-center justify-center ${getSizeTypeColor(
                                  size
                                )}`}
                              >
                                <Weight className="w-5 h-5" />
                              </div>
                              <div className="text-center">
                                <div
                                  className={`text-lg font-semibold ${getSizeTypeColor(
                                    size
                                  )}`}
                                >
                                  {count.toLocaleString()}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {size}
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>

                  {/* right */}

                  <div className="flex items-center justify-center xl:items-start xl:justify-start">
                    <div className="bg-white w-auto sm:w-72  rounded-lg">
                      <div className="flex flex-col gap-4">
                        {selectedBatch ? (
                          <div className="flex flex-col gap-4">
                            <div className="aspect-square bg-white  border-gray-200 rounded-lg flex items-center justify-center">
                              {/* QR Code placeholder - you can replace this with actual QR code generation */}
                              <div className="w-full h-full bg-gray-100 rounded flex flex-col items-center justify-center gap-2">
                                <QrCode className="w-16 h-16 text-gray-400" />
                                <span className="text-xs text-gray-500 text-center">
                                  QR Code for
                                  <br />
                                  {selectedBatch}
                                </span>
                              </div>
                            </div>

                            <button className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium">
                              Download QR Code
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-4 py-8">
                            <div className="aspect-square w-full bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center">
                              <QrCode className="w-16 h-16 text-gray-300" />
                            </div>
                            <div className="text-center">
                              <p className="text-sm text-gray-500">
                                Select a batch to generate QR code
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center flex-col gap-4 justify-center py-6">
                  <div className="bg-gray-100 rounded-full p-4 ">
                    <Package className="w-10 h-10 mx-auto text-gray-500 animate-pulse" />
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <h3 className="text-lg font-medium">
                      Select a batch to review
                    </h3>
                    <p className="text-gray-500 text-sm">
                      Click on any batch below to view its details
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-6 bg-white rounded-2xl border border-gray-300 p-6 shadow">
              {/* batch menus (data) */}
              <div className="flex flex-col gap-4 ">
                <h3 className="font-medium">
                  {selectedBatch ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xl text-gray-500">
                        <span className="font-semibold text-black">
                          {selectedBatch}
                        </span>
                      </span>
                      <button
                        onClick={() => setSelectedBatch(null)}
                        className="text-sm text-blue-500 hover:text-blue-600 cursor-pointer"
                      >
                        (Clear Selection)
                      </button>
                    </div>
                  ) : (
                    <span className="text-xl font-medium">
                      Available Batches
                    </span>
                  )}
                </h3>

                {/* items */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {currentItems.map((batch, index) => (
                    <div
                      key={index}
                      onClick={() => handleBatchSelect(batch.batchNumber)}
                      className={`flex flex-col gap-4 rounded-lg border  transition-colors duration-150  p-4 cursor-pointer ${
                        selectedBatch === batch.batchNumber
                          ? "border-2 border-blue-500"
                          : "border-gray-300 hover:bg-gray-100"
                      }`}
                    >
                      
                      {/* title and date */}
                      <div className="flex items-center">
                        <div className="flex flex-1 flex-col gap-1">
                          <h3 className="font-medium">{batch.batchNumber}</h3>
                          <p className="text-sm text-gray-500">
                            {batch.totalEggs.toLocaleString()} eggs total
                          </p>
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
                          <span className="flex gap-2 text-sm items-center">
                            {batch.fromDate}
                          </span>
                        </div>

                        <div className="flex flex-1 flex-col gap-1 text-xs text-gray-500">
                          <div className="flex items-center gap-2">
                            <div className="p-1 rounded-full bg-green-500"></div>
                            To
                          </div>
                          <span className="flex gap-2 text-sm items-center">
                            {batch.toDate}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* pagination */}
              <div className="flex flex-col-reverse gap-4 items-center justify-center md:flex-row md:justify-between">
                {/* Pagination controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={goToFirstPage}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-lg border ${
                      currentPage === 1
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-lg border ${
                      currentPage === 1
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="text-sm border rounded-lg px-4 py-2 bg-blue-50 text-blue-600">
                    {currentPage}
                  </div>

                  <button
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-lg border ${
                      currentPage === totalPages
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={goToLastPage}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-lg border ${
                      currentPage === totalPages
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
                      className={`w-4 h-4 transition-transform duration-200 ${
                        showRowsDropdown ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {showRowsDropdown && (
                    <div className="absolute bottom-full mb-2 border bg-white shadow rounded-lg overflow-hidden z-40">
                      {[6, 9, 12, 15].map((value) => (
                        <button
                          key={value}
                          onClick={() => {
                            setRowsPerPage(value);
                            setShowRowsDropdown(false);
                            setCurrentPage(1); // Reset to first page when changing rows per page
                          }}
                          className={`px-4 py-2 text-sm w-full text-left hover:bg-gray-50 ${
                            rowsPerPage === value
                              ? "bg-blue-50 text-blue-600"
                              : ""
                          }`}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}