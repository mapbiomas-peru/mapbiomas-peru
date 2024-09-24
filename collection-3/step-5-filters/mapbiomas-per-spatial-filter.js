/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: #d63000 */ee.Geometry.MultiPoint();
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// FILTRO ESPACIAL

var param = {
    code_region: 70301,  //Region de Clasificacion
    pais: 'PERU',
    eightConnected: true, 
    year: 2010,  // Solo visualizacion
    // ciclo: 'ciclo-1',
    version_input:22, //
    version_output:23,
    exportOpcion: {   // Opciones para exportar
      DriveFolder: 'DRIVE-EXPORT',  // carpeta a exportar archivo drive
      exportClasifToDrive:  false, // exporta clasificaciones a drive (true or false)
      exportEstadistica: false, // Exporta Areas (true or false)
    },
    exclusion:{  // Indicar en la lista las clases y años a excluir en el filtro
      clases : [],  //lista de clases a excluir en todos los años
      years  : [],  //lista de años a excluir con todas la clases
    },
    desactivaPiramide: false,
    Graficar:{ 
      claseGraph:15,// clase que se graficará en la consola, tando la class original como la filtrada
    }
};

var min_connect_pixel = 5  

var dirs = require('users/mapbiomasperu/mapbiomas-lulc:collection-3/modules/CollectionDirectories-cloud.js');
var paths = dirs.listpaths(param.pais);

var assetClasif = paths.classification;
var assetFiltros = paths.clasificacionFiltros
var dirout  = paths.clasificacionFiltros
var regionesclass = paths.regionVectorBuffer
// var regionesclassRaster = paths.regionCRaster
var AssetMosaic= [ paths.mosaics_c4_raisg,  paths.mosaics_c4_nexgen]

// Obtiene la version de salida en base al ciclo
  // var version = getVersion(param.ciclo);
  var version_input = param.version_input;
  var version_output = param.version_output;

var prefixo_out = param.pais+ '-' + param.code_region + '-' + version_output

/**
 * Visualizaciones
 */
// añadimos el mosaico
// var GF = require('users/raisgmb01/MapBiomas_C3:MODULES/GlobalFunctions').GlobalFunct;

// var CodMosaico = String(param.code_region).slice(0, 3);

// GF.AddMosaico(param.code_region,CodMosaico,param.year,param.pais);
// ------------------------


var region = ee.FeatureCollection(regionesclass)
                  .filterMetadata("id_regionC","equals", param.code_region);
                  
var setVersion = function(item) { return item.set('version', 1) };
var regionRaster = region
  .map(setVersion)
  .reduceToImage(['version'], ee.Reducer.first());
    
    
var mosaicRegion = param.code_region.toString().slice(0, 3);
var mosaic = ee.ImageCollection(AssetMosaic[0]).merge(ee.ImageCollection(AssetMosaic[1]))
            .filterMetadata('region_code', 'equals', Number(mosaicRegion))
            .select(['swir1_median', 'nir_median', 'red_median']);
var class4FT
if(param.version_input  < 10){
    var assetPath = assetFiltros + '/' + param.pais + '-' + param.code_region;
    class4FT = ee.Image(assetPath  + '-' + version_input);
   } else   {    
    class4FT = ee.ImageCollection(assetFiltros)
               .filterMetadata('code_region', 'equals', param.code_region)
               .filterMetadata('version', 'equals', version_input)
               .first()
     }
     

print(class4FT);

var years = [
    1985, 1986, 1987, 1988,
    1989, 1990, 1991, 1992,
    1993, 1994, 1995, 1996,
    1997, 1998, 1999, 2000,
    2001, 2002, 2003, 2004,
    2005, 2006, 2007, 2008,
    2009, 2010, 2011, 2012,
    2013, 2014, 2015, 2016,
    2017, 2018, 2019, 2020,
    2021, 2022, 2023, 2024];    
    
// get band names list 
var bandNames = ee.List(
    years.map(
        function (year) {
            return 'classification_' + String(year);
        }
    )
);
var bandNamesExclude = ee.List(
    param.exclusion.years.map(
        function (year) {
            return 'classification_' + String(year);
        }
    )
);

// Add bands mask
  // generate a histogram dictionary of [bandNames, image.bandNames()]
  var bandsOccurrence = ee.Dictionary(
      bandNames.cat(class4FT.bandNames()).reduce(ee.Reducer.frequencyHistogram())
  );
  
  // print(bandsOccurrence);
  
  // insert a masked band 
  var bandsDictionary = bandsOccurrence.map(
      function (key, value) {
          return ee.Image(
              ee.Algorithms.If(
                  ee.Number(value).eq(2),
                  class4FT.select([key]).byte(),
                  ee.Image(27).rename([key]).byte().updateMask(class4FT.select(0))
              )
          );
      }
  );
  // convert dictionary to image
  var imageAllBands = ee.Image(
      bandNames.iterate(
          function (band, image) {
              return ee.Image(image).addBands(bandsDictionary.get(ee.String(band)));
          },
          ee.Image().select()
      )
  );
  class4FT = imageAllBands




