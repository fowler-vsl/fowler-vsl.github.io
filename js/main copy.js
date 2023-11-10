// Global variables to hold map and GeoJSON layer
let map;
let geojsonLayer;
let jsonRecords; // Store original jsonRecords globally
let filteredRecords = []; // Store filtered jsonRecords globally
let markdownModal; // Global variable to hold the reference to the markdown modal
const linkPrefix = 'http://localhost/fowler_landscapes/data/vsl_item_media/1_All_Media/'; // Where the image directory is
let filename = 'test';

// Create the custom icon
const customIcon = L.icon({
  iconUrl: 'vsl.svg', // Location of the marker image file
  iconSize: [35, 35], // Adjust the icon size as needed
  iconAnchor: [16, 32] // Adjust the icon anchor point if needed
});


// Function to parse markdown content and extract data
function parseMarkdownToJSON(mdContent, fileId, headingLevel) {
  const lines = mdContent.split('\n');
  const jsonOutput = {
    id: fileId // Add the ID extracted from the markdown file name to the JSON object
  };
  let currentKey = '';
  let featuredImage = ''; // Add a variable to store the featured image URL

  const headingRegex = new RegExp(`^${'#'.repeat(headingLevel)}\\s+(.*?)\\s*{\\.(\\w+)}`);

  lines.forEach(line => {
    const headingMatch = line.match(headingRegex);

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
      
      // Check for a line with {.featured_image}
      if (currentKey === 'featured_image') {
        featuredImage = line.trim();
      }
    }
  });

  // Trim any extra newlines from the content
  for (const key in jsonOutput) {
    if (typeof jsonOutput[key] === 'string') {
      jsonOutput[key] = jsonOutput[key].trim();
    }
  }
  
  // Add the featured image URL to the JSON object if it's not blank
  if (featuredImage !== '') {
    fitemp = JSON.stringify(featuredImage, null, 2);
    fitemp = fitemp.replaceAll('\\', '');
    fitemp = fitemp.replaceAll('"', '');

    jsonOutput.featured_image_url = linkPrefix + fitemp;
  }

  return jsonOutput;
}

function transformJSON(jsonObj) {
  // Remove the 'id' key and its value
  delete jsonObj.id;

  // Create a new JSON object to store the nested data
  const nestedJSON = {};

  // Iterate through the keys in the original JSON object
  for (const key in jsonObj) {
    if (jsonObj.hasOwnProperty(key)) {
      const value = jsonObj[key];
      const nestedData = value.split('\n').filter(Boolean); // Split by newline and remove empty lines

      // Create a nested object based on the split data
      const nestedObj = {};

      for (let i = 0; i < nestedData.length; i++) {
        const parts = nestedData[i].split(': ');

        // Check if there are two parts (key and value) before trimming
        if (parts.length === 2) {
          const subKey = parts[0].trim();
          const subValue = parts[1].trim();
          nestedObj[subKey] = subValue;
        }
      }

      // Assign the nested object to the new JSON structure
      nestedJSON[key] = nestedObj;
    }
  }

  return nestedJSON;
}

function generateHTML(jsonObj, headingLevel, linkPrefix, media_key_value) {
  let html = '';
  const headerLevel = Math.min(headingLevel + 1, 6); // Ensure the header level is within h1 to h6

  for (const key in jsonObj) {
    if (key === media_key_value) {
      // Special handling for the 'media' section
      html += `<h${headerLevel}>${key}</h${headerLevel}>`;
      const mediaSection = jsonObj[key];

      for (const mediaKey in mediaSection) {
        html += `<div class="glider-contain">\n`;
        html += `<h${headerLevel + 1}>${mediaKey}</h${headerLevel + 1}>\n`;

        const mediaLinks = mediaSection[mediaKey];
        for (const mediaLink in mediaLinks) {
          const linkText = mediaLinks[mediaLink];
          html += `<p><a href="${linkPrefix}${mediaLink}">${linkPrefix}${mediaLink}: ${linkText}</a></p>\n`;
        }

        html += `<div class="glider">\n`;
        for (const mediaLink in mediaLinks) {
          html += `<div><a href="${linkPrefix}${mediaLink}">${linkPrefix}${mediaLink}: ${mediaLinks[mediaLink]}</a></div>\n`;
        }
        html += `</div>\n`;
        html += `</div>\n`;
      }
    } else {
      // Handling for other top-level keys
      html += `<div class="${key}">\n`;
      html += `<h${headerLevel}>${key}</h${headerLevel}>\n`;
      
      // Check if the value is a string before splitting
      const value = jsonObj[key];
      if (typeof value === 'string') {
        const lines = value.split('\n');
        lines.forEach(line => {
          html += `<p>${line}</p>\n`;
        });
      }
      
      html += `</div>\n`;
    }
  }

  return html;
}

