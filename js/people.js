// Global variables to hold map and GeoJSON layer
let jsonRecords; // Store original jsonRecords globally
let filteredRecords = []; // Store filtered jsonRecords globally
let markdownModal; // Global variable to hold the reference to the markdown modal
let map;
let geojsonLayer;


//assign our configuration objects to constant values
const linkPrefix = vslPageConfiguration.linkPrefix;
const mediaPrefix = vslPageConfiguration.mediaPrefix;
const markdownDirectoryUrl = vslPageConfiguration.markdownDirectoryUrl;
const recordCLickable = vslPageConfiguration.recordCLickable;
const datatablePage = vslPageConfiguration.datatablePage;
const smallCardDisp = vslPageConfiguration.smallCardDisp;
const modalCardDisplay = vslPageConfiguration.modalCardDisplay;
const specialFields = vslPageConfiguration.specialFields;
const mapPage = vslPageConfiguration.mapPage;
const smallCardLayoutType = vslPageConfiguration.smallCardLayoutType;
const modalCardLayoutType = vslPageConfiguration.modalCardLayoutType;

if (mapPage == true) {

    function updateMapWithFeatures(features) {
        const geojsonLayer = L.geoJSON(features, {
            pointToLayer: function(feature, latlng) {
                return L.marker(latlng, {
                    icon: customIcon
                });
            },
            onEachFeature: function(feature, layer) {
                // Create a popup for each feature
                let popupContent = '';
                let imageUrl ='';

                if (feature.properties.featured_image){
                    imageUrl = linkPrefix + feature.properties.featured_image;
                }
                popupContent += '<div class="popup-card-container">';
                if (imageUrl !=''){
                    popupContent += '<img src="'+ imageUrl + '" alt="Image of' +  feature.properties.title + '"class="featured_image_small_popup">\n';
                    }
                popupContent += '<div class="popup-holder">';
                popupContent += '<div class="small-card-title">'+ feature.properties.title;
                popupContent += '</div><p></p>';
                popupContent += '<div class="small-card-neighborhood">' + feature.properties.neighborhood;
                popupContent += '</div><p></p></div> </div>';
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
                    title: record.title || '',
                    website: record.website || '',
                    neighborhood: record.neighborhood || '',
                    address: record.address || '',
                    featured_image: record.featured_image || '',
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
}
// check to see if a string is a url
function isURL(str) {
    const urlPattern = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;
    return urlPattern.test(str);
}

// reduce text and add a signifier that there is more in the record
function truncateText(text, maxLength) {
    if (typeof text === 'string' && text.length > maxLength) {
        return text.slice(0, maxLength) + ' ...[more]';
    }
    return text;
}

// check to see if a file is an image
function isImageFile(fileName) {
    // Add more image file extensions as needed
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg'];
    const fileExtension = fileName.substr(fileName.lastIndexOf('.')).toLowerCase();
    return imageExtensions.includes(fileExtension);
}

// add 1 to a header; so h1 becomes h2, h4 becomes h5, etc
function incrementHeader(headerString) {
    // Use a regular expression to find the number in the header string
    const match = headerString.match(/\d+/);

    if (match) {
        // Extract the number and increment it
        const currentNumber = parseInt(match[0]);
        const incrementedNumber = currentNumber + 1;

        // Replace the number in the header string and return the updated string
        return headerString.replace(/\d+/, incrementedNumber);
    } else {
        // If no number was found, return the original string
        return headerString;
    }
}

// Function to parse markdown content and extract data
function parseMarkdownToJSON(mdContent, fileId) {
    const lines = mdContent.split('\n');
    let jsonOutput = {};
    let textHolder = '';
    let levelArray = [];
    let arrayHolder = [];
    let convertToNumner = false;

    for (const line of lines) {
        //first, is the line a header?
        const headingMatch = line.match(/^(#+)\s+(.*?)\s*$/);

        if (headingMatch) {
            // determine the level of the header and the text
            const headingLevel = headingMatch[1].length;
            const headingText = headingMatch[2].trim();
            if (headingText.toLowerCase() == 'latitude' || headingText.toLowerCase() == 'longitude') {
                convertToNumner = true; // Parse latitude and longitude as numbers
            } else {
                convertToNumner = false;

            }

            // if the heading level +1 (as arrays are indexed at 0) is equal to or less than our array length
            // then by definition it is either the same or a higher heading; therefore it needs its own array to be stiched into
            // our final json object
            if ((headingLevel + 1) <= levelArray.length) {
                //first push any accumulated text to the final part of the array
                levelArray.push(textHolder);
                //filter out the missing elements
                arrayHolder.push(levelArray.filter(item => item));
                //slice off and change the array
                levelArray = levelArray.slice(0, headingLevel);
            }

            //push the text of the heading into the appropriate part of the array
            // so a ## (h2) goes to levelArray[2]
            levelArray[headingLevel] = headingText;
            //clean up objects
            textHolder = '';
        }
        // in our scheme, if a line is not a header than it is content
        // we can have multiple lines of content!
        else {
            trimmedLine = line.trim();
            if (convertToNumner == true) {
                trimmedLine = parseFloat(line); // Parse latitude and longitude as numbers
            }
            // Add the content under the current key
            // if there is something in the text, then we actually do want a newline...just before the insertion so we do not have any trailing ones
            if (textHolder != '' && convertToNumner == false) {
                textHolder = textHolder + '\n' + trimmedLine

            } else {
                textHolder = textHolder + trimmedLine;
            }
            convertToNumner = false;
        }
    }
    //we are done - time to push the last one out
    //first push any accumulated text to the final part of the array
    levelArray.push(textHolder);
    //filter out the missing elements
    arrayHolder.push(levelArray.filter(item => item));

    jsonOutput = createNestedObject(arrayHolder);
    jsonOutput.id = fileId;
    if (jsonOutput.latitude) {
        jsonOutput.latitude = parseFloat(jsonOutput.latitude)

    }
    if (jsonOutput.longitude) {
        jsonOutput.longitude = parseFloat(jsonOutput.longitude)

    }
    //console.log(jsonOutput)
    return jsonOutput;
}

function createNestedObject(arrays) {
    const jsonObject = {};

    for (const array of arrays) {
        let currentObject = jsonObject;

        for (let i = 0; i < array.length - 1; i++) {
            const key = array[i].toLowerCase().replace(/ /g, '_');

            if (!currentObject[key]) {
                currentObject[key] = {};
            }

            if (i === array.length - 2) {
                const value = array[i + 1].trim(); // Trim any leading/trailing whitespace
                currentObject[key] = value;
            }

            currentObject = currentObject[key];
        }
    }

    return jsonObject;
}

function jsonToHtmlTable(jsonData) {
    const data = jsonData;
    // Extract keys and values from the JSON
    const keys = Object.keys(data);
    const values = Object.values(data);

    // Create the table header row
    let tableHtml = '<table><tr>';
    for (const key of keys) {
        tableHtml += `<th>${key}</th>`;
    }
    tableHtml += '</tr>';

    // Calculate the number of rows
    const rowCount = values[0].split('\n').filter(item => item.trim() !== '').length;

    // Create table rows
    for (let i = 0; i < rowCount; i++) {
        tableHtml += '<tr>';
        for (const value of values) {
            const rows = value.split('\n');
            const rowData = rows[i] ? rows[i].trim() : '';
            tableHtml += `<td>${rowData}</td>`;
        }
        tableHtml += '</tr>';
    }

    tableHtml += '</table>';
    return tableHtml;
}

function embedMedia(link, linkname) {
    // Define an array of supported audio and video file extensions
    const audioExtensions = ['mp3', 'ogg', 'wav', 'aac'];
    const videoExtensions = ['mp4', 'webm', 'ogv'];

    // Extract the file extension from the link
    const fileExtension = link.split('.').pop().toLowerCase();

    // Initialize an HTML string variable
    let html = '';

    // Check if the link points to an audio file
    if (audioExtensions.includes(fileExtension)) {
        html = `<audio controls src="${link}"></audio>`;
    }
    // Check if the link points to a video file
    else if (videoExtensions.includes(fileExtension)) {
        html = `<video controls src="${link}"></video>`;
    }
    // If the link is not an audio or video file, return the original link as a clickable anchor
    else {
        html = `<a href="${link}">${linkname || link}</a>`;
    }

    return html;
}

function clearTextContent(element) {
    // Loop through each child node of the element
    $(element).contents().each(function() {
        if (this.nodeType === Node.TEXT_NODE) {
            // Clear the text content of text nodes
            this.textContent = '';
        } else if (this.nodeType === Node.ELEMENT_NODE) {
            // Recursively clear text content of child elements
            clearTextContent(this);
        }
    });
}

function isYouTubeLink(link) {
    // Regular expression to match YouTube URLs
    var youtubeRegex = /(?:https?:\/\/)?(?:www\.)?youtu\.?be(?:\.com)?\/(?:watch\?v=)?([^\#\&\?\n]+)/;

    // Use the regular expression to test if the link matches
    return youtubeRegex.test(link);
}

function getYouTubeEmbedCode(youtubeUrl) {
    // Regular expression to match YouTube URLs
    var youtubeRegex = /(?:https?:\/\/(?:www\.)?youtube\.com\/(?:embed\/|watch\?v=|v\/|ytscreeningroom\?v=|youtu\.be\/|user\/\S+|embed\?(?:list=\S+|v=\S+))|^(?:(?!www\.|http:\/\/|https:\/\/|\/\/).)*?(?:youtu\.be\/|v\/|embed\/|watch\?v=|youtu\.be\/|user\/\S+|embed\?(?:list=\S+|v=\S+)))([^\#\&\?\n]+)/;

    // Use the regular expression to match the video ID
    var match = youtubeUrl.match(youtubeRegex);

    if (match && match[1]) {
        // Extracted video ID
        var videoId = match[1];

        // Generate the embed code
        var embedCode = '<iframe width="560" height="315" src="https://www.youtube.com/embed/' + videoId + '" frameborder="0" allowfullscreen></iframe>';

        return embedCode;
    } else {
        // Invalid YouTube URL
        return null;
    }
}

function splitLineWithColon(line) {
    // Regular expression to match a URL followed by a colon and optional space
    var regex = /(https?:\/\/[^:]+):\s*(.+)/;

    // Use regex to match and capture URL and text
    var match = line.match(regex);

    // Check if a match was found
    if (match) {
        // Extract the captured URL and text
        var url = match[1];
        var textAfterColon = match[2];

        return [url, textAfterColon];
    } else {
        // If there's no match, return the original line
        return [line];
    }
}

function jsonToHtml(jsonObj, indent = 0) {
    let html = '';

    if (typeof jsonObj === 'object') {
        if (Array.isArray(jsonObj)) {
            // Handle arrays
            html += '<ul>';
            for (const item of jsonObj) {
                html += '<li>' + jsonToHtml(item, indent + 1) + '</li>';
            }
            html += '</ul>';
        } else {
            // Handle objects
            html += '<ul>';
            for (const key in jsonObj) {
                if (jsonObj.hasOwnProperty(key)) {
                    // Modify this line to format the key and value on the same line
                    html += '<li><strong>' + key + ':</strong> ' + jsonToHtml(jsonObj[key], 0) + '</li>';
                }
            }
            html += '</ul>';
        }
    } else {
        // Handle text content
        html += jsonObj;
    }

    return indent === 0 ? html : '<div style="margin-left: ' + (indent * 20) + 'px;">' + html + '</div>';
}


function generateMediaHTML(input, html) {
    if (typeof input === 'object') {
        // If the input is an object, process it as JSON
        for (const key in input) {
            if (input.hasOwnProperty(key)) {
                const value = input[key];
                //html += `<h3>${key}</h3>`;
                html = generateMediaHTML(value, html);
            }
        }
    } else if (typeof input === 'string') {
        // If the value is a string, split it by new lines and add headers
        const lines = input.split('\n');
        let imageHolder = [];
        let mediaHolder = [];
        let youTubeHolder = [];

        for (const line of lines) 
        {
            if (typeof line === 'string') {
                if (line.includes(':')) {
                    fullMediaLine = mediaPrefix + line;
                    urlHolder = splitLineWithColon(fullMediaLine);
                    mediaLink = urlHolder[0];
                    mediaName = urlHolder[1];

                    if (isURL(mediaLink)) {
                        if (isImageFile(mediaLink)) {
                            let transformedLine = '<div class="modal_grid"><a href="' + mediaLink + '">';
                            transformedLine += '<img src="'+ mediaLink +'" alt="' + mediaName +'" class="featured_image_small"/>';
                            transformedLine += '</a></div>';
//                            transformedLine += '<div class="overlay">'+ mediaName +'</div></a></div>';
                            imageHolder.push(transformedLine);
                                    } 
                        else if (isYouTubeLink(mediaLink)) {
                            var youtubeMedia = '<div class="modal_grid">'
                            youtubeMedia += getYouTubeEmbedCode(mediaLink);
                            youtubeMedia += '</div>';
                            youTubeHolder.push(youtubeMedia);

                        } 
                        else {
                            var embeddedMedia = '<div class="modal_grid">'
                            embeddedMedia += embedMedia(mediaLink, mediaName);
                            youtubeMedia += '</div>';
                            mediaHolder.push(embeddedMedia);
                        }
                    }
                }
            }                    
        }
        if (youTubeHolder.length > 0) {
            html += '<div class="modal_image_grid">';
            for (let i = 0; i < youTubeHolder.length; i++) {
                html += youTubeHolder[i];
            }
            html += '</div>';
            html += '<hr />';

        }

        if (mediaHolder.length > 0) {
            html += '<div class="modal_image_grid">';
            for (let i = 0; i < mediaHolder.length; i++) {
                html += mediaHolder[i];
            }
            html += '</div>';
            html += '<hr />';
        }

        if (imageHolder.length > 0) {
            html += '<div class="modal_image_grid">';
            for (let i = 0; i < imageHolder.length; i++) {
                html += imageHolder[i];
            }
            html += '</div>';
        }
    }
    return html;
}

function generateHTML(jsonObj, linkPrefix, jsonFieldsDisplay, specialFields, cardDisplayType, cardLayoutType) {
    let html = '';
    let title = jsonObj[specialFields.title] || '';
    let fieldTest = '';
    let allHtmlHolder = {};
    let finalHtml = ''; // Declare it once here

    for (const key in jsonFieldsDisplay) {
        fieldTest = null;
        html = '';

        if (jsonObj.hasOwnProperty(key)) {
            fieldTest = jsonObj[key];
        }

        if (String(fieldTest).length > 2) {
            const fieldInfo = jsonFieldsDisplay[key];

            if (specialFields.featured_image && specialFields.featured_image.includes(key)) {
                if (jsonObj.hasOwnProperty(key)) {
                    const imageUrl = `${linkPrefix}${jsonObj[specialFields.featured_image]}`;
                    html = `<div class="${fieldInfo.field_class}">`;
                    html += `<img src="${imageUrl}" alt="Image of ${title}" class="featured_image">\n`;

                    if (fieldInfo.field_overlay == true) {
                        html += `<div class="overlay">${title}</div>`;
                    }
                    html += '</div>'

                    var fieldName = fieldInfo.field_holder;

                    if (!allHtmlHolder[fieldName]) {
                        allHtmlHolder[fieldName] = [];
                    }
                    allHtmlHolder[fieldName].push(html);
                }
            }
            // Special handling for 'table' section
            else if (specialFields.table && specialFields.table.includes(key)) {
                if (jsonObj.hasOwnProperty(key)) {
                    html += `<${fieldInfo.field_header}>${fieldInfo.field_display_name}:</${fieldInfo.field_header}>\n`;
                    const tableData = jsonObj[key];
                    html += jsonToHtmlTable(tableData);
                }
                var fieldName = fieldInfo.field_holder;
                if (!allHtmlHolder[fieldName]) {
                    allHtmlHolder[fieldName] = [];
                }
                allHtmlHolder[fieldName].push(html);

                delete jsonObj[specialFields.table];
            } 
            else if (specialFields.media && specialFields.media.includes(key)) {
                if (jsonObj.hasOwnProperty(key)) {
                    html += `<${fieldInfo.field_header}>${fieldInfo.field_display_name}:</${fieldInfo.field_header}>\n`;
                    html += generateMediaHTML(jsonObj[key], html);

                    var fieldName = fieldInfo.field_holder;
                    if (!allHtmlHolder[fieldName]) {
                        allHtmlHolder[fieldName] = [];
                    }
                    allHtmlHolder[fieldName].push(html);

                }
               

               // delete jsonObj[key];
            } 
            else {
                if (jsonObj.hasOwnProperty(key)) {
                    if (jsonObj[key] != null || jsonObj[key] !='') {
                        var htmlInsert = jsonToHtml(jsonObj[key]);
                        if (fieldInfo.field_truncate == 'y') {
                            var htmlInsert = truncateText(htmlInsert, 70);
                        }
                        html += '<div class="' + fieldInfo.field_class + '">';
                        if (fieldInfo.field_title_display == 'yes') {
                            html += '<' + fieldInfo.field_header + '>' + fieldInfo.field_display_name + ': </' + fieldInfo.field_header + '>\n';
                        }
                        html += htmlInsert;
                        html += '</div>'
                        var fieldName = fieldInfo.field_holder;
                        if (!allHtmlHolder[fieldName]) {
                            allHtmlHolder[fieldName] = [];
                        }
                        allHtmlHolder[fieldName].push(html);
                    }
                }
            }
        }
    }

    if (Object.keys(allHtmlHolder).length != 0) {
        if (cardDisplayType == 'smallCard') {
            finalHtml = '<div class="small-card-container">';
            if (cardLayoutType == "two-column") {
                if(allHtmlHolder['leftHtmlContent']){
                    finalHtml += '<div class="small-card-left">'
                    finalHtml += fillContentHTML(allHtmlHolder['leftHtmlContent'])
                    finalHtml += '</div>'
                } 
                if(allHtmlHolder['rightHtmlContent']){
                    finalHtml += '<div class="small-card-right">'
                    finalHtml += fillContentHTML(allHtmlHolder['rightHtmlContent'])
                    finalHtml += '</div>'
                }
                finalHtml += '</div>';

                if(allHtmlHolder['bottomHtmlContent']){
                    finalHtml += '<div class="small-card-bottom">'
                    finalHtml += fillContentHTML(allHtmlHolder['bottomHtmlContent'])
                    finalHtml += '</div>'
                } 
            }
            else {
                if (cardLayoutType == 'grid') {
                    finalHtml = '<div class="small-card-container">';


                finalHtml += fillContentHTML(allHtmlHolder['grid'])
                finalHtml += '</div>';

                }
            }
            
        } 
        else if (cardDisplayType == 'modal')
         {
            if (cardLayoutType == "two-column") {
                finalHtml += '<div class="modal-content-container">'
                if(allHtmlHolder['leftHtmlContent']){
                    finalHtml += '<div class="modal-left">'
                    finalHtml += fillContentHTML(allHtmlHolder['leftHtmlContent'])
                    finalHtml += '</div>'
                } 
                if(allHtmlHolder['rightHtmlContent']){
                    finalHtml += '<div class="modal-right">'
                    finalHtml += fillContentHTML(allHtmlHolder['rightHtmlContent'])
                    finalHtml += '</div>'
                    finalHtml += '</div>'
                }
                if(allHtmlHolder['bottomHtmlContent']){
                    finalHtml += '<div class="modal-bottom">'
                    finalHtml += fillContentHTML(allHtmlHolder['bottomHtmlContent'])
                    finalHtml += '</div>'
                } 
            }
            // Handle other cases for cardDisplayType
        }
        return finalHtml;
    }
}



function fillContentHTML(arrayOfHtml)
{
    let contentHtml = '';
    arrayOfHtml.forEach(function(value) {
        // Append each value to the HTML string
        contentHtml += value;
        contentHtml += '<p />'
      });
      
    return contentHtml;
}

// Function to create a new div representing a JSON record
function createRecordDiv(record, recordCLickable) {
    const recordDiv = document.createElement('div');
    recordDiv.classList.add('small-card');
    const recordIdName = 'small-card' + record.id;
    recordDiv.setAttribute('id', recordIdName); // Set the 'id' attribute with the ID
    recordDiv.setAttribute('data-id', record.id); // Set the 'data-id' attribute with the ID

    // Add a click event listener to each div if applicable
    if (recordCLickable == true) {
        recordDiv.addEventListener('click', function() {
            const id = this.getAttribute('data-id'); // Get the 'data-id' attribute value
            showMarkdownModal(id);
        });
    }

    // Append your content here, but make sure to use 'record' properties in a closure as well
    const htmlContent = generateHTML(record, linkPrefix, smallCardDisp, specialFields, 'smallCard', smallCardLayoutType);
    recordDiv.innerHTML = htmlContent;

    return recordDiv;
}

// Function to show the markdown content in a modal-like div
function showMarkdownModal(id) {
    if (markdownModal) {
        clearMarkdownModal();
    }

    markdownModal = document.getElementById('markdownModal');
    const closeButton = markdownModal.querySelector('.modal-close');
    const markdownContent = document.getElementById('modal-content');

    $.ajax({
        url: markdownDirectoryUrl + `${id}.md`,
        dataType: 'text',
        success: function(mdContent) {
            var jsonOutput = parseMarkdownToJSON(mdContent, id);
            displayClassType = '';
            jsonOutputHtml = generateHTML(jsonOutput, linkPrefix, modalCardDisplay, specialFields, 'modal', modalCardLayoutType)
            //generateHTML(jsonOutput, linkPrefix, modalCardDisplay, specialFields, null, true);

           markdownContent.innerHTML = jsonOutputHtml;
            markdownModal.style.display = 'block';
        },
        error: function(xhr, status, error) {
            console.error(`Error fetching markdown file: ${error}`);
        }
    });

    closeButton.addEventListener('click', function() {
        clearMarkdownModal();
    });
}



// Function to clear the markdown modal content
function clearMarkdownModal() {
    // hide the modal
    if (markdownModal) {
        markdownModal.style.display = 'none';
        markdownModal = null;
    }
    //clean out the text but leave the div structure
    clearTextContent('#modal-content');
    // delete any and all divs we added as content
    $('#modal-left-content').empty();
    $('#modal-right-content').empty();
    $('#modal_featured_image').empty();



}

// Function to update the left column div with record divs
function updateRecordHolderDiv() {
    const dataTable = $('#dataTable').DataTable();
    const data = dataTable.rows({
        search: 'applied'
    }).data();
    // small-card-div is set for EVERY instance of our code base, so this can be hardcoded
    const smallCardHolderDiv = document.querySelector('#small-card-div');
    smallCardHolderDiv.innerHTML = ''; // Clear existing content

    // Check if the DataTable is empty
    if (data.length === 0) {
        const noRecordsDiv = document.createElement('div');
        noRecordsDiv.classList.add('no-records-message');
        noRecordsDiv.textContent = 'No records found.';
        smallCardHolderDiv.appendChild(noRecordsDiv);
    } else {
        // Create a div for each data row and append it to the left column div
        data.each(record => {
            const recordDiv = createRecordDiv(record, recordCLickable);
            smallCardHolderDiv.appendChild(recordDiv);
        });
    }
}

function fetchAndDisplayData(markdownDirectoryUrl) {
    $.ajax({
        url: markdownDirectoryUrl,
        success: function(data) {
            const markdownFiles = $(data).find('a[href$=".md"]');

            jsonRecords = [];
            filteredRecords = [];

            function processMarkdownFile(index) {
                if (index >= markdownFiles.length) {
                    displayDataTable(jsonRecords);
                    if (mapPage == true) {

                        updateMap();
                    }

                    updateRecordHolderDiv();

                    return;
                }

                const file = markdownFiles[index].getAttribute('href');
                const fileId = file.replace('.md', '');
                $.ajax({
                    url: markdownDirectoryUrl + file,
                    dataType: 'text',
                    success: function(mdContent) {
                        const parsedJSON = parseMarkdownToJSON(mdContent, fileId);
                        jsonRecords.push(parsedJSON);
                        processMarkdownFile(index + 1);
                    },
                    error: function(xhr, status, error) {
                        console.error(`Error fetching file: ${file} - ${error}`);
                        processMarkdownFile(index + 1);
                    }
                });
            }

            processMarkdownFile(0);
        },
        error: function(xhr, status, error) {
            console.error(`Error fetching directory: ${error}`);
        }
    });
}


function displayDataTable(records) {
    jsonRecords = records; // Store original jsonRecords in the global variable
    filteredRecords = records; // Initialize filteredRecords with all records initially

    const dataTableData = records.map(record => {
        const data = {};
        for (const key in record) {
            data[key] = record[key] || '';
        }
        return data;
    });

    const dataTable = $('#dataTable').DataTable({
        data: dataTableData,
        columns: columnDefs,
    });

    // Event listener for DataTable draw event to update the left column div
    dataTable.on('draw.dt', function() {
        updateFilteredRecords();
        updateRecordHolderDiv();
        if (mapPage == true) {

            updateMap();
        }

    });

    // Event listener for DataTable search event to update the left column div
    dataTable.on('search.dt', function() {
        updateFilteredRecords();
        updateRecordHolderDiv();
        if (mapPage == true) {

            updateMap();
        }

    });

    dataTable.on('')

    $('#toggleButton_advo').on('click', function () {
        // Find the index of the "Filter Categories" column
        var columnIndex = -1;
        searchValue = 'Advocacy Organization'
        dataTable.columns().every(function (index) {
            if (dataTable.column(index).header().textContent.trim() === "Filter Categories") {
                columnIndex = index;
                return false; // Exit the loop once found
            }
        });
    
        if (columnIndex !== -1) {
            // Use the DataTables API to filter the column by index
            dataTable.column(columnIndex).search(searchValue).draw();

            filteredRecords = jsonRecords.filter(record => {
                return (
                    (record.map_category || '').toLowerCase().includes(searchValue.toLowerCase())
                );
            });

            updateRecordHolderDiv();
            if (mapPage == true) {
    
                updateMap();
            }
        }
    });


    $('#toggleButton_food').on('click', function () {
        // Find the index of the "Filter Categories" column
        var columnIndex = -1;
        searchValue = 'Food'
        dataTable.columns().every(function (index) {
            if (dataTable.column(index).header().textContent.trim() === "Filter Categories") {
                columnIndex = index;
                return false; // Exit the loop once found
            }
        });
    
        if (columnIndex !== -1) {
            // Use the DataTables API to filter the column by index
            dataTable.column(columnIndex).search(searchValue).draw();

            filteredRecords = jsonRecords.filter(record => {
                return (
                    (record.map_category || '').toLowerCase().includes(searchValue.toLowerCase())
                );
            });

            updateRecordHolderDiv();
            if (mapPage == true) {
    
                updateMap();
            }
        }
    });

    $('#toggleButton_interfaith').on('click', function () {
        // Find the index of the "Filter Categories" column
        var columnIndex = -1;
        searchValue = 'Interfaith'
        dataTable.columns().every(function (index) {
            if (dataTable.column(index).header().textContent.trim() === "Filter Categories") {
                columnIndex = index;
                return false; // Exit the loop once found
            }
        });
    
        if (columnIndex !== -1) {
            // Use the DataTables API to filter the column by index
            dataTable.column(columnIndex).search(searchValue).draw();

            filteredRecords = jsonRecords.filter(record => {
                return (
                    (record.map_category || '').toLowerCase().includes(searchValue.toLowerCase())
                );
            });

            updateRecordHolderDiv();
            if (mapPage == true) {
    
                updateMap();
            }
        }
    });

    $('#toggleButton_mosque').on('click', function () {
        // Find the index of the "Filter Categories" column
        var columnIndex = -1;
        searchValue = 'Mosque'
        dataTable.columns().every(function (index) {
            if (dataTable.column(index).header().textContent.trim() === "Filter Categories") {
                columnIndex = index;
                return false; // Exit the loop once found
            }
        });
    
        if (columnIndex !== -1) {
            // Use the DataTables API to filter the column by index
            dataTable.column(columnIndex).search(searchValue).draw();

            filteredRecords = jsonRecords.filter(record => {
                return (
                    (record.map_category || '').toLowerCase().includes(searchValue.toLowerCase())
                );
            });

            updateRecordHolderDiv();
            if (mapPage == true) {
    
                updateMap();
            }
        }
    });

    $('#toggleButton_clinic').on('click', function () {
        // Find the index of the "Filter Categories" column
        var columnIndex = -1;
        searchValue = 'Clinic'
        dataTable.columns().every(function (index) {
            if (dataTable.column(index).header().textContent.trim() === "Filter Categories") {
                columnIndex = index;
                return false; // Exit the loop once found
            }
        });
    
        if (columnIndex !== -1) {
            // Use the DataTables API to filter the column by index
            dataTable.column(columnIndex).search(searchValue).draw();

            filteredRecords = jsonRecords.filter(record => {
                return (
                    (record.map_category || '').toLowerCase().includes(searchValue.toLowerCase())
                );
            });

            updateRecordHolderDiv();
            if (mapPage == true) {
    
                updateMap();
            }
        }
    });

    $('#toggleButton_pubart').on('click', function () {
        // Find the index of the "Filter Categories" column
        var columnIndex = -1;
        searchValue = 'Public Art'
        dataTable.columns().every(function (index) {
            if (dataTable.column(index).header().textContent.trim() === "Filter Categories") {
                columnIndex = index;
                return false; // Exit the loop once found
            }
        });
    
        if (columnIndex !== -1) {
            // Use the DataTables API to filter the column by index
            dataTable.column(columnIndex).search(searchValue).draw();

            filteredRecords = jsonRecords.filter(record => {
                return (
                    (record.map_category || '').toLowerCase().includes(searchValue.toLowerCase())
                );
            });

            updateRecordHolderDiv();
            if (mapPage == true) {
    
                updateMap();
            }
        }
    });

    $('#toggleButton-school').on('click', function () {
        // Find the index of the "Filter Categories" column
        var columnIndex = -1;
        searchValue = 'School'
        dataTable.columns().every(function (index) {
            if (dataTable.column(index).header().textContent.trim() === "Filter Categories") {
                columnIndex = index;
                return false; // Exit the loop once found
            }
        });
    
        if (columnIndex !== -1) {
            // Use the DataTables API to filter the column by index
            dataTable.column(columnIndex).search(searchValue).draw();

            filteredRecords = jsonRecords.filter(record => {
                return (
                    (record.map_category || '').toLowerCase().includes(searchValue.toLowerCase())
                );
            });

            updateRecordHolderDiv();
            if (mapPage == true) {
    
                updateMap();
            }
        }
    });
    

    if (mapPage == true) {

        if (geojsonLayer) {
            geojsonLayer.clearLayers();
        }

        // Create a GeoJSON feature collection from the records
        const geojsonFeatures = records.map(record => {
            if (typeof record.latitude === 'number' && typeof record.longitude === 'number') {
                return {
                    type: 'Feature',
                    properties: {
                        title: record.title || '',
                        link: record.website || '',
                        neighborhood: record.neighborhood || '',
                        address: record.address || '',
                        featured_image: record.featured_image || '',
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
            pointToLayer: function(feature, latlng) {
                return L.marker(latlng, {
                    icon: customIcon
                });
            },
            onEachFeature: function(feature, layer) {
                // Create a popup for each feature
                let popupContent = '';
                let imageUrl ='';

                if (feature.properties.featured_image){
                    imageUrl = linkPrefix + feature.properties.featured_image;
                }
                popupContent += '<div class="popup-card-container">';
                if (imageUrl !=''){
                    popupContent += '<img src="'+ imageUrl + '" alt="Image of' +  feature.properties.title + '"class="featured_image_small_popup">\n';
                    }
                popupContent += '<div class="popup-holder">';
                popupContent += '<div class="small-card-title">'+ feature.properties.title;
                popupContent += '</div><p></p>';
                popupContent += '<div class="small-card-neighborhood">' + feature.properties.neighborhood;
                popupContent += '</div><p></p></div> </div>';

                layer.bindPopup(popupContent);
            }
        });

        // Add the GeoJSON layer with custom markers to the map
        if (map && geojsonLayer) {
            geojsonLayer.addTo(map);
        } else {
            console.error('Map or geojsonLayer is not defined.');
        }
    }


    $('#jsonTable').show();
    updateRecordHolderDiv(); // Call updateRecordHolderDiv() to update the left side divs
}

// Function to update the filteredRecords array based on DataTable search
function updateFilteredRecords() {
    const dataTable = $('#dataTable').DataTable();
    const searchValue = dataTable.search();

    if (searchValue) {
        filteredRecords = jsonRecords.filter(record => {
            return (
                (record.title || '').toLowerCase().includes(searchValue.toLowerCase()) ||
                (record.website || '').toLowerCase().includes(searchValue.toLowerCase()) ||
                (record.neighborhood || '').toLowerCase().includes(searchValue.toLowerCase()) ||
                //        (record.address || '').toLowerCase().includes(searchValue.toLowerCase()) ||
                (record.featured_image || '').toLowerCase().includes(searchValue.toLowerCase()) ||
                (record.description_blurb || '').toLowerCase().includes(searchValue.toLowerCase())
            );
        });
    } else {
        filteredRecords = jsonRecords;
    }

    updateRecordHolderDiv(); // Update the left column div with the filtered data
}

function closeDataTableWindow() {
    $('#jsonTable').hide();
}

// map functionality

if (mapPage == true) {

    function setupLeafletMap() {
        // Set the initial view of the map to Los Angeles
        map = L.map('map').setView([34.0522, -118.2437], 10);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);


        // Event listener for clicking the popup links
        map.on('popupopen', function(e) {
            const popupLink = e.popup._contentNode.querySelector('.popup-link');
            if (popupLink) {
                popupLink.addEventListener('click', function(event) {
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


}

// Call fetchAndDisplayData() and setupLeafletMap() after the page has loaded
$(document).ready(function() {
    fetchAndDisplayData(markdownDirectoryUrl);
    if (mapPage == true) {
        setupLeafletMap();

    }

});

function toggleDataTableWindow() {
    const dataTableWindow = document.getElementById('jsonTable');
    dataTableWindow.classList.toggle('hidden');

}