// add connected pixels bands
var imageFilledConnected = class4FT.addBands(
    class4FT
        .connectedPixelCount(100, param.eightConnected)
        .rename(bandNames.map(
            function (band) {
                return ee.String(band).cat('_connected')
            }
        ))
);

// print(imageFilledConnected)

class4FT= imageFilledConnected;

var palette = require('users/mapbiomas/modules:Palettes.js').get('classification8');
var vis = {
      bands: 'classification_1985',
      min:0,
      max:62,
      palette: palette,
      format: 'png'
    };
var vis2 = {
      min:0,
      max:62,
      palette: palette,
      format: 'png'
    };
var vis3 = {
      bands: 'classification_'+param.year,
      min:0,
      max:62,
      palette: palette,
      format: 'png'
    };
// Map.addLayer(class4FT.select(bandNames), vis, 'class4FT_1985', false);

var ano = '1985'
var moda_85 = class4FT.select('classification_'+ano).focal_mode(1, 'square', 'pixels')
moda_85 = moda_85.mask(class4FT.select('classification_'+ano+ '_connected').lte(min_connect_pixel))
var class_outTotal = class4FT.select('classification_'+ano).blend(moda_85)

// Map.addLayer(class_outTotal, vis, 'class4 MODA_1985', false);

var anos = ['1986','1987','1988','1989','1990','1991','1992','1993',
            '1994','1995','1996','1997','1998','1999','2000','2001',
            '2002','2003','2004','2005','2006','2007','2008','2009',
            '2010','2011','2012','2013','2014','2015','2016','2017',
            '2018','2019','2020','2021','2022', '2023', '2024'];
            
for (var i_ano=0;i_ano<anos.length; i_ano++){  
  var ano = anos[i_ano]; 
  var moda = class4FT.select('classification_'+ano).focal_mode(1, 'square', 'pixels')
  moda = moda.mask(class4FT.select('classification_'+ano+ '_connected').lte(min_connect_pixel))
  var class_out = class4FT.select('classification_'+ano).blend(moda)
  class_outTotal = class_outTotal.addBands(class_out)
}

var classif_FS = class_outTotal.select(bandNames)

//Excluir clase y años 
// Classes Exclude
if(param.exclusion.clases.length>0){
   var clasifi = ee.List([])
      class4FT = class4FT.select(bandNames)
      param.exclusion.clases.forEach(function(clase){
        var clasif_code =class4FT.eq(clase).selfMask()
        clasifi = clasifi.add(class4FT.updateMask(clasif_code).selfMask())
      })
      
      clasifi = ee.ImageCollection(clasifi)
      clasifi = clasifi.max()
      Map.addLayer(clasifi,{},'clasific exclu_classe')
      classif_FS = classif_FS.blend(clasifi)
      print('Clases excluidos en el Filtro temporal', param.exclusion.clases);
}

// Year Exclude
if(param.exclusion.years.length>0){
  var yearExlud = class4FT.select(bandNamesExclude);  //addbands
  classif_FS =  classif_FS.addBands(yearExlud,null,true); // Remplaza las clases a no modificar
  print('Años excluidos en el Filtro temporal', param.exclusion.years);
}


class_outTotal = classif_FS.select(bandNames).updateMask(regionRaster)
                              .set('code_region', param.code_region)
                              .set('pais', param.pais)
                              .set('version', version_output)
                              .set('descripcion', 'filtro espacial')
                              .set('paso', 'P06');
            
print('Result', class_outTotal);

if(param.piramideActive) {
  Map.addLayer(mosaic.filterMetadata('year', 'equals', param.year)
                     .mosaic()
                     .updateMask(regionRaster), {
        'bands': ['swir1_median', 'nir_median', 'red_median'],
        'gain': [0.08, 0.06, 0.08],
        'gamma': 0.65
    }, 'mosaic-'+param.year, false)
  Map.addLayer(class4FT.select(bandNames), vis3, 'class-ORIGINAL'+param.year);
  Map.addLayer(class_outTotal, vis3, 'class-SPATIAL FILTER'+param.year);
} else {
  Map.addLayer(mosaic.filterMetadata('year', 'equals', param.year)
                     .mosaic()
                     .updateMask(regionRaster), {
        'bands': ['swir1_median', 'nir_median', 'red_median'],
        'gain': [0.08, 0.06, 0.08],
        'gamma': 0.65
    }, 'mosaic-'+param.year, false)
  Map.addLayer(class4FT.select(bandNames)
                       .reproject('EPSG:4326', null, 30), vis3, 'class-ORIGINAL'+param.year);
  Map.addLayer(class_outTotal.reproject('EPSG:4326', null, 30), vis3, 'class-SPATIAL FILTER'+param.year);
}


