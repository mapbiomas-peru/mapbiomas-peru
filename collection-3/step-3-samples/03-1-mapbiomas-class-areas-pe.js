/** 
 * STEP 03-1: CÁLCULO DE AREAS PARA SORTEAR MUESTRAS DE ENTRENAMIENTO 
 * DOCUMENTACIÓN: 
 * ----------------------------------------------------------------------------------------------
 */
 
 
 
/** 
 * PARAMETROS DE USUARIO:
 * Ajuste los parámetros a continuacón para generar la imagen de pixeles estables correspondiente
 * ----------------------------------------------------------------------------------------------
 */
var param = {
  regionId: 70401,
  country: 'PERU',
  referenceYear: '',   // year or ''  
  remap: {
    from: [3, 4, 5, 6, 9, 11, 12, 13, 14, 15, 18, 19, 20, 21, 22, 23, 24, 25, 26, 29, 30, 31, 32, 33, 34, 35, 68],
    to:   [3,27, 5, 6,21, 11, 12, 13, 14,	15,	21,	19,	20,	21,	22,	23,	25,	29,	26,	29,	25,	31,	32,	33,	34, 35, 68]
  },
  driveFolder: 'RAISG-EXPORT',
  ciclo: 'ciclo-1',
  version:1
};



/**
 * ----------------------------------------------------------------------------------------------
 * INICIALIZACIÓN DE LA APLICACIÓN
 * Self invoked expresion que ejecuta el paso 3 de la metodología
 * ----------------------------------------------------------------------------------------------
 */
var dirs = require('users/mapbiomasperu/mapbiomas-lulc:collection-3/modules/CollectionDirectories-cloud.js');
var paths = dirs.listpaths(param.country);

(function init(param) {
  
  var assets = {
    basePath: 'projects/mapbiomas-peru/assets/LAND-COVER/COLLECTION3/GENERAL/SAMPLES/',
    regions: paths.regionVectorBuffer,
    referenceImage: paths.collection2_PE,
    stablePixels: paths.pixelesEstables 
  };
  
  var version = getVersion(param.ciclo);
  
  var region = getRegion(assets.regions, assets.regionsRaster, param.regionId);
  var rasterMask = region.rasterMask;

  var country = region.vector.first().get('pais').getInfo().toUpperCase()
      .replace('Ú', 'U')
      .replace(' ', '_');
      
  var baseName = country + '-' + param.regionId + '-' + 
        version.inputVPixelesEstables.toString();
  
  var classes = ee.List.sequence(1, 68).getInfo();
  
  var reference, updtReference;
  
  if(param.referenceYear){
    // Seleccion de año para balanceo 
    reference = ee.Image(assets.referenceImage)
      .select('classification_' + param.referenceYear.toString())
      .updateMask(rasterMask);

    // Remapeo de clases
    var originalClasses = param.remap.from;
    var newClasses = param.remap.to;
    updtReference = remapBands(reference, originalClasses, newClasses);
  }
  else{
    updtReference = ee.Image(assets.stablePixels + 'ME-' + baseName);
  }
  
  var areas = getAreas(updtReference, classes, region.vector);
  
  print('Capa de áreas por clase', areas);


  // Mortrar capa de referencia en el mapa
var palette = require('users/mapbiomas/modules:Palettes.js').get('classification8')
  Map.addLayer(updtReference, {
    min: 0,
    max: 62,
    palette: palette
  }, 'Areas');
  
  

  // Exportar estadísticas a Google Drive
  var tableName = 'ac-'+ country + '-' + param.regionId + '-' + 
    version.outputVCalcArea.toString();
    
  var outputPath = paths.AreasClass;

  print('Ubicación de salida', outputPath);
  
  print('Archivo salida', tableName);
  
  exportFeatures(
    areas, 
    tableName, 
    outputPath + tableName,
    param.driveFolder
  );

})(param);


