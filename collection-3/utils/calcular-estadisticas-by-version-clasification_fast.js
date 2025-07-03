var param = { 
  regionId: 70401,
  version: '1',
  paso :  'clasificacion',   //clasificacion, filtros
  driveFolder: 'RAISG-EXPORT',
  pais: 'PERU',
  years: 2021
};

/**
 * ----------------------------------------------------------------------------------------------
 * INICIALIZACIÓN DE LA APLICACIÓN
 * ----------------------------------------------------------------------------------------------
 */
 
var assets = {
  // regions: 'projects/mapbiomas-raisg/DATOS_AUXILIARES/VECTORES/clasificacion-regiones-5',
  // regionsRaster : 'projects/mapbiomas-raisg/DATOS_AUXILIARES/RASTERS/clasificacion-regiones-5',
  mosaics: ['projects/nexgenmap/MapBiomas2/LANDSAT/PANAMAZON/mosaics-2','projects/mapbiomas-raisg/MOSAICOS/mosaics-2'],
  mapbiomas: 'projects/mapbiomas-raisg/MAPBIOMAS-PERU/COLECCION2/INTEGRACION/mapbiomas_peru_collection2_integration_v1',
  classification: 'projects/mapbiomas-raisg/MAPBIOMAS-PERU/COLECCION3/clasificacion/',
  classification_ft: 'projects/mapbiomas-raisg/MAPBIOMAS-PERU/COLECCION3/clasificacion-ft/'
};

/**
 * Import Modules CollectionDirectories
 */
var dirs = require('users/mapbiomasperu/mapbiomas-lulc:collection-3/modules/CollectionDirectories.js');
var paths = dirs.listpaths(param.pais);
print(paths)
//params
var regionId = param.regionId;
var driveFolder = param.driveFolder;
var years = param.years;
var assetName = 'Area_por_regionC';


// Crear máscara con base en el vector de región y carta
var region = getRegion(paths.regionVector, regionId);
var country = region.vector.first().get('pais').getInfo().toUpperCase()
country = country.replace('Ú', 'U').replace(' ', '_');
var fullRegion = country + '-' + regionId;
Map.addLayer(region.vector,{},'region')


// Detectar etapa del procesamiento
var imageC;
if (param.paso == 'clasificacion' ){
  imageC = assets.classification + fullRegion + '-'+param.version;
} else if (param.paso == 'filtros' ){
  imageC = assets.classification_ft + fullRegion + '-'+param.version;
}

// Importar y filtrar mosaicos 
var mosaicRegion = regionId.toString().slice(0, 3);
var mosaics = ee.ImageCollection(assets.mosaics[0]).merge(ee.ImageCollection(assets.mosaics[1]))
    .filterMetadata('region_code', 'equals', Number(mosaicRegion));


// Importar clasificación preliminar y coleccion 2
var collection5 = ee.Image(imageC);
print('El asset es: ',collection5.get('descripcion'));

var regionsclass = region.rasterMask
// var regionsclass =  ee.Image(assets.regionsRaster).eq(param.regionId).selfMask();

 
// var palettes = require('users/mapbiomas/modules:Palettes.js');
var palettes = require('users/mapbiomas/modules:Palettes.js');
var mapbiomasPalette = palettes.get('classification8');



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

// Define a list of years to export
var years = [
    '1985', '1986', '1987', '1988', '1989', '1990', '1991', '1992',
    '1993', '1994', '1995', '1996', '1997', '1998', '1999', '2000',
    '2001', '2002', '2003', '2004', '2005', '2006', '2007', '2008',
    '2009', '2010', '2011', '2012', '2013', '2014', '2015', '2016',
    '2017', '2018', '2019', '2020', '2021', '2022'
];

// Define a Google Drive output folder 
var driverFolder = 'ESTADISTICAS-COL5';

/**
* 
*/
// Territory image
var territory = regionsclass;

// LULC mapbiomas image
var mapbiomas = collection5.selfMask();

var vis = {
    'bands': 'classification_'+param.years,
    'min': 0,
    'max': 62,
    'palette': mapbiomasPalette
};
Map.addLayer(mapbiomas,vis,'classification_'+param.years,false)

// Image area in km2
var pixelArea = ee.Image.pixelArea().divide(1000000);

// Geometry to export
var geometry = mapbiomas.geometry();

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
* Calculate area crossing a cover map (deforestation, mapbiomas)
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

var areas = years.map(
    function (year) {
        var image = mapbiomas.select('classification_' + year);

        var areas = calculateArea(image, territory, geometry);

        // set additional properties
        areas = areas.map(
            function (feature) {
                return feature.set('year', year);
            }
        );

        return areas;
    }
);

areas = ee.FeatureCollection(areas).flatten();

Export.table.toDrive({
    collection: areas,
    description: 'ESTADISTICAS-'+param.pais + '-' + param.regionId + '-'+ param.version,  
    folder: driverFolder,
    fileNamePrefix: 'ESTADISTICAS-'+param.pais + '-' + param.regionId + '-' + param.version,
    fileFormat: 'CSV'
});



// Función para asignar una versión arbitraria
function setVersion(item) { return item.set('version', 1) }



// Función para generar region de interés (ROI) con base en
function getRegion(regionPath, regionId){
  
  var region = ee.FeatureCollection(regionPath)
        .filterMetadata("id_regionC", "equals", regionId);
  
  var regionMask = region
    .map(setVersion)
    .reduceToImage(['version'], ee.Reducer.first());
    
  return {
    vector: region,
    rasterMask: regionMask
  };

}