// Junta coleccion 4 y 5 

var param = {
    regionId: 70206,
    country: 'PERU',
    yearsPreview: [2021, 2022],     // Solo visualizacion
    version_input: 14, //COLECCION 5
    version_output:21, //COLECCION 5
    List_year_add: [2023], // Año a agregar de COLECCION 5
    remap: {  // Remap coleccion4
      from: [3, 4, 5, 6, 9, 11, 12, 13, 14, 15, 18, 19, 20, 21, 22, 23, 24, 25, 26, 29, 30, 31, 32, 33, 34,35],
      to:   [3, 4, 5, 6, 9, 11, 12, 13, 14, 15, 18, 19, 20, 21, 22, 23, 22, 25, 26, 29, 30, 31, 32, 33, 34,35]
    },
};


/**
 * Import Modules CollectionDirectories
 */
var palettes = require('users/mapbiomas/modules:Palettes.js').get('classification8');
var dirs = require('users/mapbiomasperu/mapbiomas-lulc:collection-3/modules/CollectionDirectories.js');
var paths = dirs.listpaths(param.country);


(function init(param) {

  var assets = {
    grids: paths.grids,
    regions: paths.regionVector,
    mosaics: [ paths.mosaics_c4_raisg,  paths.mosaics_c4_nexgen],
    classification : paths.classification,
    classificationft : paths.clasificacionFiltros,
    classificationCol4 :  paths.collection2_PE
  };
  
  var rgb = ['swir1_median', 'nir_median', 'red_median'];
  var years = param.yearsPreview;
  var regionId = param.regionId;
  
  // Crear máscara con base en el vector de región y carta
  var region = getRegion(assets.regions, assets.grids, regionId, '');
  var vector = region.vector;
  var rasterMask =region.rasterMask
  
  // Importar assets con base en la región
  var mosaicPath = assets.mosaics;
  var mosaic = getMosaic(mosaicPath, regionId, '', '', vector);


  var country = region.vector.first().get('pais').getInfo().toUpperCase();
      country = country .replace('Ú', 'U').replace(' ', '_');
  var countryRegion = country + '-' + regionId;

  
  // Enviar imagenes al mapa
  var rgbMosaic = getMosaic(mosaicPath, regionId, rgb, '', vector);
  // addLayersToMapMosaic(rgbMosaic, years, vector);
  
  // get band names list 
    var bandNamesAdd = ee.List(
        param.List_year_add.map(
            function (year) {
                return 'classification_' + String(year);
            }
        )
    );

  
  var colleccion5pre = ee.ImageCollection(assets.classificationft)
                         .filterMetadata('code_region', 'equals', param.regionId)
                         .filterMetadata('version', 'equals', param.version_input)
                         .min()

  var colleccion5preSel =  colleccion5pre.select(bandNamesAdd)
  // print(colleccion5preSel)
  
  var colleccion4 = ee.Image(assets.classificationCol4).updateMask(rasterMask);
  
  // Remapeo de clases
  var originalClasses = param.remap.from;
  var newClasses = param.remap.to;
  colleccion4 = remapBands(colleccion4, originalClasses, newClasses);
  
  var colleccion5 = colleccion4.addBands(colleccion5preSel, null, true)
  
  var classified = colleccion5.toInt8()
    .set({
      code_region: regionId,
      pais: country,
      version: param.version_output,
      descripcion: 'clasificacion-v2',
      paso: 'P05-1'
    });
    
  print(classified)
  
  var filename = country + '-' + regionId + '-' + param.version_output;
  var imageId = assets.classificationft + '/' + filename;  

  Export.image.toAsset({
    image: classified,
    description: filename,
    assetId: imageId,
    scale: 30,
    pyramidingPolicy: {
      '.default': 'mode'
    },
    maxPixels: 1e13,
    region: vector.geometry().bounds()
  });
  
  years.forEach(function(year) {
  
    var vis = {
        'bands': ['classification_' + year],
        'min': 0,
        'max': 62,
        'palette': palettes,
        'format': 'png'
     };
  
    var mosaicYear = mosaic.filterMetadata('year', 'equals', year)
      .mosaic()
      .clip(vector);
      
    Map.addLayer(
      mosaicYear,
      {
        bands: ['swir1_median', 'nir_median', 'red_median'],
        gain: [0.08, 0.06, 0.2]
      },
      'MOSAICO ' + year.toString(), false
    );
    
    if (year < 2022) {
      Map.addLayer(
      colleccion4,
      vis,
      'clasificacion col4- ' + year, false)
    }
    
      Map.addLayer(
      colleccion5pre,
      vis,
      'clasificacion pre-' + year, false)
    
      Map.addLayer(
      colleccion5,
      vis,
      'clasificacion col5-' + year, false)

   });
  
  
      
})(param);



/**
 * Función para generar region de interés (ROI) con base en
 * las región de clasificación o una grilla millonésima contenida en ella
 */
