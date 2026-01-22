const GENSET_LIST_BASE_URL = 'https://gensetapi.genset.com.my/api/gensets';
const ALARM_LIST_BASE_URL = 'https://gensetapi.genset.com.my/api/alarm-list';

// NocoDB API configuration
const NOCODB_API_TOKEN = 'vwjlzudarqts22yh';
const NOCODB_BASE_URL = 'https://mgmgenerator.com/nocodb/api/v1';
const NOCODB_WORKSPACE = 'pu7hatrkbloa642';
const NOCODB_TABLE = 'smartgen-dashboard';
const NOCODB_API_URL = `${NOCODB_BASE_URL}/db/data/noco/${NOCODB_WORKSPACE}/${NOCODB_TABLE}`;

// Master token to fetch all gensets (hardcoded)
const MASTER_TOKEN = 'bebf6914640ec3ed6bf00398fb7969da';

let currentToken = null;
let userTokens = []; // Array to store multiple tokens per user
let userSite = ''; // Store user's site name
let statusChart = null;
let map = null;
let markers = [];
let allGensets = [];

let currentFilter = 'all';
let isLoggedIn = false;
let autoRefreshInterval = null;
let customerName = '';

function startAutoRefresh() {
  // Clear any existing interval
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
  }
  // Start new interval to refresh every 30 seconds
  autoRefreshInterval = setInterval(refreshDashboard, 30000);
  console.log('Auto-refresh started: refreshing data every 30 seconds');
}

function stopAutoRefresh() {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
    autoRefreshInterval = null;
    console.log('Auto-refresh stopped');
  }
}

