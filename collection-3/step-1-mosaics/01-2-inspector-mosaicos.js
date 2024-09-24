/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var mosaicos_sin_cambios = /* color: #d63000 */ee.FeatureCollection(
        [ee.Feature(
            ee.Geometry.Point([-74.48106455160315, -8.312903994684415]),
            {
              "system:index": "0"
            })]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// SCRIPT PARA REVISAR EL ENVIO PERU-COL3

/**
 * parameters to filter the collection
 */
var param = {
    "region_code": 702,
    "country": "PERU",
    "year": 2023,
    // "satellite": 'l9',
    "version": '5' // REVISAR LA TABLA DE ENVIOS
};


/** 
 * collection id
 */
var assetMosaics = 'projects/mapbiomas-raisg/MOSAICOS/mosaics-2'; 
var assetRegions = "projects/mapbiomas-raisg/DATOS_AUXILIARES/VECTORES/PERU/per-clasificacion-mosaicos-5";
var assetGrids = 'projects/mapbiomas-raisg/DATOS_AUXILIARES/VECTORES/grid-world';


var keys = Object.keys(param);

// get collection
var collection = keys
    .reduce(
        function (collection, property) {
            return collection.filter(
                ee.Filter.eq(property, param[property]));
        }, ee.ImageCollection(assetMosaics)
    );

print(collection)

// get region 
var region = ee.FeatureCollection(assetRegions)
    .filter(ee.Filter.eq("id_region", parseInt(param.region_code, 10)));
print(region)
// get grids
var grids = ee.FeatureCollection(assetGrids)
    .filter(ee.Filter.bounds(region));

/**
 * layers
 */
Map.addLayer(region.style({ fillColor: '00000000'}), {}, "Regions");

Map.addLayer(collection.map(function(image){return image.clip(region)}), //.mosaic().clip(region),
    {
        "bands": "swir1_median,nir_median,red_median",
        "gain": "0.08,0.06,0.2",
        "gamma": 0.75
    },
    "mosaic"
);

var style = {
    "color": "ff0000",
    "fillColor": "ff000000",
    "width": 2
};

Map.addLayer(grids.style(style),
    {
        "format": "png"
    },
    "grids"
);



/**
 * print grid names
 */

print("copy the content bellow and past into a csv file");
print("grid_name,year,region_code");

collection.filter(ee.Filter.bounds(mosaicos_sin_cambios))
    .reduceColumns(ee.Reducer.toList(), ["grid_name"])
    .get('list')
    .evaluate(
        function (gridNames) {
            gridNames.forEach(
                function (gridName) {
                    print(gridName + "," + param.year + "," + param.region_code);
                }
            );
        }
    );
