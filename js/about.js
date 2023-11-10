// Global variables to hold map and GeoJSON layer
let jsonRecords; // Store original jsonRecords globally
let filteredRecords = []; // Store filtered jsonRecords globally
let markdownModal; // Global variable to hold the reference to the markdown modal
const linkPrefix = 'http://localhost/fowler_landscapes/data/vsl_item_media/1_All_Media/'; // Where the image directory is
let filename = 'test';


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

function generateHTML(jsonObj, headingLevel, linkPrefix) {
  let html = '';
  const headerLevel = Math.min(headingLevel + 1, 6); // Ensure the header level is within h1 to h6

  for (const key in jsonObj) {
    if (key === 'media') {
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
        html += `<button aria-label="Previous" class="glider-prev">«</button>\n`;
        html += `<button aria-label="Next" class="glider-next">»</button>\n`;
        html += `<div role="tablist" class="dots"></div>\n`;
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

// Function to create a new div representing a JSON record
function createRecordDiv(record) {
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
// Function to show the markdown content in a modal-like div
function showMarkdownModal(id) {
  if (markdownModal) {
    clearMarkdownModal();
  }

  markdownModal = document.getElementById('markdownModal');
  const closeButton = markdownModal.querySelector('.close');
  const markdownContent = markdownModal.querySelector('#markdownContent');

  $.ajax({
    url: `data/markdown/${id}.md`,
    dataType: 'text',
    success: function (mdContent) {
      var jsonOutput = parseMarkdownToJSON(mdContent, id, 3);
      jsonOutput.media = parseMarkdownToJSON(jsonOutput.media, id, 4);
      jsonOutput.media = transformJSON(jsonOutput.media);
      var jsonOutputHtml = generateHTML(jsonOutput, 3, linkPrefix);

      markdownContent.innerHTML = jsonOutputHtml;
      markdownModal.style.display = 'block';

      // Find all elements with the class "glider" and create image slideshows
      const gliderElements = markdownContent.querySelectorAll('.glider');
      gliderElements.forEach((element, index) => {
        createImageSlideshow(element);
      });
    },
    error: function (xhr, status, error) {
      console.error(`Error fetching markdown file: ${error}`);
    }
  });

  closeButton.addEventListener('click', function () {
    clearMarkdownModal();
  });
}

// Function to create an image slideshow for a given element
function createImageSlideshow(element) {
  const images = element.querySelectorAll('img');
  let currentImageIndex = 0;

  // Function to display the current image
  function showCurrentImage() {
    images.forEach((image, index) => {
      if (index === currentImageIndex) {
        image.style.display = 'block';
      } else {
        image.style.display = 'none';
      }
    });
  }

  // Initial display
  showCurrentImage();

  // Function to go to the next image
  function nextImage() {
    currentImageIndex++;
    if (currentImageIndex >= images.length) {
      currentImageIndex = 0;
    }
    showCurrentImage();
  }

  // Function to go to the previous image
  function prevImage() {
    currentImageIndex--;
    if (currentImageIndex < 0) {
      currentImageIndex = images.length - 1;
    }
    showCurrentImage();
  }

  // Add event listeners for next and previous buttons
  const nextButton = element.querySelector('.next');
  const prevButton = element.querySelector('.prev');

  nextButton.addEventListener('click', nextImage);
  prevButton.addEventListener('click', prevImage);
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




// Call fetchAndDisplayData() and setupLeafletMap() after the page has loaded
$(document).ready(function () {
  fetchAndDisplayData();
});


function toggleDropdownMenu() {
  $('#dropdownMenu').toggle();
}

function toggleDataTableWindow() {
  const dataTableWindow = document.getElementById('jsonTable');
  dataTableWindow.classList.toggle('hidden');

}
