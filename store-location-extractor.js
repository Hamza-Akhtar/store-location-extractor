

var request = require('request');
var finalStoreArray = {};  // stores all results after program done running
var storeIDArray = {}; // used to prevent duplicate stores.
var output = {};

// function sends request to google maps api
function sendRequest(lat, long, radius, keyObject, key) {
    var url = 'https://maps.googleapis.com/maps/api/place/textsearch/json?query=' + keyObject.keyword + '&location=' + lat + ',' + long + '&radius=' + radius
        + '&region=CA&key=APIKEYHERE'
    request(url,
        function (error, response, body) {
            if (body) {
                var results = (JSON.parse(body)).results;
                results.forEach(result => {
                    if (result &&
                        (result.name.toLowerCase().includes(keyObject.keyword.toLowerCase())
                            || result.name.toLowerCase().includes(key.toLowerCase())
                            || result.name.toLowerCase().includes(keyObject.brand.toLowerCase())) &&
                        !(result.formatted_address.toLowerCase().endsWith('usa') || 
                            result.formatted_address.toLowerCase().endsWith('united states'))) {

                        if (!storeIDArray[key] || !storeIDArray[key].includes(result.id)) {
                            var duplicate = checkForDuplicates(result, key);
                            if (!storeIDArray[key]) storeIDArray[key] = [];
                            storeIDArray[key].push(result.id);

                            if (!duplicate) {
                                if (!finalStoreArray[key]) finalStoreArray[key] = [];
                                finalStoreArray[key].push(result);
                                if (!output[key]) output[key] = [];
                                output[key].push({
                                    lat: result.geometry.location.lat,
                                    lon: result.geometry.location.lng
                                });
                            }
                        }
                    } 
                })
            }
        });
}

// checks for duplicates (stores 1km apart)
function checkForDuplicates(result, key) {
    var duplicate = false;

    if (finalStoreArray[key] && finalStoreArray[key].length > 0) {
        for (var item of finalStoreArray[key]) {
            var dist = getDistanceFromLatLonInKm(result.geometry.location.lat, result.geometry.location.lng, 
                item.geometry.location.lat, item.geometry.location.lng);

            if (dist <= 1) {
                duplicate = true;
                console.log(`found duplicate for ${key}...`);
                break;
            }
        }
    }
    return duplicate;
}

var radius = 50000;
var keywords = {
    'www.companyname.com': {
        brand: `company name`,
        keyword: 'company name',
        }
};

// finds all stores based on cities from cityArray
function findStoresByCity(key, keyObject, cityArray, radius) {
    cityArray.forEach(longLat => {
        sendRequest(longLat[0], longLat[1], radius, keyObject, key);
    });
}


// function gets distance between two lat and long points
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2 - lat1);  // deg2rad below
    var dLon = deg2rad(lon2 - lon1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
        ;
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km
    return d;
}

// converts degrees to rad
function deg2rad(deg) {
    return deg * (Math.PI / 180)
}


// Major cities in Canada
var allMajorCities = [[43.730487, -79.368848],
[45.524499, -73.633670], [51.031519, -114.069072], [45.313605, -75.734597],
[53.543116, -113.489743], [43.601652, -79.638617], [49.866012, -97.150699], [49.252790, -123.112270], [46.826157, -71.232009],
[43.240387, -79.948035], [49.125264, -122.782727], [45.605953, -73.733537], [45.605953, -73.733537], [42.976175, -81.243372],
[43.848570, -79.455755], [48.428829, -123.364899], [42.169476, -82.854887], [43.904158, -78.856735], [45.477512, -75.703305],
[43.425901, -80.471514], [49.238827, -122.965038], [49.089139, -123.080246], [52.144673, -106.650840], [44.367289, -79.692236],
[49.162493, -123.131392], [45.327994, -75.727771], [50.462268, -104.635404], [46.581211, -81.046582], [49.071990, -122.357730],
[48.383264, -71.134960], [43.148956, -79.246122], [46.440128, -66.548967], [48.426619, -89.320839]
];


Object.keys(keywords).forEach(function (key) {
    findStoresByCity(key, keywords[key], allMajorCities, radius);
});

// return results
return finalStoreArray;




