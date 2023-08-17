// Global variables to hold map and GeoJSON layer
let map;
let geojsonLayer;
let jsonRecords; // Store original jsonRecords globally
let filteredRecords = []; // Store filtered jsonRecords globally
let markdownModal; // Global variable to hold the reference to the markdown modal


// Function to parse markdown content and extract data
function parseMarkdownToJSON(mdContent, fileId) {
  const lines = mdContent.split('\n');
  const jsonOutput = {
    id: fileId // Add the ID extracted from the markdown file name to the JSON object
  };
  let currentKey = '';

  lines.forEach(line => {
    const headingMatch = line.match(/^###\s+(.*?)\s*{\.(\w+)}$/);

    if (headingMatch) {
      const customId = headingMatch[2].trim();
      currentKey = customId;
      jsonOutput[currentKey] = '';
    } else if (currentKey && line.trim() !== '') {
      // Add the content under the current key
      if (currentKey === 'latitude' || currentKey === 'longitude') {
        jsonOutput[currentKey] = parseFloat(line); // Parse latitude and longitude as numbers
      } else {
        if (jsonOutput[currentKey] === '') {
          jsonOutput[currentKey] = line + '\n';
        } else {
          jsonOutput[currentKey] += '\n' + line;
        }
      }
    }
  });

  // Trim any extra newlines from the content
  for (const key in jsonOutput) {
    if (typeof jsonOutput[key] === 'string') {
      jsonOutput[key] = jsonOutput[key].trim();
    }
  }
  console.log(jsonOutput);
  return jsonOutput;
}



// Function to parse markdown content to HTML
function parseMarkdownToHTML(mdContent) {
  const lines = mdContent.split('\n');
  let html = '';
  let currentHeadingLevel = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for headings and content
    const headingMatch = line.match(/^###\s(.+)\s\{\.(\w+)\}$/);
    if (headingMatch) {
      const headingText = headingMatch[1];
      const headingId = headingMatch[2];

      // Close the previous heading
      if (currentHeadingLevel > 0) {
        html += `</h${currentHeadingLevel}>`;
      }

      // Convert headings to HTML elements
      html += `<h3 id="${headingId}">${headingText}: `;
      currentHeadingLevel = 3;
    } else if (line.startsWith('http')) {
      // Convert URLs to live links
      html += `<a href="${line}" target="_blank">${line}</a>`;
    } else {
      // Convert regular text to paragraphs
      html += `${line}`;
    }
  }

  // Close the last heading
  if (currentHeadingLevel > 0) {
    html += `</h${currentHeadingLevel}>`;
  }

  return html;
}


// Function to create a new div representing a JSON record
function createRecordDiv(record) {
  const recordDiv = document.createElement('div');
  recordDiv.classList.add('record-div');
  recordDiv.setAttribute('data-id', record.id); // Set the 'data-id' attribute with the ID
  recordDiv.innerHTML = `
    <h3>${record.name_of_site_item_name || ''}</h3>
    <p><strong>Link:</strong> <a href="${record.website || ''}" target="_blank">${record.website || ''}</a></p>
    <p><strong>Neighborhood:</strong> ${record.neighborhood || ''}</p>
    <p><strong>Address:</strong> ${record.address || ''}</p>
    <p><strong>About:</strong> ${record.description_blurb || ''}</p>
  `;

  // Add a click event listener to each left side div
  recordDiv.addEventListener('click', function () {
    const id = record.id;
    showMarkdownModal(id);
  });

  return recordDiv;
}


// Function to show the markdown content in a modal-like div
function showMarkdownModal(id) {
  if (markdownModal) {
    clearMarkdownModal();
  }

  markdownModal = document.getElementById('markdownModal');
  const closeButton = markdownModal.querySelector('.close');
  const markdownContent = markdownModal.querySelector('#markdownContent');

  $.ajax({
    url: `data/markdown/${id}.md`, // Modify this to your specific data directory
    dataType: 'text',
    success: function (mdContent) {
      markdownContent.innerHTML = parseMarkdownToHTML(mdContent);
      markdownModal.style.display = 'block';
    },
    error: function (xhr, status, error) {
      console.error(`Error fetching markdown file: ${error}`);
    }
  });

  // Close the modal when the "x" button is clicked
  closeButton.addEventListener('click', function () {
    clearMarkdownModal();
  });
}

// Function to clear the markdown modal content
function clearMarkdownModal() {
  if (markdownModal) {
    markdownModal.style.display = 'none';
    const markdownContent = markdownModal.querySelector('#markdownContent');
    markdownContent.innerHTML = '';
    markdownModal = null;
  }
}

// Function to update the left column div with record divs
function updateLeftColumnDiv() {
  const dataTable = $('#dataTable').DataTable();
  const data = dataTable.rows({ search: 'applied' }).data();
  const leftColumnDiv = document.querySelector('.left-column-divs-container');
  leftColumnDiv.innerHTML = ''; // Clear existing content

  // Check if the DataTable is empty
  if (data.length === 0) {
    const noRecordsDiv = document.createElement('div');
    noRecordsDiv.classList.add('no-records-message');
    noRecordsDiv.textContent = 'No records found.';
    leftColumnDiv.appendChild(noRecordsDiv);
  } else {
    // Create a div for each data row and append it to the left column div
    data.each(record => {
      const recordDiv = createRecordDiv(record);
      leftColumnDiv.appendChild(recordDiv);
    });
  }
}


function updateMapWithFeatures(features) {
  const geojsonLayer = L.geoJSON(features, {
    onEachFeature: function (feature, layer) {
      // Create a popup for each feature
      const popupContent = `
        <strong>${feature.properties.name_of_site_item_name}</strong><br>
        Neighborhood: ${feature.properties.neighborhood}<br>
        Address: ${feature.properties.address}<br>
        About: ${feature.properties.description_blurb}
      `;

      layer.bindPopup(popupContent);
    }
  });

  return geojsonLayer;
}


// Function to update the map based on the current features in the left side div
function updateMap() {
  const validFeatures = filteredRecords
    .filter(record => typeof record.latitude === 'number' && typeof record.longitude === 'number')
    .map(record => ({
      type: 'Feature',
      properties: {
        name_of_site_item_name: record.name_of_site_item_name || '',
        website: record.website || '',
        neighborhood: record.neighborhood || '',
        address: record.address || '',
        description_blurb: truncateText(record.description_blurb || '', 100 || '') // Handle potential undefined property
      },
      geometry: {
        type: 'Point',
        coordinates: [parseFloat(record.longitude), parseFloat(record.latitude)]
      }
    }));

  if (map) {
    if (geojsonLayer) {
      geojsonLayer.clearLayers();
    }
    geojsonLayer = updateMapWithFeatures(validFeatures);
    geojsonLayer.addTo(map);
  }
}


function fetchAndDisplayData() {
  $.ajax({
    url: './data/markdown/',
    success: function (data) {
      const markdownFiles = $(data).find('a[href$=".md"]');

      jsonRecords = [];
      filteredRecords = [];

      function processMarkdownFile(index) {
        if (index >= markdownFiles.length) {
          displayDataTable(jsonRecords);

          // Update the map and left column divs here
          updateMap();
          updateLeftColumnDiv();

          return;
        }

        const file = markdownFiles[index].getAttribute('href');
        const fileId = file.replace('.md', '');
        $.ajax({
          url: './data/markdown/' + file,
          dataType: 'text',
          success: function (mdContent) {
            const parsedJSON = parseMarkdownToJSON(mdContent, fileId);
            jsonRecords.push(parsedJSON);
            processMarkdownFile(index + 1);
          },
          error: function (xhr, status, error) {
            console.error(`Error fetching file: ${file} - ${error}`);
            processMarkdownFile(index + 1);
          }
        });
      }

      processMarkdownFile(0);
    },
    error: function (xhr, status, error) {
      console.error(`Error fetching directory: ${error}`);
    }
  });
}


function displayDataTable(records) {
  jsonRecords = records; // Store original jsonRecords in the global variable
  filteredRecords = records; // Initialize filteredRecords with all records initially

  const dataTableData = records.map(record => ({
    id: record.id, // Keep the 'id' property in the dataTableData
    name_of_site_item_name: record.name_of_site_item_name || '',
    website: record.website || '',
    neighborhood: record.neighborhood || '',
    address: record.address || '',
    longitude: record.longitude || '',
    latitude: record.latitude || '',
    description_blurb: truncateText(record.description_blurb, 100 || '') // Truncate to the first 3 lines
  }));

  const dataTable = $('#dataTable').DataTable({
    data: dataTableData,
    columns: [
      { title: 'ID', data: 'id', visible: false }, // Hide the 'id' column from the user interface
      { title: 'Title', data: 'name_of_site_item_name' },
      { title: 'Link', data: 'website' },
      { title: 'Neighborhood', data: 'neighborhood' },
      { title: 'Address', data: 'address' },
      { title: 'longitude', data: 'longitude' },
      { title: 'latitude', data: 'latitude' },
      { title: 'About', data: 'description_blurb' }
    ]
  });

  
  // Event listener for DataTable draw event to update the left column div
  dataTable.on('draw.dt', function () {
    // Get the filtered data from the DataTable
    updateFilteredRecords() ;

    updateLeftColumnDiv();

    updateMap(); 
  });

    // Event listener for DataTable draw event to update the left column div
    dataTable.on('search.dt', function () {
      // Get the filtered data from the DataTable
      updateFilteredRecords() ;
  
      updateLeftColumnDiv();

      updateMap(); 
    });


  if (geojsonLayer) {
    geojsonLayer.clearLayers();
  }

  // Create a GeoJSON feature collection from the records
  const geojsonFeatures = records.map(record => {
    if (typeof record.latitude === 'number' && typeof record.longitude === 'number') {
      return {
        type: 'Feature',
        properties: {
          title: record.name_of_site_item_name || '',
          link: record.website || '',
          neighborhood: record.neighborhood || '',
          address: record.address || '',
          about: truncateText(record.description_blurb || '', 100 || '') // Handle potential undefined property
        },
        geometry: {
          type: 'Point',
          coordinates: [parseFloat(record.longitude), parseFloat(record.latitude)]
        }
      };
    }
    return null; // Skip this record if lat or lon is not a number
  }).filter(feature => feature !== null); // Remove null values from the array
  

  // Create the GeoJSON layer and add it to the map
  geojsonLayer = L.geoJSON(geojsonFeatures, {
    onEachFeature: function (feature, layer) {
      // Create a popup for each feature
      const popupContent = `
        <h3>${feature.properties.name_of_site_item_name}</h3>
        <strong>Neighborhood:</strong> ${feature.properties.neighborhood}<br>
        <strong>Address:</strong> ${feature.properties.address}<br>
        <strong>About:</strong> ${feature.properties.description_blurb}
      `;

      layer.bindPopup(popupContent);
    }
  }).addTo(map);

  $('#jsonTable').show();
  updateLeftColumnDiv(); // Call updateLeftColumnDiv() to update the left side divs

}


// Function to update the filteredRecords array based on DataTable search
function updateFilteredRecords() {
  const dataTable = $('#dataTable').DataTable();
  const searchValue = dataTable.search();

  if (searchValue) {
    filteredRecords = jsonRecords.filter(record => {
      return (
        (record.name_of_site_item_name || '').toLowerCase().includes(searchValue.toLowerCase()) ||
        (record.website || '').toLowerCase().includes(searchValue.toLowerCase()) ||
        (record.neighborhood || '').toLowerCase().includes(searchValue.toLowerCase()) ||
//        (record.address || '').toLowerCase().includes(searchValue.toLowerCase()) ||
        (record.description_blurb || '').toLowerCase().includes(searchValue.toLowerCase())
      );
    });
  } else {
    filteredRecords = jsonRecords;
  }

  updateLeftColumnDiv(); // Update the left column div with the filtered data
}



function truncateText(text, maxLength) {
  if (typeof text === 'string' && text.length > maxLength) {
    return text.slice(0, maxLength) + '...';
  }
  return text;
}



function closeDataTableWindow() {
  $('#jsonTable').hide();
}

// Leaflet map script (replace with your map code)
// For example, create a simple map with OpenStreetMap tiles
function setupLeafletMap() {
  // Set the initial view of the map to Los Angeles
  map = L.map('map').setView([34.0522, -118.2437], 10);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
}


// Call fetchAndDisplayData() and setupLeafletMap() after the page has loaded
$(document).ready(function () {
  fetchAndDisplayData();
  setupLeafletMap();
});


function toggleDropdownMenu() {
  $('#dropdownMenu').toggle();
}

function toggleDataTableWindow() {
  const dataTableWindow = document.getElementById('jsonTable');
  dataTableWindow.classList.toggle('hidden');

}