/**
 * FUNCIONALIDADES
 * A continuación se definen las funcionalidades que se usan en la aplicación.
 * Estas features se inyectan en la función init() que las ejecuta y genera los
 * resultados.
 * ----------------------------------------------------------------------------------------------
 */
 
/**
 * Funcion para asignar una versión por ciclo
 * 
 */
function getVersion(cicle) { 
  var version = {
    'ciclo-1': {
      // Ciclo I
      inputVPixelesEstables: param.version,
      outputVCalcArea: param.version,
    },
    'ciclo-2': {
      // Ciclo II
      inputVPixelesEstables: 2,
      outputVCalcArea: 2
    }
  };
  
  return version[cicle];
}


/**
 * Función para remapear (reclasificar) cabdas clasifiacadas
 * En el orden de ejecución, esta función corre antes del remapeo con polígonos
 */
function remapBands(image, originalClasses, newClasses) {
  var bandNames = image.bandNames().getInfo();
  var collectionList = ee.List([]);
  
  bandNames.forEach(
    function( bandName ) {
      var remapped = image.select(bandName)
        .remap(originalClasses, newClasses);
    
      collectionList = collectionList.add(remapped.int8().rename(bandName));
    }
  );
  var collectionRemap = ee.ImageCollection(collectionList);
  image = collectionRemap.toBands();
  

  
  var actualBandNames = image.bandNames();
  var singleClass = actualBandNames.slice(1)
    .iterate(
      function( bandName, previousBand ) {
        bandName = ee.String(bandName);
                
        previousBand = ee.Image(previousBand);

        return previousBand.addBands(image
          .select(bandName)
          .rename(ee.String('classification_')
          .cat(bandName.split('_').get(2))));
      },
      ee.Image(image.select([actualBandNames.get(0)])
          .rename(ee.String('classification_')
          .cat(ee.String(actualBandNames.get(0)).split('_').get(2))))
    );
  return ee.Image(singleClass);
}



/**
 * Función para calcular áreas (en Km2) por clase, con base en la imágen
 * de pixeles estables.
 */
function getAreas(image, classes, region){
  
  var reducer = {
      reducer: ee.Reducer.sum(),
      geometry: region.geometry(), 
      scale: 30,
      maxPixels: 1e13
  };
  
  var propFilter = ee.Filter.neq('item', 'OBJECTID');
  
  classes.forEach( function( classId, i ) {
      var imageArea = ee.Image.pixelArea()
        .divide(10000)  //has
        .mask(image.eq(classId))
        .reduceRegion(reducer);
      
      var area = ee.Number(imageArea.get('area')).round();
          
      region = region.map(function(item){
        var props = item.propertyNames();
        var selectProperties = props.filter(propFilter);
        
        return item
          .select(selectProperties)
          .set('ID' + classId.toString(), area);
      });
      
      return region;
  });
  
  return region;
  
}




/**
 * Función para generar region de interés (ROI) con base en
 * las región de clasificación o una grilla millonésima contenida en ella
 */
function getRegion(regionPath, regionImagePath, regionId){
  
  var region = ee.FeatureCollection(regionPath)
    .filterMetadata("id_regionC", "equals", regionId);
  
  // var regionMask = ee.Image(regionImagePath).eq(regionId).selfMask();
  var setVersion = function(item) { return item.set('version', 1) };
  var regionMask = region
    .map(setVersion)
    .reduceToImage(['version'], ee.Reducer.first());
    
  return {
    vector: region,
    rasterMask: regionMask
  };

}



/**
 * Función para exportar las áreas calculadas como assets de GEE
 */
function exportFeatures(features, tableName, tableId, driveFolder) {
  
  Export.table.toAsset({
    collection: features, 
    description: tableName,
    assetId: tableId,
  });
  
  var featuresTable = ee.FeatureCollection([
    ee.Feature(null, features.first().toDictionary())
  ]);
  
  if(driveFolder !== '' && driveFolder) {
    Export.table.toDrive({
      collection: featuresTable, 
      description: tableName + '-DRIVE',
      folder: driveFolder,
      fileFormat: 'CSV',
    });
  }
}