// Start Genset Function - Customize the API endpoint and parameters as needed
async function startGenset(gensetId) {
  if (!confirm(`Are you sure you want to start genset ${gensetId}?`)) {
    return;
  }

  try {
    console.log(`▶️ Attempting to start genset: ${gensetId}`);

    // TODO: Replace with your actual start genset API endpoint
    // This is a placeholder - you'll need to update this with the correct API details
    const START_API_URL = `https://gensetapi.genset.com.my/api/start`;

    const response = await fetch(START_API_URL, {
      method: 'POST', // or 'PUT' depending on your API
      headers: {
        'Content-Type': 'application/json',
        // Add any required headers like authorization
      },
      body: JSON.stringify({
        gensetId: gensetId,
        // Add any other required parameters
        utoken: (currentToken && typeof currentToken === 'string' && currentToken.startsWith('http')) ? null : currentToken
      })
    });

    if (!response.ok) {
      throw new Error(`Start genset failed! HTTP status: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Genset start command sent successfully:', result);

    // Show success message
    alert(`Genset ${gensetId} start command sent successfully!`);

    // Refresh the dashboard to show updated status
    refreshDashboard();

  } catch (error) {
    console.error('❌ Error starting genset:', error);
    alert(`Failed to start genset: ${error.message}`);
  }
}

// Stop Genset Function - Customize the API endpoint and parameters as needed
async function stopGenset(gensetId) {
  if (!confirm(`Are you sure you want to stop genset ${gensetId}?`)) {
    return;
  }

  try {
    console.log(`🛑 Attempting to stop genset: ${gensetId}`);

    // TODO: Replace with your actual stop genset API endpoint
    // This is a placeholder - you'll need to update this with the correct API details
    const STOP_API_URL = `https://gensetapi.genset.com.my/api/stop`;

    const response = await fetch(STOP_API_URL, {
      method: 'POST', // or 'PUT' depending on your API
      headers: {
        'Content-Type': 'application/json',
        // Add any required headers like authorization
      },
      body: JSON.stringify({
        gensetId: gensetId,
        // Add any other required parameters
        utoken: (currentToken && typeof currentToken === 'string' && currentToken.startsWith('http')) ? null : currentToken
      })
    });

    if (!response.ok) {
      throw new Error(`Stop genset failed! HTTP status: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Genset stop command sent successfully:', result);

    // Show success message
    alert(`Genset ${gensetId} stop command sent successfully!`);

    // Refresh the dashboard to show updated status
    refreshDashboard();

  } catch (error) {
    console.error('❌ Error stopping genset:', error);
    alert(`Failed to stop genset: ${error.message}`);
  }
}

async function fetchGensetData(urlOrToken) {
  try {
    // Fetch all gensets from the new API
    let allGensets = [];
    let page = 1;
    const perPage = 100;
    let totalPages = 1;

    console.log('📡 Fetching all genset data from new API');

    while (page <= totalPages) {
      const API_URL = `${GENSET_LIST_BASE_URL}?page=${page}&per_page=${perPage}`;
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ Page ${page} fetched successfully, success: ${data.success}, code: ${data.data?.code}, total: ${data.data?.data?.total || 0}, list length: ${data.data?.data?.list?.length || 0}`);

      if (data.success && data.data && data.data.code === 200 && data.data.data && data.data.data.list) {
        allGensets = allGensets.concat(data.data.data.list);
        totalPages = Math.ceil(data.data.data.total / perPage);
      } else {
        throw new Error(`API error! code: ${data.data?.code || 'undefined'}, message: ${data.data?.msg || 'undefined'}`);
      }

      page++;
    }

    const resultData = { data: { list: allGensets, total: allGensets.length } };
    console.log('✅ All genset data fetched successfully');
    console.log('API response data:', resultData);

    // Filter gensets based on current user's tokens
    if (resultData.data && resultData.data.list) {
      console.log('User tokens:', userTokens);
      console.log('Genset tokens:', resultData.data.list.map(g => g.token));
      // If user has the master token, show all gensets
      if (userTokens.includes(MASTER_TOKEN)) {
        resultData.data.total = resultData.data.list.length;
        console.log(`🔍 Master token: showing all ${resultData.data.list.length} gensets`);
      } else {
        // Filter to show gensets that match any of the user's tokens
        resultData.data.list = resultData.data.list.filter(genset => userTokens.includes(genset.token));
        resultData.data.total = resultData.data.list.length;
        console.log(`🔍 Filtered to ${resultData.data.list.length} gensets for ${userTokens.length} tokens`);
      }
    }

    return resultData;
  } catch (error) {
    console.error('❌ Error fetching genset data:', error);
    throw error;
  }
}

// Fetch user data from NocoDB by email
async function fetchUserFromNocoDB(email, password) {
  try {
    console.log('📡 Fetching user from NocoDB:', email);
    console.log('🔐 Password length:', password.length);

    console.log('🌐 NocoDB URL:', NOCODB_API_URL);

    const response = await fetch(NOCODB_API_URL, {
      headers: {
        'xc-auth': NOCODB_API_TOKEN
      }
    });

    if (!response.ok) {
      console.error('❌ NocoDB API error:', response.status, response.statusText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ NocoDB response received');
    console.log('📊 Number of records found:', data.list?.length || 0);

    // NocoDB returns data in 'list' array
    if (data.list && data.list.length > 0) {
      console.log('📝 First record fields:', Object.keys(data.list[0]));
      console.log('📧 Email in record:', data.list[0].Email || data.list[0].email);
      console.log('🔑 Password in record:', data.list[0].Password ? 'Present' : 'Not found');

      // Find record with matching email and verify password on client-side
      const record = data.list.find(r => {
        const recordEmail = r.Email || r.email || '';
        const recordPassword = r.Password || r.password || '';
        console.log('🔐 Comparing:');
        console.log('  - Input email:', email);
        console.log('  - Record email:', recordEmail);
        console.log('  - Email match:', recordEmail.toLowerCase() === email.toLowerCase());
        console.log('  - Input password:', password);
        console.log('  - Record password:', recordPassword);
        console.log('  - Password match:', recordPassword === password);
        return recordEmail.toLowerCase() === email.toLowerCase() && recordPassword === password;
      });

      if (record) {
        console.log('✅ Email and password match found!');
        // Return in Airtable-compatible format for existing code
        return {
          records: [{
            id: record.Id || record.id,
            fields: {
              Email: record.Email || record.email,
              Password: record.Password || record.password,
              Token: record.Token || record.token,
              Site: record.Site || record.site
            }
          }]
        };
      } else {
        console.log('❌ No matching email/password combination found');
        // No matching record found
        return { records: [] };
      }
    } else {
      console.log('❌ No records found in NocoDB');
      return { records: [] };
    }
  } catch (error) {
    console.error('❌ Error fetching user from NocoDB:', error);
    throw error;
  }
}



function formatDate(timestamp) {
  if (!timestamp) return 'N/A';
  const date = new Date(timestamp * 1000);
  return date.toLocaleString();
}

function getStatusBadge(status) {
  const statusMap = {
    0: { text: 'Offline', class: 'text-muted' },
    1: { text: 'Running', class: 'text-success' },
    2: { text: 'Idle', class: 'text-warning' },
    3: { text: 'Running', class: 'text-success' },
    4: { text: 'Error', class: 'text-danger' },
    5: { text: 'Error', class: 'text-danger' }
  };
  return statusMap[status] || { text: 'Unknown', class: 'text-muted' };
}

function updateDashboard(data) {
  const gensets = data.data?.list || [];

  // Update last updated timestamp
  updateLastUpdated();

  // Update stats - add null checks
  const totalElement = document.getElementById('total-gensets');
  const runningElement = document.getElementById('running-gensets');
  const idleElement = document.getElementById('stopped-gensets');
  const offlineElement = document.getElementById('faulty-gensets');
  const errorElement = document.getElementById('error-gensets');

  if (totalElement) {
    totalElement.textContent = data.data?.total || gensets.length;
  }

  // Status mapping: running is 1 and 3; idle is 2; offline is 0; error is 4,5
  const runningCount = gensets.filter(g => g.status === 1 || g.status === 3).length;
  const idleCount = gensets.filter(g => g.status === 2).length;
  const offlineCount = gensets.filter(g => g.status === 0).length;
  const errorCount = gensets.filter(g => g.status === 4 || g.status === 5).length;

  if (runningElement) {
    runningElement.textContent = runningCount;
  }
  if (idleElement) {
    idleElement.textContent = idleCount;
  }
  if (offlineElement) {
    offlineElement.textContent = offlineCount;
  }
  if (errorElement) {
    errorElement.textContent = errorCount;
  }

  // Update pie chart
  updateStatusChart(runningCount, idleCount, offlineCount, errorCount);

  // Update map
  updateMap(gensets);

  // Update table - add null check
  const tableBody = document.getElementById('genset-table-body');
  if (tableBody) {
    tableBody.innerHTML = '';

    gensets.forEach(genset => {
      const status = getStatusBadge(genset.status);
      const row = document.createElement('tr');

      row.innerHTML = `
        <td>${genset.id || 'N/A'}</td>
        <td>${genset.gsname || 'N/A'}</td>
        <td><span class="${status.class}">${status.text}</span></td>
        <td><a href="#" onclick="showAlarms(${genset.id})" style="color: #3b82f6; text-decoration: underline;">${genset.alarmnum || '0'}</a></td>
        <td>${genset.daytime || 'N/A'}</td>
        <td>${genset.totaltime || 'N/A'}</td>
        <td>${genset.gsaddress || 'N/A'}</td>
      `;
      tableBody.appendChild(row);
    });
  }
}



function updateLastUpdated() {
  const lastUpdatedElement = document.getElementById('last-updated');
  if (lastUpdatedElement) {
    const now = new Date();
    const timeString = now.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
    lastUpdatedElement.textContent = `Last updated: ${timeString}`;
  }
}

function updateStatusChart(running, idle, offline, error) {
  const ctx = document.getElementById('statusChart').getContext('2d');

  // If chart doesn't exist, create it
  if (!statusChart) {
    statusChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Running', 'Idle', 'Offline', 'Error'],
        datasets: [{
          data: [running || 0, idle || 0, offline || 0, error || 0],
          backgroundColor: [
            '#10b981', // green for running
            '#f59e0b', // yellow for idle
            '#ef4444', // red for offline
            '#6b7280'  // grey for error
          ],
          borderColor: [
            '#059669',
            '#d97706',
            '#dc2626',
            '#4b5563'
          ],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 1.5,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 10,
              usePointStyle: true,
              font: {
                size: 11
              }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.parsed || 0;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        },
        layout: {
          padding: {
            top: 10,
            bottom: 10,
            left: 10,
            right: 10
          }
        }
      }
    });
  } else {
    // Update existing chart data
    statusChart.data.datasets[0].data = [running || 0, idle || 0, offline || 0, error || 0];
    statusChart.update('none'); // Update without animation to prevent flickering
  }
}

function updateMap(gensets) {
  // Store all gensets for filtering
  allGensets = gensets;

  // Initialize map if not already done
  if (!map) {
    map = L.map('map').setView([3.047, 101.363], 10); // Default to Klang area

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Add fullscreen control
    L.control.fullscreen({
      position: 'topright',
      title: 'View Fullscreen',
      titleCancel: 'Exit Fullscreen'
    }).addTo(map);
  }

  // Apply current filter
  applyMapFilter();
}

function applyMapFilter() {
  // Clear existing markers
  markers.forEach(marker => map.removeLayer(marker));
  markers = [];

  // Filter gensets based on current filter
  let filteredGensets = allGensets;
  if (currentFilter === 'running') {
    filteredGensets = allGensets.filter(g => g.status === 1 || g.status === 3);
  } else if (currentFilter === 'idle') {
    filteredGensets = allGensets.filter(g => g.status === 2);
  } else if (currentFilter === 'offline') {
    filteredGensets = allGensets.filter(g => g.status === 0);
  } else if (currentFilter === 'error') {
    filteredGensets = allGensets.filter(g => g.status === 4 || g.status === 5);
  }

  // Add markers for filtered gensets
  filteredGensets.forEach(genset => {
    if (genset.latitude && genset.longitude) {
      const status = getStatusBadge(genset.status);
      let markerColor = 'red'; // default for offline
      if (genset.status === 1 || genset.status === 3) {
        markerColor = 'green'; // running gensets
      } else if (genset.status === 2) {
        markerColor = 'yellow'; // idle gensets
      } else if (genset.status === 4 || genset.status === 5) {
        markerColor = 'grey'; // error gensets
      }

      const marker = L.marker([parseFloat(genset.latitude), parseFloat(genset.longitude)], {
        icon: L.divIcon({
          className: 'custom-marker',
          html: `<div style="background-color: ${markerColor}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        })
      });

      marker.bindPopup(`
        <div style="font-family: Inter, sans-serif; max-width: 200px;">
          <h3 style="margin: 0 0 8px 0; font-weight: 600; color: #1f2937;">${genset.gsname || 'N/A'}</h3>
          <p style="margin: 4px 0; color: #6b7280;"><strong>ID:</strong> ${genset.id || 'N/A'}</p>
          <p style="margin: 4px 0; color: #6b7280;"><strong>Status:</strong> <span style="color: ${status.class === 'text-success' ? '#10b981' : status.class === 'text-warning' ? '#f59e0b' : status.class === 'text-danger' ? '#ef4444' : '#6b7280'};">${genset.status_name || status.text}</span></p>
          <p style="margin: 4px 0; color: #6b7280;"><strong>Address:</strong> ${genset.gsaddress || 'N/A'}</p>
          <p style="margin: 4px 0; color: #6b7280;"><strong>Total Time:</strong> ${genset.totaltime || 'N/A'}</p>
        </div>
      `);

      marker.addTo(map);
      markers.push(marker);
    }
  });

  // Fit map to show filtered markers
  if (markers.length > 0) {
    const group = new L.featureGroup(markers);
    map.fitBounds(group.getBounds().pad(0.1));
  }
}

function updateFilterButtons() {
  // Reset all buttons
  document.getElementById('filter-all').className = 'btn btn-secondary text-xs px-3 py-1';
  document.getElementById('filter-running').className = 'btn btn-success text-xs px-3 py-1';
  document.getElementById('filter-idle').className = 'btn btn-warning text-xs px-3 py-1';
  document.getElementById('filter-offline').className = 'btn btn-danger text-xs px-3 py-1';
  document.getElementById('filter-error').className = 'btn btn-dark text-xs px-3 py-1';

  // Highlight active button
  if (currentFilter === 'running') {
    document.getElementById('filter-running').className = 'btn btn-success text-xs px-3 py-1 active';
  } else if (currentFilter === 'idle') {
    document.getElementById('filter-idle').className = 'btn btn-warning text-xs px-3 py-1 active';
  } else if (currentFilter === 'offline') {
    document.getElementById('filter-offline').className = 'btn btn-danger text-xs px-3 py-1 active';
  } else if (currentFilter === 'error') {
    document.getElementById('filter-error').className = 'btn btn-dark text-xs px-3 py-1 active';
  } else {
    document.getElementById('filter-all').className = 'btn btn-secondary text-xs px-3 py-1 active';
  }
}

async function initDashboard() {
  try {
    // Only show loading on initial load, not on refreshes
    if (!document.getElementById('dashboard').style.display || document.getElementById('dashboard').style.display === 'none') {
      document.getElementById('loading').style.display = 'flex';
      document.getElementById('error').style.display = 'none';
      document.getElementById('dashboard').style.display = 'none';
    }

    const data = await fetchGensetData(currentToken);

    // Hide loading only on initial load
    if (document.getElementById('loading').style.display === 'flex') {
      document.getElementById('loading').style.display = 'none';
      document.getElementById('dashboard').style.display = 'block';
    }

    updateDashboard(data);
  } catch (error) {
    // Only show error on initial load, not on refreshes
    if (!document.getElementById('dashboard').style.display || document.getElementById('dashboard').style.display === 'none') {
      document.getElementById('loading').style.display = 'none';
      document.getElementById('error').style.display = 'block';
      document.getElementById('error').textContent = `Error loading data: ${error.message}`;
    }
    console.error('Dashboard initialization error:', error);
  }
}

async function loadGensets() {
  const urlInput = document.getElementById('api-url-input');
  const tokenInput = document.getElementById('utoken-input');

  const urlValue = urlInput.value.trim();
  const tokenValue = tokenInput.value.trim();

  let inputValue;
  let inputType;

  // Check which input field has data
  if (urlValue) {
    inputValue = urlValue;
    inputType = 'URL';
    console.log('🔗 Using full API URL');
  } else if (tokenValue) {
    inputValue = tokenValue;
    inputType = 'token';
    console.log('🔑 Using token only');
  } else {
    alert('Please enter either a full API URL or a utoken');
    return;
  }

  try {
    // Hide token form and show loading
    document.getElementById('token-form').style.display = 'none';
    document.getElementById('loading').style.display = 'flex';
    document.getElementById('error').style.display = 'none';

    // Save input value and fetch data
    currentToken = inputValue;
    const data = await fetchGensetData(inputValue);

    // Hide loading and show dashboard
    document.getElementById('loading').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';

    updateDashboard(data);

    startAutoRefresh();

  } catch (error) {
    // Hide loading and show error
    document.getElementById('loading').style.display = 'none';
    document.getElementById('error').style.display = 'block';
    document.getElementById('error').textContent = `Error loading genset data: ${error.message}`;

    // Show token form again
    document.getElementById('token-form').style.display = 'block';
  }
}

async function refreshDashboard() {
  if (!currentToken) return;

  try {
    const data = await fetchGensetData(currentToken);
    updateDashboard(data);
    updateDashboardTitle(); // Refresh title every 30 seconds
    console.log('Dashboard refreshed successfully at', new Date().toLocaleTimeString());
  } catch (error) {
    console.error('Dashboard refresh error:', error);
    // Don't show error on refresh failures to avoid disrupting the user
  }
}

function translateAlarmName(chineseName) {
  const translations = {
    '市电欠压': 'Low Mains Voltage',
    '燃油位低': 'Low Fuel Alarm',
    '油压传感器开路': 'Oil Sensor Open Alarm',
    '紧急停机': 'Emergency Stop'
  };
  return translations[chineseName] || chineseName;
}

function translateAlarmRank(chineseRank) {
  const translations = {
    '市电状态': 'Mains Status',
    '停机': 'Shutdown',
    '警告': 'Warning',
    '紧急停机': 'Emergency Stop'
  };
  return translations[chineseRank] || chineseRank;
}

function showAlarms(gensetId) {
  const genset = allGensets.find(g => g.id == gensetId);
  const gensetName = genset ? genset.gsname : 'Unknown';
  let gensetAlarms = genset ? (genset.alarm_list || []) : [];

  // Filter out mains failure alarms if checkbox is checked
  const hideMainsAlarms = document.getElementById('hide-mains-alarms')?.checked;
  if (hideMainsAlarms) {
    gensetAlarms = gensetAlarms.filter(alarm => {
      const translatedName = translateAlarmName(alarm.alarm_name) || '';
      const translatedRank = translateAlarmRank(alarm.alarm_rank) || '';
      // Hide alarms that contain "Mains" in name or rank
      return !translatedName.toLowerCase().includes('mains') &&
             !translatedRank.toLowerCase().includes('mains');
    });
  }

  const tableBody = document.getElementById('alarm-table-body');
  if (tableBody) {
    tableBody.innerHTML = '';

    if (gensetAlarms.length === 0) {
      const message = hideMainsAlarms && genset && (genset.alarm_list || []).length > 0
        ? 'All alarms hidden (Mains failure alarms filtered)'
        : 'No alarms found for this genset';
      const row = document.createElement('tr');
      row.innerHTML = `<td colspan="6" style="text-align: center; color: #6b7280;">${message}</td>`;
      tableBody.appendChild(row);
    } else {
      gensetAlarms.forEach(alarm => {
        const row = document.createElement('tr');

        row.innerHTML = `
          <td>${gensetId}</td>
          <td>${gensetName}</td>
          <td>${translateAlarmName(alarm.alarm_name) || 'N/A'}</td>
          <td>${translateAlarmRank(alarm.alarm_rank) || 'N/A'}</td>
          <td>${formatDate(alarm.starttime)}</td>
          <td>${alarm.endtime ? formatDate(alarm.endtime) : 'Ongoing'}</td>
        `;
        tableBody.appendChild(row);
      });
    }
  }
}

function checkLoginStatus() {
  const loginData = sessionStorage.getItem('smartgen_login');
  if (loginData) {
    const { email, tokens, site, customerName: storedCustomerName, timestamp } = JSON.parse(loginData);
    // Check if login is still valid (e.g., not expired, say 24 hours)
    const now = Date.now();
    const expiry = 24 * 60 * 60 * 1000; // 24 hours
    if (now - timestamp < expiry && tokens && tokens.length > 0) {
      userTokens = tokens;
      userSite = site || '';
      customerName = storedCustomerName || 'Customer';
      currentToken = tokens[0]; // Use first token for compatibility
      isLoggedIn = true;
      showDashboard();
      return;
    }
  }
  showLogin();
}

function showLogin() {
  document.getElementById('login-section').classList.remove('hidden');
  document.getElementById('main-app').classList.add('hidden');
}

function showDashboard() {
  document.getElementById('login-section').classList.add('hidden');
  document.getElementById('main-app').classList.remove('hidden');
  updateUserInfo();
  updateDashboardTitle();
  initDashboard();
}

async function handleLogin(event) {
  event.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  if (!email) {
    document.getElementById('login-error').textContent = 'Please enter your Gmail address';
    document.getElementById('login-error').classList.remove('hidden');
    return;
  }

  if (!password) {
    document.getElementById('login-error').textContent = 'Please enter your password';
    document.getElementById('login-error').classList.remove('hidden');
    return;
  }

  // Email validation (Gmail only)
  const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
  if (!emailRegex.test(email)) {
    document.getElementById('login-error').textContent = 'Please enter a valid Gmail address';
    document.getElementById('login-error').classList.remove('hidden');
    return;
  }

  // Show loading state
  const submitBtn = document.getElementById('login-submit-btn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Logging in...';
  document.getElementById('login-error').classList.add('hidden');

  try {
    // Fetch user from NocoDB with email and password
    const airtableData = await fetchUserFromNocoDB(email, password);

    if (!airtableData.records || airtableData.records.length === 0) {
      throw new Error('No account found for this email address');
    }

    // Get first matching record
    const record = airtableData.records[0];
    const fields = record.fields;

    // Extract tokens and site from Airtable fields
    const token = fields.Token || fields.token;
    const site = fields.Site || fields.site || 'Unknown Site';

    if (!token) {
      throw new Error('No token found for this user');
    }

    // Handle multiple tokens (separated by spaces or commas)
    userTokens = token.trim().split(/[\s,]+/).filter(t => t.length > 0);
    console.log('✅ Parsed tokens:', userTokens);
    userSite = site;
    currentToken = userTokens[0];
    customerName = email.split('@')[0];
    isLoggedIn = true;

    // Store in sessionStorage
    const loginData = {
      email: email,
      tokens: userTokens,
      site: userSite,
      customerName: customerName,
      timestamp: Date.now()
    };
    sessionStorage.setItem('smartgen_login', JSON.stringify(loginData));

    // Show dashboard
    showDashboard();

  } catch (error) {
    console.error('Login error:', error);
    
    // Show error message
    document.getElementById('login-error').textContent = 
      error.message.includes('No account found') || error.message.includes('401')
        ? 'Invalid email or password' 
        : `Error: ${error.message}`;
    document.getElementById('login-error').classList.remove('hidden');

    // Reset button
    submitBtn.disabled = false;
    submitBtn.textContent = 'Login';
  }
}


function updateUserInfo() {
  const loginData = sessionStorage.getItem('smartgen_login');
  if (loginData) {
    const { email, tokens, site } = JSON.parse(loginData);
    const userInfoElement = document.getElementById('user-info');
    const tokenInfoElement = document.getElementById('token-info');
    
    if (userInfoElement) {
      userInfoElement.textContent = `👤 ${email}`;
    }
    
    if (tokenInfoElement) {
      const firstToken = tokens && tokens.length > 0 ? tokens[0] : '';
      tokenInfoElement.textContent = `🔑 ${firstToken} | 📍 ${site}`;
    }
  }
}

function updateDashboardTitle() {
  const titleElement = document.getElementById('dashboard-title');
  const pageTitle = document.querySelector('title');
  if (titleElement && customerName) {
    const titleText = `⚡ ${customerName} Dashboard`;
    titleElement.textContent = titleText;
    if (pageTitle) {
      pageTitle.textContent = titleText;
    }
    console.log(`📊 Dashboard title updated to: "${titleText}"`);
  }
}

function handleLogout() {
  stopAutoRefresh();
  isLoggedIn = false;
  currentToken = null;
  userTokens = [];
  userSite = '';
  customerName = '';
  sessionStorage.removeItem('smartgen_login');
  
  // Reset login form
  document.getElementById('email').value = '';
  document.getElementById('password').value = '';
  document.getElementById('login-error').classList.add('hidden');
  
  showLogin();
}

// Initialize page when DOM loads
document.addEventListener('DOMContentLoaded', function() {
  // Check login status
  checkLoginStatus();

  // Add login form event listener
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }


  // Add logout button event listener
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }

  // Add event listeners for filter buttons
  document.getElementById('filter-all').addEventListener('click', function() {
    currentFilter = 'all';
    updateFilterButtons();
    applyMapFilter();
  });

  document.getElementById('filter-running').addEventListener('click', function() {
    currentFilter = 'running';
    updateFilterButtons();
    applyMapFilter();
  });

  document.getElementById('filter-idle').addEventListener('click', function() {
    currentFilter = 'idle';
    updateFilterButtons();
    applyMapFilter();
  });

  document.getElementById('filter-offline').addEventListener('click', function() {
    currentFilter = 'offline';
    updateFilterButtons();
    applyMapFilter();
  });

  document.getElementById('filter-error').addEventListener('click', function() {
    currentFilter = 'error';
    updateFilterButtons();
    applyMapFilter();
  });

  // Add event listener for mains alarm filter checkbox
  document.getElementById('hide-mains-alarms').addEventListener('change', function() {
    // Refresh the current alarm display when checkbox changes
    const currentGensetId = allGensets.length > 0 ? allGensets[0].id : null;
    if (currentGensetId) {
      showAlarms(currentGensetId);
    }
  });

  // Start auto-refresh only if logged in
  if (isLoggedIn) {
    startAutoRefresh();
  }
});
