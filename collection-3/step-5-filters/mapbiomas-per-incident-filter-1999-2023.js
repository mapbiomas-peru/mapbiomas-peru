/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: #d63000 */ee.Geometry.MultiPoint();
/***** End of imports. If edited, may not auto-convert in the playground. *****/
  
var param = {
    code_region: 70301,  //Region de Clasificacion
    pais: 'PERU',
    year: 2000,  // Solo visualizacion
    Incidence_calc: 6,  // Para detectar cambio temporales mayores > a
    PixelBorde: {
      Max_connect:22, // Maximo numero de pixeles agrupados para ser considerado en el filtro <= a
      Min_incidence: 8, // Numero minimo de incidencias o cambios en toda la serie temporal >= a
    },
    version_input_class:24, //  Clasificacion de entrada (ojo no es el paso 13-1)
    version_output:25, //    Salida 
    exportOpcion: {   // Opciones para exportar
      DriveFolder: 'DRIVE-EXPORT',  // carpeta a exportar archivo drive
      exportClasifToDrive:  false, // exporta clasificaciones a drive (true or false)
      exportEstadistica: false, // Exporta Areas (true or false)
    }
};

// remap en analisis USAR CON CUIDADO (NO VALIDADO)
var classeIds =    [3,6,4,11,12,21,22,33,34]
var newClasseIds = [3,6,4,11,12,21,22,33,34]
//------------------------------------
 var years = [
    // 1985, 1986, 1987, 1988,
    // 1989, 1990, 1991, 1992,
    // 1993, 1994, 1995, 1996,
    // 1997, 1998, 
    1999, 2000,
    2001, 2002, 2003, 2004,
    2005, 2006, 2007, 2008,
    2009, 2010, 2011, 2012,
    2013, 2014, 2015, 2016,
    2017, 2018, 2019, 2020, 
    2021, 2022, 2023, 2024];
 
var bandNames = ee.List(
    years.map(
        function (year) {
            return 'classification_' + String(year);
        }
    )
);
 
 
 
// Input Assets
var dirs = require('users/mapbiomasperu/mapbiomas-lulc:collection-3/modules/CollectionDirectories-cloud.js');
var paths = dirs.listpaths(param.pais);

var dirinput = paths.clasificacionFiltros
var dirout  = paths.clasificacionFiltros
var regionesclass = paths.regionVectorBuffer
var AssetMosaic= [ paths.mosaics_c4_raisg,  paths.mosaics_c4_nexgen]

var palettes = require('users/mapbiomas/modules:Palettes.js');
var pal = palettes.get('classification8');

// Prefix Name
var prefixo_out = param.pais+ '-' + param.code_region + '-' + param.version_output;

// Region select
var regions = ee.FeatureCollection(regionesclass)
    .filterMetadata('id_regionC', "equals", param.code_region);

// Mosaic select
var mosaicRegion = param.code_region.toString().slice(0, 3);
var mosaic = ee.ImageCollection(AssetMosaic[0]).merge(ee.ImageCollection(AssetMosaic[1]))
            .filterMetadata('region_code', 'equals', Number(mosaicRegion))
            .select(['swir1_median', 'nir_median', 'red_median']);
            
var classification_input = ee.ImageCollection(dirinput)
                            .filterMetadata('code_region', 'equals', param.code_region)
                            .filterMetadata('version', 'equals', param.version_input_class)
                            .min()
                            .select(bandNames); 
print(classification_input);

var vis = {
      bands: 'classification_'+param.year,
      min:0,
      max:62,
      palette: pal,
      format: 'png'
    };
var vis2 = {
      min:0,
      max:62,
      palette: pal,
      format: 'png'
    };
    
Map.addLayer(mosaic.filterMetadata('year', 'equals', param.year)
                   .mosaic(), {
      'bands': ['swir1_median', 'nir_median', 'red_median'],
      'gain': [0.08, 0.06, 0.08],
      'gamma': 0.65
  }, 'mosaic-'+param.year, false);
  
Map.addLayer(classification_input, vis, 'class_FF_Original'+param.year);

//Map.addLayer(class4Gap, {}, 'class GAP', false)
var palette_incidence = ["#C8C8C8","#FED266","#FBA713","#cb701b", "#cb701b", "#a95512", "#a95512", "#662000",  "#662000", "#cb181d"]


