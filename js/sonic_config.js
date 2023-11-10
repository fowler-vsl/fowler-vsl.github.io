const vslPageConfiguration = {
    "linkPrefix": "http://localhost/fowler_landscapes/data/vsl_team_media/",
    "mediaPrefix": "http://localhost/fowler_landscapes/data/vsl_item_media/1_All_Media/",
    "markdownDirectoryUrl": "data/team_md/",
    "divRecordClass":"_people",
    "recordCLickable": false,
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
            "field_holder":"modal-left-content",
            "field_class":"modal-left-content",
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
        },
        "about": {
            "field_display_name": "Biography",
            "field_title_display": "yes",
            "field_header": "h2",
            "field_truncate": "n",
            "field_holder":"modal-left-content",
            "field_class":"modal-left-content",
            "field_overlay": false
        },
        "demographic_data": {
            "field_display_name": "Deomgraphic Data",
            "field_title_display": "yes",
            "field_header": "h2",
            "field_truncate": "n",
            "field_holder":"modal-right-content",
            "field_class":"modal-right-content",
            "field_overlay": false
        },
        "index": {
            "field_display_name": "Demographics",
            "field_title_display": "yes",
            "field_header": "h2",
            "field_truncate": "n",
            "field_holder":"modal-left-content",
            "field_class":"modal-left-content",
            "field_overlay": false
        },
        "related_materials": {
            "field_display_name": "Related Materials",
            "field_title_display": "yes",
            "field_header": "h1",
            "field_truncate": "n",
            "field_holder":"modal-left-content",
            "field_class":"modal-left-content",
            "field_overlay": false
        },
        "associated_map_locations_if_applicable": {
            "field_display_name": "Associated Map Locations",
            "field_title_display": "yes",
            "field_header": "h2",
            "field_truncate": "n",
            "field_holder":"modal-left-content",
            "field_class":"modal-left-content",
            "field_overlay": false
        }
     
    },
    "specialFields":{
        "media": "related_materials",
        "featured_image": "featured_image",
        "title": "name",
        "table": "index"
    }
};


var columnDefs = [
    { 
        "title": "featured_image", 
        "data": "featured_image" 
    }
];