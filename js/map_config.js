const vslPageConfiguration = {
    "linkPrefix": "http://localhost/fowler_landscapes/data/vsl_item_media/1_All_Media/",
    "mediaPrefix": "http://localhost/fowler_landscapes/data/vsl_item_media/1_All_Media/",
    "markdownDirectoryUrl": "data/markdown/",
    "recordCLickable": true,
    "datatablePage": true,
    "mapPage": true,
    "smallCardLayoutType": "two-column",
    "modalCardLayoutType": "two-column",
    "smallCardDisp":
    {    "featured_image": {
        "field_display_name": "Featured Image",
        "field_title_display": "no",
        "field_header": "",
        "field_truncate": "n",
        "field_holder":"leftHtmlContent",
        "field_class":"small-card_featured_image_holder",
        "field_overlay": false
    },
        "title": {
            "field_display_name": "Name",
            "field_title_display": "no",
            "field_header": "h1",
            "field_truncate": "n",
            "field_holder":"leftHtmlContent",
            "field_class":"small-card-title",
            "field_overlay":false
                },
        "neighborhood": {
            "field_display_name": "Featured Image",
            "field_title_display": "no",
            "field_header": "",
            "field_truncate": "n",
            "field_holder":"leftHtmlContent",
            "field_class":"small-card-neighborhood",
            "field_overlay":false

        },
    "map_category": {
        "field_display_name": "Map Category",
        "field_title_display": "no",
        "field_header": "",
        "field_truncate": "n",
        "field_holder":"leftHtmlContent",
        "field_class":"small-card-bottom-text",
        "field_overlay":false

    }

    },
    "modalCardDisplay":
    {
        "title": {
            "field_display_name": "Name",
            "field_title_display": "no",
            "field_header": "h1",
            "field_truncate": "n",
            "field_holder":"leftHtmlContent",
            "field_class":"modal-left-content-header",
            "field_overlay":false
        },
                "website": {
            "field_display_name": "Website",
            "field_title_display": "no",
            "field_header": "h1",
            "field_truncate": "n",
            "field_holder":"leftHtmlContent",
            "field_class":"modal-left-content",
            "field_overlay":false
        },
        "neighborhood": {
            "field_display_name": "Neighborhood",
            "field_title_display": "no",
            "field_header": "",
            "field_truncate": "n",
            "field_holder":"leftHtmlContent",
            "field_class":"modal-left-content",
            "field_overlay":false

        },
        "map_category": {
            "field_display_name": "Map Category",
            "field_title_display": "no",
            "field_header": "",
            "field_truncate": "n",
            "field_holder":"leftHtmlContent",
            "field_class":"small-card-bottom-text",
            "field_overlay":false
    
        },

        "description_blurb": {
            "field_display_name": "About",
            "field_title_display": "yes",
            "field_header": "h2",
            "field_truncate": "n",
            "field_holder":"leftHtmlContent",
            "field_class":"modal-left-content-border-top",
            "field_overlay":false
    
        },
        "important_dates": {
            "field_display_name": "Important Dates",
            "field_title_display": "yes",
            "field_header": "h2",
            "field_truncate": "n",
            "field_holder":"leftHtmlContent",
            "field_class":"modal-left-content",
            "field_overlay":false
    
        },
        "featured_image": {
            "field_display_name": "Featured Image",
            "field_title_display": "no",
            "field_header": "",
            "field_truncate": "n",
            "field_holder":"rightHtmlContent",
            "field_class":"small-card_featured_image_holder",
            "field_overlay": false
        },
    "media": {
        "field_display_name": "Media",
        "field_title_display": "yes",
        "field_header": "h2",
        "field_truncate": "n",
        "field_holder":"rightHtmlContent",
        "field_class":"modal-related_materials",
        "field_overlay": false
    },
    "people": {
        "field_display_name": "People",
        "field_title_display": "yes",
        "field_header": "h2",
        "field_truncate": "n",
        "field_holder":"rightHtmlContent",
        "field_class":"modal-related_oral_histories",
        "field_overlay": false
    }
     
    },
    "popupDisplay":
    {
        "neighborhood": {
            "field_display_name": "Featured Image",
            "field_title_display": "no",
            "field_header": "",
            "field_truncate": "n",
            "field_holder":"small_card_featured_image",
            "field_class":"featured_image_small",
            "field_overlay":false

        },
        "title": {
            "field_display_name": "Name",
            "field_title_display": "no",
            "field_header": "h1",
            "field_truncate": "n",
            "field_holder":"modal-left-content",
            "field_class":"modal-left-content",
            "field_overlay":false
        },
    
    "descriptive_tags": {
        "field_display_name": "Map Categories",
        "field_title_display": "no",
        "field_header": "",
        "field_truncate": "n",
        "field_holder":"small_card_featured_image",
        "field_class":"featured_image_small",
        "field_overlay":false

    },
    "featured_image": {
        "field_display_name": "Featured Image",
        "field_title_display": "no",
        "field_header": "",
        "field_truncate": "n",
        "field_holder":"modal_featured_image",
        "field_class":"modal_featured_image",
        "field_overlay": false
    }

    },
    "specialFields":{
        "media": ["media", "people"],
        "featured_image": ["featured_image"],
        "title": ["title"]
    }
};

//for the datatables
var columnDefs = [
    { 
        "title": "Name", 
        "data": "title",
        "defaultContent" : ''
    },
    { 
        "title": "Website", 
        "data": "website",
        "defaultContent" : '' 
    },
    { 
        "title": "Neighborhood", 
        "data": "neighborhood",
        "defaultContent" : '' 
    },
    { 
        "title": "Filter Categories", 
        "data": "map_category",
        "defaultContent" : '' 
    },
    {
        "title": "Descriptive Tags", 
        "data": "descriptive_tags",
        "defaultContent" : '' 
    },
    { 
        "title": "About", 
        "data": "description_blurb",
        "defaultContent" : '',
        "render": function (data, type, row) {
            // Limit the character count for the "Website" column
            if (type === 'display' && data && data.length > 20) {
                return data.substr(0, 20) + '...';
            }
            return data;
        } 
    }
];



    // Create the custom icon
    const customIcon = L.icon({
        iconUrl: 'img/MapPip.svg', // Location of the marker image file
        iconSize: [25, 25], // Adjust the icon size as needed
        iconAnchor: [16, 32] // Adjust the icon anchor point if needed
      });