function getRegion(regionPath, gridPath, regionId, gridName){
  
  var region = ee.FeatureCollection(regionPath)
        .filterMetadata("id_regionC", "equals", regionId);
  
  if(gridName && gridName !== '') {
    var grid = ee.FeatureCollection(gridPath)
      .filterMetadata("name", "equals", gridName)
      .first();
      
    grid = grid.set('pais', region.first().get('pais'));
    
    region = ee.FeatureCollection(ee.Feature(grid));
  }
  
  // Generar el raster
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
 * Función para filtrar mosaicos
 * Permite filtrar los mosaicos por codigo de región y grilla 250.000,
 * También gestiona la selección de índices que serán utilizados para generar los
 * puntos de entrenamiento.
 */
function getMosaic(paths, regionId, variables, gridName,regionVector) {
  
  // Importar datos de altitud
  var altitude = ee.Image('JAXA/ALOS/AW3D30_V1_1')
    .select('AVE')
    .rename('altitude');
      
  var slope = ee.Terrain.slope(altitude).int8()
    .rename('slope');
    
  /**
   * Hand
   */
  //-----------------------------------------------------------------------------
    var hand30_100 = ee.ImageCollection('users/gena/global-hand/hand-100');
    var srtm = ee.Image("USGS/SRTMGL1_003");
    var hand30_1000 =  ee.Image("users/gena/GlobalHAND/30m/hand-1000");
    var hand90_1000 = ee.Image("users/gena/GlobalHAND/90m-global/hand-1000");
    var hand30_5000 = ee.Image("users/gena/GlobalHAND/30m/hand-5000");
    var fa = ee.Image("users/gena/GlobalHAND/90m-global/fa");
    var jrc = ee.Image("JRC/GSW1_0/GlobalSurfaceWater");
    var HS_fa = ee.Image("WWF/HydroSHEDS/15ACC");
    var HS_fa30 = ee.Image("WWF/HydroSHEDS/30ACC");
    var demUk = ee.Image("users/gena/HAND/test_uk_DSM");
    
    // smoothen HAND a bit, scale varies a little in the tiles
    hand30_100 = hand30_100.mosaic().focal_mean(0.1);
    
    // potential water (valleys)
    var thresholds = [0,1,2,5,10];
    var HANDm = ee.List([]);
    thresholds.map(function(th) {
      var water = hand30_100.lte(th)
        .focal_max(1)
        .focal_mode(2, 'circle', 'pixels', 5).mask(swbdMask);
        
      HANDm = HANDm.add(water.mask(water).set('hand', 'water_HAND_<_' + th + 'm'));
    });
    
    // exclude SWBD water
    var swbd = ee.Image('MODIS/MOD44W/MOD44W_005_2000_02_24').select('water_mask');
    // Map.addLayer(swbd, {}, 'swbd mask', false);
    var swbdMask = swbd.unmask().not().focal_median(1);
    
    // water_hand	water (HAND < 5m)
    var HAND_water = ee.ImageCollection(HANDm)
    
    // exports.
    hand30_100  =hand30_100.rename('hand30_100');
    hand30_1000 =hand30_1000.rename('hand30_1000');
    hand30_5000 =hand30_5000.rename('hand30_5000');
    hand90_1000 =hand90_1000.rename('hand90_1000');
    HAND_water  =HAND_water.toBands().rename(['water_HAND_0m',
                                                  'water_HAND_1m',
                                                  'water_HAND_2m',
                                                  'water_HAND_5m',
                                                  'water_HAND_10m']);
            
    var Hand_bands =  hand30_100.addBands(hand30_1000)
                                .addBands(hand30_5000)
                                .addBands(hand90_1000)
                                .addBands(HAND_water);
                                
    // print(Hand_bands)
  
  /**
   * Latitud Longitud
   */
  //-----------------------------------------------------------------------------
  var longLat = ee.Image.pixelLonLat();
  
  /**
   * ShadeMask2
   */
  //-----------------------------------------------------------------------------
  var shademask2 = ee.Image("projects/mapbiomas-raisg/MOSAICOS/shademask2_v3").rename('shademask2');
  
  /**
   * slppost
   */
  //-----------------------------------------------------------------------------
  var slppost = ee.Image("projects/mapbiomas-raisg/MOSAICOS/slppost2_30_v3").rename('slppost');
  
  //-----------------------------------------------------------------------------
  
  
  // Gestionar mosaicos Landsat
  var mosaicRegion = regionId.toString().slice(0, 3);
  
  var workspace_c3_v2 = ee.ImageCollection(paths[0]).merge(ee.ImageCollection(paths[1]));
  var joinedMosaics = workspace_c3_v2.map(function(image){
                      return ee.Image.cat(image, altitude, slope,longLat,Hand_bands,slppost,shademask2)});
  joinedMosaics = joinedMosaics.filterMetadata('region_code', 'equals', Number(mosaicRegion))
  
  // seleccionar variables
  if(variables.length > 0) return joinedMosaics.select(variables);
  
  else return joinedMosaics;

}
 


/**
 * Función para enviar visualización al mapa
 * 
 */
function addLayersToMapMosaic(mosaic, years, region) {
  
  years.forEach(function(year) {
    var mosaicYear = mosaic.filterMetadata('year', 'equals', year)
      .mosaic()
      .clip(region);
      
    Map.addLayer(
      mosaicYear,
      {
        bands: ['swir1_median', 'nir_median', 'red_median'],
        gain: [0.08, 0.06, 0.2]
      },
      'MOSAICO ' + year.toString(), false
    );
  });

  // Map.addLayer(
  //   region.style({
  //     fillColor: '00000066'
  //   }), {}, 'REGION');

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