function slugify(text) {
  return text.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
}


function parseMarkdownToHTML(mdContent, filename, media_key_value) {
  const lines = mdContent.split('\n');
  let html = '';
  let currentDivClass = '';
  let currentSubheader = '';
  const currentDivs = [];
  let mediaSubdivId = ''; // Store the ID of the current media sub-div

  function slugify(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }

  function transformLine(line, linkPrefix, subheader) {
    // Transform links to clickable links with target=_blank
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const transformedLine = line.replace(linkRegex, (match, text, url) => {
      const fullUrl = linkPrefix + url;
      return `<a href="${fullUrl}" target="_blank">${text}</a>`;
    });

    return transformedLine;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const headingMatch = line.match(/^(#{1,6})\s+(.*?)\s*(\{\.(\w+)})?$/);

    if (headingMatch) {
      const headingLevel = headingMatch[1].length;
      const headingText = headingMatch[2];
      const headingClass = headingMatch[4] || currentDivClass; // Inherit class from the containing div

      // Create an ID for the div
      const divId = `${filename}_${slugify(headingText)}`;

      if (headingClass.includes(media_key_value)) {
        currentDivClass = headingClass; // Update the class for the current containing div
        currentSubheader = headingText; // Update the current subheader text
        mediaSubdivId = `${divId}_images`; // Create ID for the image sub-div
      }

      // Open a new div with an ID and class for this heading and its subheaders
      const divClass = headingClass ? ` class="${headingClass}"` : '';
      html += `<div id="${divId}"${divClass}><h${headingLevel}>${headingText}</h${headingLevel}>`;

      // Check if it's a media sub-div, and if so, open the image sub-div
      if (mediaSubdivId) {
        html += `<div id="${mediaSubdivId}">`;
      }
      currentDivs.push({ level: headingLevel, id: divId });
    } else {
      // Transform content inside the current div
      let transformedLine = transformLine(line, linkPrefix, currentSubheader);

      if (mediaSubdivId) {
        // If inside the media sub-div, wrap images in the new sub-div
        const imgMatch = line.match(/<a href="([^"]+)"[^>]*><img src="([^"]+)"[^>]*><\/a>/);
        if (imgMatch) {
          const imgSrc = imgMatch[2];
          transformedLine = `<a href="${imgSrc}" target="_blank" class="mySlides fade">${transformedLine}</a>`;
        }
      }

      html += transformedLine;
    }
  }

  // Close any open media sub-div
  if (mediaSubdivId) {
    html += `</div>`;
  }

  // Close any open divs
  for (let i = currentDivs.length - 1; i >= 0; i--) {
    const div = currentDivs[i];
    html += `</div>`;
  }

  return html;
}



function transformLine(line, linkPrefix, subheader, currentDivClass) {
  const lineMatch = line.match(/^(.*?)(:\s*)(.*)$/);

  if (lineMatch) {
    const fileName = lineMatch[1];
    const colon = lineMatch[2];
    const description = lineMatch[3];

    if (isImageFile(fileName)) {
      const imageUrl = `${linkPrefix}${fileName}`;
      let transformedLine = `<a href="${imageUrl}" target="_blank"><img src="${imageUrl}" alt="${description}" /></a>`;

      // Check if we are in the media section
      if (currentDivClass.includes('media')) {
        // Wrap the image link in a new div
        transformedLine = `<div>${transformedLine}</div>`;
      }

      return transformedLine;
    } else {
      const transformedLine = `<a href="${linkPrefix}${fileName}" target="_blank">${description}</a>`;
      return `<p>${transformedLine}</p>\n`;
    }
  }

  // If the line doesn't match the expected pattern, return it as-is
  return `${line}\n`;
}


function isImageFile(fileName) {
  // Add more image file extensions as needed
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg'];
  const fileExtension = fileName.substr(fileName.lastIndexOf('.')).toLowerCase();
  return imageExtensions.includes(fileExtension);
}


function modifyMediaDiv(html, media_div_title) {
  // Create a temporary div element to parse the HTML
  var tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  // Find the media div
  var mediaDiv = tempDiv.querySelector(media_div_title);

  // Check if the media div exists
  if (mediaDiv) {
    // Find all divs nested directly below the media div
    var nestedDivs = mediaDiv.querySelectorAll('div');

    // Iterate through the nested divs
    nestedDivs.forEach(function (nestedDiv) {
      // Change the class of each nested div to "glider_holder"
      nestedDiv.classList.add('glider_holder');

      // Wrap each image inside a new div
      var images = nestedDiv.querySelectorAll('img');
      images.forEach(function (image) {
        var wrapperDiv = document.createElement('div');
        wrapperDiv.classList.add('image_wrapper');
        image.parentNode.replaceChild(wrapperDiv, image);
        wrapperDiv.appendChild(image);
      });
    });

    // Serialize the modified HTML back to a string
    var modifiedHtml = tempDiv.innerHTML;

    // Return the modified HTML
    return modifiedHtml;
  } else {
    // Media div not found, return the original HTML
    return html;
  }
}


// Function to create a new div representing a JSON record
function createRecordDiv(record, elements) {
  const recordDiv = document.createElement('div');
  recordDiv.classList.add('record-div');
  recordDiv.setAttribute('data-id', record.id); // Set the 'data-id' attribute with the ID
  recordDiv.innerHTML = `
    <h3>${record.name_of_site_item_name || ''}</h3>
    <!-- Display the featured image if available -->
    ${record.featured_image_url ? ` <div class="image-container-side"><img src="${record.featured_image_url}" alt="Featured Image" /></div>` : ''}
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
function showMarkdownModal(id) {1
  if (markdownModal) {
    clearMarkdownModal();
  }

  markdownModal = document.getElementById('markdownModal');
  const closeButton = markdownModal.querySelector('.close');
  const markdownContent = markdownModal.querySelector('#markdownContent');
  const rightColumn = markdownModal.querySelector('.image-container'); // Assuming you have a right column in your modal

  $.ajax({
    url: `data/markdown/${id}.md`, // Modify this to your specific data directory
    dataType: 'text',
    success: function (mdContent) {
      var jsonOutput = parseMarkdownToJSON(mdContent, id, 3);
      jsonOutput.media = parseMarkdownToJSON(jsonOutput.media, id, 4);
      jsonOutput.media = transformJSON(jsonOutput.media)
     var jsonOutputHtml = generateHTML(jsonOutput, 3, linkPrefix)
      console.log(jsonOutput)
      console.log(jsonOutputHtml)

      // Clear the rightColumn before adding the new image
      rightColumn.innerHTML = '';

      // Display the image if it's available
      if (jsonOutput.featured_image_url) {
        const imgElement = document.createElement('img');
        imgElement.src = jsonOutput.featured_image_url;
        imgElement.alt = 'Featured Image';
        rightColumn.appendChild(imgElement); // Append the image to the right column of the modal
      }

      //markdownContent.innerHTML = parseMarkdownToHTML(mdContent, filename, linkPrefix);
      markdownContent.innerHTML = jsonOutputHtml
      ///markdownContent.innerHTML = modifyMediaDiv(markdownContent.innerHTML)
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
    pointToLayer: function (feature, latlng) {
      return L.marker(latlng, { icon: customIcon });
    },  
    onEachFeature: function (feature, layer) {
      // Create a popup for each feature
      const popupContent = `
        <h1>${feature.properties.name_of_site_item_name}</h1>
        <h2 style="display: inline-block;">Neighborhood:</h2> ${feature.properties.neighborhood}<br/>
        <h2 style="display: inline-block;">Address:</h2> ${feature.properties.address}<br/>
        <h2 style="display: inline-block;">About:</h2> ${feature.properties.description_blurb}<br/>
        <a href="#" class="popup-link" data-name="${feature.properties.name_of_site_item_name}">...more</a>
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
    url: 'data/markdown/',
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
          url: 'data/markdown/' + file,
          dataType: 'text',
          success: function (mdContent) {
            const parsedJSON = parseMarkdownToJSON(mdContent, fileId, 3);
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
    featured_image_url: record.featured_image_url || '',
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
      { title: 'featured_image_url', data: 'featured_image_url', visible: false }, // Hide the 'featured_image_url' column from the user interface
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
  pointToLayer: function (feature, latlng) {
    return L.marker(latlng, { icon: customIcon });
  },
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
});

// Add the GeoJSON layer with custom markers to the map
geojsonLayer.addTo(map);



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

function setupLeafletMap() {
  // Set the initial view of the map to Los Angeles
  map = L.map('map').setView([34.0522, -118.2437], 10);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);


  // Event listener for clicking the popup links
  map.on('popupopen', function (e) {
    const popupLink = e.popup._contentNode.querySelector('.popup-link');
    if (popupLink) {
      popupLink.addEventListener('click', function (event) {
        event.preventDefault();
        const nameOfSiteItem = popupLink.getAttribute('data-name');
        openFeatureDivFromMap(nameOfSiteItem); // Call your function to open the corresponding feature div
      });
    }
  });
}

function openFeatureDivFromMap(nameOfSiteItem) {
  const recordDivs = document.querySelectorAll('.record-div');
  
  for (const div of recordDivs) {
    const titleElement = div.querySelector('h3');
    if (titleElement && titleElement.textContent.includes(nameOfSiteItem)) {
      const id = div.getAttribute('data-id');
      showMarkdownModal(id);
      return; // Stop searching after finding the first match
    }
  }
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
