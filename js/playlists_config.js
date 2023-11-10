const vslPageConfiguration = {
    "linkPrefix": "http://localhost/fowler_landscapes/data/musicplaylist_images/",
    "mediaPrefix": '',
    "markdownDirectoryUrl": "data/musicplaylist_md/",
    "divRecordClass":"_people",
    "recordCLickable": true,
    "datatablePage": false,
    "mapPage": false,
    "smallCardLayoutType": "grid",
    "modalCardLayoutType": "two-column",
    "smallCardDisp":
    {
        "featured_image": {
            "field_display_name": "Featured Image",
            "field_title_display": "no",
            "field_header": "",
            "field_truncate": "n",
            "field_holder":"grid",
            "field_class":"featured_image_small",
            "field_overlay":true

        }
    },
    "modalCardDisplay":
    {
        "name": {
            "field_display_name": "Name",
            "field_title_display": "no",
            "field_header": "h1",
            "field_truncate": "n",
            "field_holder":"leftHtmlContent",
            "field_class":"modal-left-content",
            "field_overlay":true
        },
        "featured_image": {
            "field_display_name": "Featured Image",
            "field_title_display": "no",
            "field_header": "",
            "field_truncate": "n",
            "field_holder":"rightHtmlContente",
            "field_class":"featured_image_small",
            "field_overlay": false
        },
        "media": {
            "field_display_name": "Media",
            "field_title_display": "yes",
            "field_header": "h2",
            "field_truncate": "n",
            "field_holder":"leftHtmlContent",
            "field_class":"modal-left-content",
            "field_overlay": false
        },
        "media_credits": {
            "field_display_name": "Media Credits",
            "field_title_display": "yes",
            "field_header": "h2",
            "field_truncate": "n",
            "field_holder":"leftHtmlContent",
            "field_class":"modal-left-content",
            "field_overlay": false
        }
    },
    "specialFields":{
        "media": "media",
        "featured_image": "featured_image",
        "title": "name"    
    }
};


var columnDefs = [
    { 
        "title": "name", 
        "data": "name" 
    }
];