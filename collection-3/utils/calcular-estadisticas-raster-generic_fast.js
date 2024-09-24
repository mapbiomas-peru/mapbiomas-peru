// Importar clasificación preliminar y coleccion 2
var clasification = ee.Image('projects/mapbiomas-raisg/MAPBIOMAS-PERU/COLECCION3/TRANSVERSALES/MINERIA/clasificacion-ft/MINING-70211-PERU-12');
var regionID = 70211;
var regionsclass =  ee.Image('projects/mapbiomas-raisg/MAPBIOMAS-PERU/DATOS-AUXILIARES/RASTER/per-regiones-clasificacion-mbperu-3').eq(regionID).selfMask();
var driveFolder = 'PERU-EXPORT';
var OuputFileName = 'ESTADISTICAS';

print(clasification)

/**
* @description
*    calculate area
* 
* @author
*    João Siqueira
* 
*/

// Change the scale if you need.
var scale = 30;

// Define a list of bands_name to export  
var bands_name = [
  // 'deforestation_year',
  
    // '1985', '1986', '1987', '1988', '1989', '1990', '1991', '1992',
    // '1993', '1994', '1995', '1996', '1997', '1998', '1999', '2000',
    // '2001', '2002', '2003', '2004', '2005', '2006', '2007', '2008',
    // '2009', '2010', '2011', '2012', '2013', '2014', '2015', '2016',
    // '2017', '2018', '2019', '2020', '2021',
    
    'classification_1985', 
    'classification_1986', 'classification_1987', 'classification_1988', 'classification_1989', 'classification_1990', 
    'classification_1991', 'classification_1992', 'classification_1993', 'classification_1994', 'classification_1995', 
    'classification_1996', 'classification_1997', 'classification_1998', 'classification_1999', 'classification_2000',
    'classification_2001', 'classification_2002', 'classification_2003', 'classification_2004', 'classification_2005', 
    'classification_2006', 'classification_2007', 'classification_2008', 'classification_2009', 'classification_2010', 
    'classification_2011', 'classification_2012', 'classification_2013', 'classification_2014', 'classification_2015', 
    'classification_2016', 'classification_2017', 'classification_2018', 'classification_2019', 'classification_2020', 
    'classification_2021', 'classification_2022', 'classification_2023'
    
];  //deforestation_year


/**
* 
*/
// Territory image
var territory = regionsclass;

// LULC raster_clasification image
var raster_clasification = clasification.selfMask();

Map.addLayer(raster_clasification.randomVisualizer(),{},'raster_clasification',false)
Map.addLayer(territory.randomVisualizer(),{},'territory',false)

// Image area in km2
var pixelArea = ee.Image.pixelArea().divide(1000000); //km2

// Geometry to export
var geometry = raster_clasification.geometry();

/**
* Convert a complex ob to feature collection
* @param obj 
*/
var convert2table = function (obj) {

    obj = ee.Dictionary(obj);

    var territory = obj.get('territory');

    var classesAndAreas = ee.List(obj.get('groups'));

    var tableRows = classesAndAreas.map(
        function (classAndArea) {
            classAndArea = ee.Dictionary(classAndArea);

            var classId = classAndArea.get('class');
            var area = classAndArea.get('sum');

            var tableColumns = ee.Feature(null)
                .set('territory', territory)
                .set('class', classId)
                .set('area', area);

            return tableColumns;
        }
    );

    return ee.FeatureCollection(ee.List(tableRows));
};

/**
* Calculate area crossing a cover map (deforestation, raster_clasification)
* and a region map (states, biomes, municipalites)
* @param image 
* @param territory 
* @param geometry
*/
var calculateArea = function (image, territory, geometry) {

    var reducer = ee.Reducer.sum().group(1, 'class').group(1, 'territory');

    var territotiesData = pixelArea.addBands(territory).addBands(image)
        .reduceRegion({
            reducer: reducer,
            geometry: geometry,
            scale: scale,
            maxPixels: 1e12
        });

    territotiesData = ee.List(territotiesData.get('groups'));

    var areas = territotiesData.map(convert2table);

    areas = ee.FeatureCollection(areas).flatten();

    return areas;
};

var areas = bands_name.map(
    function (band) {
        // var image = raster_clasification.select('classification_' + year);
        var image = raster_clasification.select(band)
        
        var areas = calculateArea(image, territory, geometry);

        // set additional properties
        areas = areas.map(
            function (feature) {
                return feature.set('band', band);
            }
        );

        return areas;
    }
);

areas = ee.FeatureCollection(areas).flatten();

Export.table.toDrive({
    collection: areas,
    description: OuputFileName,  
    folder: driveFolder,
    fileNamePrefix: OuputFileName,
    fileFormat: 'CSV'
});