Export.image.toAsset({
    'image': class_outTotal,
    'description': prefixo_out,
    'assetId': dirout+'/'+ prefixo_out,
    'pyramidingPolicy': {
        '.default': 'mode'
    },
    'region': region.geometry().bounds(),
    'scale': 30,
    'maxPixels': 1e13
});

  // Exportar a Google Drive
  if(param.exportOpcion.exportClasifToDrive){
    Export.image.toDrive({
      image: class_outTotal.toInt8(),
      description: prefixo_out + '-DRIVE',
      folder: param.exportOpcion.DriveFolder,
      scale: 30,
      maxPixels: 1e13,
      region: region.geometry().bounds()
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
      description: 'ESTADISTICAS-DE-COBERTURA-'+prefixo_out,
      fileFormat: 'CSV',
      folder: 'P09-FiltroEspacial-CLASSIFICATION'
    });
      
  });
  
}

// Generar estadísticas de cobertura
if(param.exportOpcion.exportEstadistica){
  getAreas(class_outTotal, region)
}


// Función para seleccionar la clase a graficar
function enmascararValor(image, banda) {
  return image.select([banda]).eq(param.Graficar.claseGraph)
               .multiply(ee.Image.pixelArea()).divide(10000); // Convierte el área de m² a hectáreas
}

//GRAFICO ORIGINAL:
var year = ee.List.sequence(1985, 2023); // Ajusta los años según tus bandas
var areasPorAño0 = year.map(function(año) {
  var nombreBanda = ee.String('classification_').cat(ee.Number(año).int().format());
  var area0 = enmascararValor(class4FT, nombreBanda).reduceRegion({
    reducer: ee.Reducer.sum(),
    geometry: region.geometry(),
    scale: 250, // Ajusta según la resolución de tu imagen
    maxPixels: 1e9
  });
  return ee.Number(area0.get(nombreBanda)).round(); // Redondea el resultado a hectáreas
});


var chart0 = ui.Chart.array.values({
  array: ee.Array(areasPorAño0),
  axis: 0,
  xLabels: year
}).setOptions({
  title: 'Tendencia Anual - Clase ' + param.Graficar.claseGraph,
  titlePosition: 'center',
  legend: {position: 'none'},
  hAxis: {
    title: 'Año', 
    viewWindow: {min: 1985, max: 2023}, 
    scaleType: 'linear',
    textStyle: {italic: false, bold: false},  // tick label text style
    titleTextStyle: {italic: false, bold: true, fontSize: 9},
    ticks: [1985, 1990, 2000, 2010, 2020, 2022]// axis title text style
  },
  vAxis: {
    title: 'Área (ha)', 
    textStyle: {italic: false, bold: false},  // tick label text style
    titleTextStyle: {italic: false, bold: true},
    format: 'short'
    },
  colors: [palette[param.Graficar.claseGraph]],
  lineWidth: 2,
  pointSize: 1,
  chartArea: {backgroundColor: '#5e5d5a'},
  trendlines: {
    0: {  // add a trend line to the 1st series
      type: 'linear',  // or 'polynomial', 'exponential'
      color: '#ffffff',
      lineWidth: 5,
      opacity: 0.6,
      visibleInLegend: true,
    }
  }
});

print('Grafico de areas por clase ORIGINAL - escala 250m :', chart0);

//GRAFICO FILTRO
var year = ee.List.sequence(1985, 2023); // Ajusta los años según tus bandas
var areasPorAño = year.map(function(año) {
  var nombreBanda = ee.String('classification_').cat(ee.Number(año).int().format());
  var area = enmascararValor(class_outTotal, nombreBanda).reduceRegion({
    reducer: ee.Reducer.sum(),
    geometry: region.geometry(),
    scale: 250, // Ajusta según la resolución de tu imagen
    maxPixels: 1e9
  });
  return ee.Number(area.get(nombreBanda)).round(); // Redondea el resultado a hectáreas
});

//print('areas por año:', areasPorAño)


var chart = ui.Chart.array.values({
  array: ee.Array(areasPorAño),
  axis: 0,
  xLabels: year
}).setOptions({
  title: 'Tendencia Anual - Clase ' + param.Graficar.claseGraph,
  titlePosition: 'center',
  legend: {position: 'none'},
  hAxis: {
    title: 'Año', 
    viewWindow: {min: 1985, max: 2023}, 
    scaleType: 'linear',
    textStyle: {italic: false, bold: false},  // tick label text style
    titleTextStyle: {italic: false, bold: true, fontSize: 9},
    ticks: [1985, 1990, 2000, 2010, 2020, 2022]// axis title text style
  },
  vAxis: {
    title: 'Área (ha)', 
    textStyle: {italic: false, bold: false},  // tick label text style
    titleTextStyle: {italic: false, bold: true},
    format: 'short'
    },
  colors: [palette[param.Graficar.claseGraph]],
  lineWidth: 2,
  pointSize: 1,
  chartArea: {backgroundColor: '#5e5d5a'},
  trendlines: {
    0: {  // add a trend line to the 1st series
      type: 'linear',  // or 'polynomial', 'exponential'
      color: '#ffffff',
      lineWidth: 5,
      opacity: 0.6,
      visibleInLegend: true,
    }
  }
});

print('Grafico de areas por clase FILTRADO - escala 250m :', chart);

  
  
 