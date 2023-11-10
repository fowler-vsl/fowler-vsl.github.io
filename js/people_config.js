const vslPageConfiguration = {
    "linkPrefix": "http://localhost/fowler_landscapes/data/people_media/",
    "mediaPrefix": "http://localhost/fowler_landscapes/data/vsl_item_media/1_All_Media/",
    "markdownDirectoryUrl": "data/people_md/",
    "divRecordClass":"_people",
    "recordCLickable": true,
    "datatablePage": true,
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
            "field_holder":"rightHtmlContent",
            "field_class":"modal_featured_image",
            "field_overlay": false
        },
        "about": {
            "field_display_name": "Biography",
            "field_title_display": "yes",
            "field_header": "h2",
            "field_truncate": "n",
            "field_holder":"leftHtmlContent",
            "field_class":"modal-left-content",
            "field_overlay": false
        },
        "demographic_data": {
            "field_display_name": "Deomgraphic Data",
            "field_title_display": "yes",
            "field_header": "h2",
            "field_truncate": "n",
            "field_holder":"rightHtmlContent",
            "field_class":"modal-right-content",
            "field_overlay": false
        },
        "index": {
            "field_display_name": "Index",
            "field_title_display": "yes",
            "field_header": "h2",
            "field_truncate": "n",
            "field_holder":"leftHtmlContent",
            "field_class":"modal-left-content",
            "field_overlay": false
        },
        "related_materials": {
            "field_display_name": "Related Materials",
            "field_title_display": "yes",
            "field_header": "h1",
            "field_truncate": "n",
            "field_holder":"bottomHtmlContent",
            "field_class":"modal-left-content",
            "field_overlay": false
        },
        "associated_map_locations_if_applicable": {
            "field_display_name": "Associated Map Locations",
            "field_title_display": "yes",
            "field_header": "h2",
            "field_truncate": "n",
            "field_holder":"bottomHtmlContent",
            "field_class":"modal-left-content",
            "field_overlay": false
        }
     
    },
    "specialFields":{
        "media": ["related_materials"],
        "featured_image": ["featured_image"],
        "title": ["name"],
        "table": ["index"]
    }
};


//for the datatables
var columnDefs = [
    { 
        "title": "Name", 
        "data": "name",
        "defaultContent" : ''
    },
    { 
        "title": "About", 
        "data": "about",
        "defaultContent" : '',
        "render": function (data, type, row) {
        // Limit the character count for the "Website" column
        if (type === 'display' && data.length > 20) {
            return data.substr(0, 200) + '...';
        }
        return data;
    } }
];
