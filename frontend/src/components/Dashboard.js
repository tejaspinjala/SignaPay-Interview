import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend } from 'chart.js';

// Register the necessary components for Chart.js
ChartJS.register(BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

/**
 * Dashboard component for managing transactions data and displaying various datasets.
 * Handles uploading files, fetching data for chart of accounts, collections, and bad transactions,
 * and displaying this data in a table format with pagination and search functionality.
 */
export default function Dashboard() {
  // State variables for file upload and various data sets
  const [file, setFile] = useState(null);
  const [chartOfAccounts, setChartOfAccounts] = useState([]);
  const [collectionsAccounts, setCollectionsAccounts] = useState([]);
  const [badTransactions, setBadTransactions] = useState([]);
  const [badData, setBadData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // State variables for displaying different data views
  const [showChartOfAccounts, setShowChartOfAccounts] = useState(false);
  const [showCollectionsAccounts, setShowCollectionsAccounts] = useState(false);
  const [showBadTransactions, setShowBadTransactions] = useState(false);

  // State variables for pagination and search terms
  const [currentPage, setCurrentPage] = useState(1);
  const [currentCollectionsPage, setCurrentCollectionsPage] = useState(1);
  const [currentBadPage, setCurrentBadPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [collectionsSearchTerm, setCollectionsSearchTerm] = useState('');
  const [badSearchTerm, setBadSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  const [debouncedCollectionsSearchTerm, setDebouncedCollectionsSearchTerm] = useState(collectionsSearchTerm);
  const [debouncedBadSearchTerm, setDebouncedBadSearchTerm] = useState(badSearchTerm);
  
  // State variables for tracking total pages in paginated views
  const [totalPages, setTotalPages] = useState(1);
  const [totalCollectionsPages, setTotalCollectionsPages] = useState(1);
  const [totalBadPages, setTotalBadPages] = useState(1);
  const itemsPerPage = 20; // Constant for items per page

  /**
   * Debounce effect for updating the search term for chart of accounts with a delay.
   */
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300 milliseconds delay

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  /**
   * Debounce effect for updating the search term for collections accounts with a delay.
   */
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedCollectionsSearchTerm(collectionsSearchTerm);
    }, 300); // 300 milliseconds delay

    return () => {
      clearTimeout(handler);
    };
  }, [collectionsSearchTerm]);

  /**
   * Debounce effect for updating the search term for bad transactions with a delay.
   */
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedBadSearchTerm(badSearchTerm);
    }, 300); // 300 milliseconds delay

    return () => {
      clearTimeout(handler);
    };
  }, [badSearchTerm]);

  /**
   * Fetches chart of accounts data when the current page or debounced search term changes.
   */
  useEffect(() => {
    if (showChartOfAccounts) {
      fetchChartOfAccounts();
    }
  }, [currentPage, debouncedSearchTerm]);

  /**
   * Fetches collections accounts data when the current collections page or debounced search term changes.
   */
  useEffect(() => {
    if (showCollectionsAccounts) {
      fetchCollectionsAccounts();
    }
  }, [currentCollectionsPage, debouncedCollectionsSearchTerm]);

  /**
   * Fetches bad transactions data when the current bad transactions page or debounced search term changes.
   */
  useEffect(() => {
    if (showBadTransactions) {
      fetchBadTransactions();
    }
  }, [currentBadPage, debouncedBadSearchTerm]);

  /**
   * Fetches chart of accounts data from the backend API.
   */
  const fetchChartOfAccounts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/chart-of-accounts?page=${currentPage}&items_per_page=${itemsPerPage}&search_term=${debouncedSearchTerm}`);
      if (response.ok) {
        const data = await response.json();
        setChartOfAccounts(data.chart_of_accounts || []);
        setTotalPages(data.total_pages);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to fetch chart of accounts');
      }
    } catch (error) {
      console.error('Error fetching chart of accounts:', error);
      alert('An error occurred while fetching the chart of accounts');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Fetches collections accounts data from the backend API.
   */
  const fetchCollectionsAccounts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/collections-accounts?page=${currentCollectionsPage}&items_per_page=${itemsPerPage}&search_term=${debouncedCollectionsSearchTerm}`);
      if (response.ok) {
        const data = await response.json();
        setCollectionsAccounts(data.collections_accounts || []);
        setTotalCollectionsPages(data.total_pages);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to fetch collections accounts');
      }
    } catch (error) {
      console.error('Error fetching collections accounts:', error);
      alert('An error occurred while fetching the collections accounts');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Fetches bad transactions data from the backend API.
   */
  const fetchBadTransactions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/bad-transactions?page=${currentBadPage}&items_per_page=${itemsPerPage}&search_term=${debouncedBadSearchTerm}`);
      if (response.ok) {
        const data = await response.json();
        setBadTransactions(data.bad_transactions || []);
        setTotalBadPages(data.total_pages);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to fetch bad transactions');
      }
    } catch (error) {
      console.error('Error fetching bad transactions:', error);
      alert('An error occurred while fetching the bad transactions');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles file input change by setting the selected file to the state.
   * 
   * @param {Event} event - The file input change event
   */
  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  /**
   * Handles file upload by sending the selected file to the backend API.
   */
  const handleUpload = async () => {
    if (!file) {
      alert('Please select a file to upload');
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setChartOfAccounts(data.chart_of_accounts || []);
        setCollectionsAccounts(data.collections_accounts || []);
        setBadData(data.bad_data || []);
        alert(data.message || 'File uploaded and processed successfully');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Error uploading and processing file');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred while uploading and processing the file');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles system reset by sending a reset request to the backend API.
   */
  const handleReset = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/reset', {
        method: 'POST',
      });

      if (response.ok) {
        setChartOfAccounts([]);
        setCollectionsAccounts([]);
        setBadTransactions([]);
        setBadData([]);
        setShowChartOfAccounts(false);
        setShowCollectionsAccounts(false);
        setShowBadTransactions(false);
        alert('System reset successfully');
      } else {
        alert('Error resetting system');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred while resetting the system');
    }
  };

  /**
   * Toggles the display of chart of accounts and fetches the relevant data.
   */
  const handleShowChartOfAccounts = () => {
    setShowChartOfAccounts(true);
    setShowCollectionsAccounts(false); // Hide collections when showing chart of accounts
    setShowBadTransactions(false); // Hide bad transactions when showing chart of accounts
    setCurrentPage(1); // Reset to first page when showing the chart of accounts
    fetchChartOfAccounts();
  };

  /**
   * Toggles the display of collections accounts and fetches the relevant data.
   */
  const handleShowCollectionsAccounts = () => {
    setShowCollectionsAccounts(true);
    setShowChartOfAccounts(false); // Hide chart of accounts when showing collections
    setShowBadTransactions(false); // Hide bad transactions when showing collections
    setCurrentCollectionsPage(1); // Reset to first page when showing the collections accounts
    fetchCollectionsAccounts();
  };

  /**
   * Toggles the display of bad transactions and fetches the relevant data.
   */
  const handleShowBadTransactions = () => {
    setShowBadTransactions(true);
    setShowChartOfAccounts(false); // Hide chart of accounts when showing bad transactions
    setShowCollectionsAccounts(false); // Hide collections when showing bad transactions
    setCurrentBadPage(1); // Reset to first page when showing the bad transactions
    fetchBadTransactions();
  };

  // Handlers for pagination navigation
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextCollectionsPage = () => {
    if (currentCollectionsPage < totalCollectionsPages) {
      setCurrentCollectionsPage(currentCollectionsPage + 1);
    }
  };

  const handlePreviousCollectionsPage = () => {
    if (currentCollectionsPage > 1) {
      setCurrentCollectionsPage(currentCollectionsPage - 1);
    }
  };

  const handleNextBadPage = () => {
    if (currentBadPage < totalBadPages) {
      setCurrentBadPage(currentBadPage + 1);
    }
  };

  const handlePreviousBadPage = () => {
    if (currentBadPage > 1) {
      setCurrentBadPage(currentBadPage - 1);
    }
  };

  // Chart.js options for customizing the appearance of the chart
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        enabled: true,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-400 to-purple-500 p-4 md:p-8">
      <div className="max-w-4xl mx-auto bg-white p-4 md:p-6 rounded shadow-md">
        <h1 className="text-2xl font-bold text-center mb-4">Transaction Dashboard</h1>
        
        {/* File upload and action buttons */}
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
          <input type="file" onChange={handleFileChange} accept=".csv" className="border p-2 rounded w-full sm:w-auto" />
          <button onClick={handleUpload} className="bg-blue-500 text-white p-2 rounded w-full sm:w-auto" disabled={isLoading}>
            {isLoading ? 'Processing...' : 'Upload'}
          </button>
          <button onClick={handleReset} className="bg-gray-500 text-white p-2 rounded w-full sm:w-auto">Reset System</button>
          <button onClick={handleShowChartOfAccounts} className="bg-green-500 text-white p-2 rounded w-full sm:w-auto">
            Display Chart of Accounts
          </button>
          <button onClick={handleShowCollectionsAccounts} className="bg-purple-500 text-white p-2 rounded w-full sm:w-auto">
            Display Collections
          </button>
          <button onClick={handleShowBadTransactions} className="bg-red-500 text-white p-2 rounded w-full sm:w-auto">
            Display Bad Transactions
          </button>
        </div>

        {/* Loading indicator */}
        {isLoading && <p className="text-center">Processing data, please wait...</p>}

        {/* Chart of Accounts view */}
        {!isLoading && showChartOfAccounts && (
          <>
            <input
              type="text"
              placeholder="Search by Account Name or Card Number"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border p-2 rounded w-full mb-4"
            />
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b">Account Name</th>
                  <th className="py-2 px-4 border-b">Card Number</th>
                  <th className="py-2 px-4 border-b">Total Amount</th>
                </tr>
              </thead>
              <tbody>
                {chartOfAccounts.map((account, index) => (
                  <tr key={index}>
                    <td className="py-2 px-4 border-b">{account['Account Name']}</td>
                    <td className="py-2 px-4 border-b">{account['Card Number']}</td>
                    <td className="py-2 px-4 border-b">{account['Total Amount']}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination for Chart of Accounts */}
            <div className="flex justify-between items-center mt-4">
              <button 
                onClick={handlePreviousPage} 
                disabled={currentPage === 1} 
                className="bg-gray-500 text-white p-2 rounded"
              >
                Previous
              </button>
              <span>Page {currentPage} of {totalPages}</span>
              <button 
                onClick={handleNextPage} 
                disabled={currentPage === totalPages} 
                className="bg-gray-500 text-white p-2 rounded"
              >
                Next
              </button>
            </div>
          </>
        )}

        {/* Collections Accounts view */}
        {!isLoading && showCollectionsAccounts && (
          <>
            <input
              type="text"
              placeholder="Search by Account Name or Card Number"
              value={collectionsSearchTerm}
              onChange={(e) => setCollectionsSearchTerm(e.target.value)}
              className="border p-2 rounded w-full mb-4"
            />
            <h2 className="text-xl font-bold mb-4">Collections Accounts</h2>
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b">Account Name</th>
                  <th className="py-2 px-4 border-b">Card Number</th>
                  <th className="py-2 px-4 border-b">Total Amount</th>
                </tr>
              </thead>
              <tbody>
                {collectionsAccounts.map((account, index) => (
                  <tr key={index}>
                    <td className="py-2 px-4 border-b">{account['Account Name']}</td>
                    <td className="py-2 px-4 border-b">{account['Card Number']}</td>
                    <td className="py-2 px-4 border-b">{account['Total Amount']}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination for Collections Accounts */}
            <div className="flex justify-between items-center mt-4">
              <button 
                onClick={handlePreviousCollectionsPage} 
                disabled={currentCollectionsPage === 1} 
                className="bg-gray-500 text-white p-2 rounded"
              >
                Previous
              </button>
              <span>Page {currentCollectionsPage} of {totalCollectionsPages}</span>
              <button 
                onClick={handleNextCollectionsPage} 
                disabled={currentCollectionsPage === totalCollectionsPages} 
                className="bg-gray-500 text-white p-2 rounded"
              >
                Next
              </button>
            </div>
          </>
        )}

        {/* Bad Transactions view */}
        {!isLoading && showBadTransactions && (
          <>
            <input
              type="text"
              placeholder="Search by Account Name or Card Number"
              value={badSearchTerm}
              onChange={(e) => setBadSearchTerm(e.target.value)}
              className="border p-2 rounded w-full mb-4"
            />
            <h2 className="text-xl font-bold mb-4">Bad Transactions</h2>
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b">Account Name</th>
                  <th className="py-2 px-4 border-b">Card Number</th>
                  <th className="py-2 px-4 border-b">Transaction Amount</th>
                  <th className="py-2 px-4 border-b">Transaction Type</th>
                  <th className="py-2 px-4 border-b">Description</th>
                  <th className="py-2 px-4 border-b">Target Card Number</th>
                </tr>
              </thead>
              <tbody>
                {badTransactions.map((transaction, index) => (
                  <tr key={index}>
                    <td className="py-2 px-4 border-b">{transaction['Account Name']}</td>
                    <td className="py-2 px-4 border-b">{transaction['Card Number']}</td>
                    <td className="py-2 px-4 border-b">{transaction['Transaction Amount']}</td>
                    <td className="py-2 px-4 border-b">{transaction['Transaction Type']}</td>
                    <td className="py-2 px-4 border-b">{transaction['Description']}</td>
                    <td className="py-2 px-4 border-b">{transaction['Target Card Number']}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination for Bad Transactions */}
            <div className="flex justify-between items-center mt-4">
              <button 
                onClick={handlePreviousBadPage} 
                disabled={currentBadPage === 1} 
                className="bg-gray-500 text-white p-2 rounded"
              >
                Previous
              </button>
              <span>Page {currentBadPage} of {totalBadPages}</span>
              <button 
                onClick={handleNextBadPage} 
                disabled={currentBadPage === totalBadPages} 
                className="bg-gray-500 text-white p-2 rounded"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}