//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++                   
// Calculate incidence in clasification (prepare)                 
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
  var colList = ee.List([])
  for (var i_year=0;i_year<years.length; i_year++){
    var yearS = years[i_year];
    var colList = colList.add(classification_input.select(['classification_'+yearS],['classification']))
  }
  var imc_carta = ee.ImageCollection(colList)
  
  var img1 =  ee.Image(imc_carta.first());
  
  var image_moda = classification_input.reduce(ee.Reducer.mode());
  
  // ******* incidence **********
  var imagefirst = img1.addBands(ee.Image(0)).rename(["classification", "incidence"]);
  
  var incidence = function(imgActual, imgPrevious){
    
    imgActual = ee.Image(imgActual);
    imgPrevious = ee.Image(imgPrevious);
    
    var imgincidence = imgPrevious.select(["incidence"]);
    
    var classification0 = imgPrevious.select(["classification"]);
    var classification1 = imgActual.select(["classification"]);
    
    
    var change  = ee.Image(0);
    change = change.where(classification0.neq(classification1), 1);
    imgincidence = imgincidence.where(change.eq(1), imgincidence.add(1));
    
    return imgActual.addBands(imgincidence);
    
  };
  
  var imc_carta4 = imc_carta.map(function(image) {
       image = image.remap(classeIds, newClasseIds, 21)
       image = image.mask(image.neq(27));
      return image.rename('classification');
  });
  print(imc_carta4)
  // Map.addLayer(imc_carta4, vis, 'imc_carta4');
  
  var image_incidence = ee.Image(imc_carta4.iterate(incidence, imagefirst)).select(["incidence"]);

  image_incidence = image_incidence.mask(image_incidence.gt(param.Incidence_calc))
  
  image_incidence = image_incidence.addBands(image_incidence.where(image_incidence.gt(param.Incidence_calc),1).rename('valor1'))
  image_incidence = image_incidence.addBands(image_incidence.select('valor1').connectedPixelCount(100,false).rename('connect'))
  image_incidence = image_incidence.addBands(image_moda)

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    
Map.addLayer(image_incidence.reproject('EPSG:4326', null, 30), {bands: 'incidence', palette:palette_incidence, min:8, max:20}, "Incidence_calc", false);
Map.addLayer(image_incidence.reproject('EPSG:4326', null, 30), {bands: 'connect', palette:palette_incidence, min:8, max:20}, "connect", false);

var classification_corrigida = classification_input

print(image_incidence)

var maskIncid_borda = image_incidence.select('connect').lte(param.PixelBorde.Max_connect)
                      .and(image_incidence.select('incidence').gte(param.PixelBorde.Min_incidence))

maskIncid_borda = maskIncid_borda.mask(maskIncid_borda.eq(1))              
Map.addLayer(maskIncid_borda.reproject('EPSG:4326', null, 30), {palette:"#f49e27", min:1, max:1}, 'maskIncid_borde',false) 

var corrige_borda = image_incidence.select('mode').mask(maskIncid_borda)
// Map.addLayer(corrige_borda.reproject('EPSG:4326', null, 30),{},'corrige_borda')

classification_corrigida = classification_corrigida.blend(corrige_borda)

Map.addLayer(classification_corrigida.reproject('EPSG:4326', null, 30), vis, 'class_FF_corrigida'+param.year);

classification_corrigida =classification_corrigida
        .set('code_region', param.code_region)
        .set('pais', param.pais)
        .set('version', param.version_output)
        .set('descripcion', 'filtro incidentes apply')
        .set('paso', 'P07');

print(classification_corrigida)


Export.image.toAsset({
    'image': classification_corrigida,
    'description': prefixo_out,
    'assetId': dirout+'/'+prefixo_out,
    'pyramidingPolicy': {
        '.default': 'mode'
    },
    'region': regions.geometry().bounds(),
    'scale': 30,
    'maxPixels': 1e13
});


// Exportar a Google Drive
  if(param.exportOpcion.exportClasifToDrive){
    Export.image.toDrive({
      image: classification_corrigida.toInt8(),
      description: prefixo_out + '-DRIVE-'+param.version_output,
      folder: param.exportOpcion.DriveFolder,
      scale: 30,
      maxPixels: 1e13,
      region: regions.geometry().bounds()
    });
  }
  
  /**
 * Función para generar las estadísticas de cobertura por año y clase
 */
function getAreas(image, region) {

  var pixelArea = ee.Image.pixelArea();
  
  var reducer = {
    reducer: ee.Reducer.sum(),
    geometry: region.geometry(),
    scale: 30,
    maxPixels: 1e13
  };
  
  var bandNames = image.bandNames();
  
  var classIds = ee.List.sequence(0, 34);
  
  
  bandNames.evaluate( function(bands, error) {
    
    if(error) print(error.message);
    
    var yearsAreas = [];
  
  
    bands.forEach(function(band) {
    
      var year = ee.String(band).split('_').get(1),
          yearImage = image.select([band]);
  
      
      // Calcular áreas para cada clase cobertura
      var covers = classIds.map(function(classId) {
  
        classId = ee.Number(classId).int8();
      
        var yearCoverImage = yearImage.eq(classId),
            coverArea = yearCoverImage.multiply(pixelArea).divide(1e6);
        
        return coverArea.reduceRegion(reducer).get(band);
  
      }).add(year);
  
    
      // Generar la lista de keys para el diccionario
      var keys = classIds.map(function(item) {
  
        item = ee.Number(item).int8();
        
        var stringItem = ee.String(item);
        
        stringItem = ee.Algorithms.If(
          item.lt(10),
          ee.String('ID0').cat(stringItem),
          ee.String('ID').cat(stringItem)
        );
        
        return ee.String(stringItem);
        
      }).add('year');
  
      
      // Crear la lista de features para cada año, sin geometrías
      var dict = ee.Dictionary.fromLists(keys, covers);
  
      yearsAreas.push( ee.Feature(null, dict) );
      
    });
    
    
    yearsAreas = ee.FeatureCollection(yearsAreas);
  
    
    Export.table.toDrive({
      collection: yearsAreas,
      description: 'ESTADISTICAS-DE-COBERTURA-'+prefixo_out+param.version_output,
      fileFormat: 'CSV',
      folder: 'P13-FiltroIndicident-CLASSIFICATION'
    });
      
  });
  
}

// Generar estadísticas de cobertura
if(param.exportOpcion.exportEstadistica){
  getAreas(classification_corrigida, regions)
}
  