/** 
                                P05 CLASIFICACION PRELIMINAR  GAPFILL
 Update  2018___   Marcos:   
 Update  20181008  EYTC: Adaptacion para col2 
 Update  20181021  EYTC: actualizacion para años sin clasificacion en toda la region
 Update  20191030  João: otimização e image metadata
 Update  20201027  EYTC: Act para col3
 Update   20210123  EYTC: Multifunciones de exclusion y inputasset

 * @input
 * 
 * param: objeto de parámetros en formato JSON. Contiene:
 *    code_region: id de la región de clasificación.
 *    pais: nombre del país en letras mayúsculas.
 *    version_input: numero de la versión de clasificacion de entrada del paso P04.
 *    version_out: numero de la versión que se exportará el asset.
 *    years: año para visualizacion de clasificacion.
 *    Graficar: clase a graficar y evaluar su tendencia
 **/

/**
 * User defined parameters
 */
var param = {
    code_region: 70304,  //Region de Clasificacion
    pais: 'PERU',
    year: [2023],  // Solo visualizacion
    version_input:2, //
    version_output:2,
    ExportOpcion: {   // Opciones para exportar
      DriveFolder: 'DRIVE-EXPORT',  // carpeta a exportar archivo drive
      exportClasifToDrive:  false, // exporta clasificaciones a drive (true or false)
      exportEstadistica: false, // Exporta Areas (true or false)
    },
    exclusion:{  // Indicar en la lista las clases y años a excluir en el filtro
      clases : [],  //lista de clases a excluir en todos los años
      years  : [],  //lista de años a excluir con todas la clases
    },
    Graficar:{ 
      claseGraph:3,// clase que se graficará en la consola, tando la class original como la filtrada
    }
};

var dirs = require('users/mapbiomasperu/mapbiomas-lulc:collection-3/modules/CollectionDirectories-cloud.js');
var paths = dirs.listpaths(param.pais);

var assetCollection = paths.classification;
var assetOutput = paths.clasificacionFiltros
var assetOutputMetadata = paths.filtrosMetadata
var assetRegions = paths.regionVector
// var regionesclassRaster = paths.regionCRaster
var AssetMosaic= [ paths.mosaics_c4_raisg,  paths.mosaics_c4_nexgen]

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
    2021, 2022, 2023];

var palette = require('users/mapbiomas/modules:Palettes.js').get('classification8');
var eePalettes = require('users/gena/packages:palettes');
var regions = ee.FeatureCollection(assetRegions)
    .filterMetadata('id_regionC', "equals", param.code_region);
var setVersion = function(item) { return item.set('version', 1) };
var regionRaster = regions
                      .map(setVersion)
                      .reduceToImage(['version'], ee.Reducer.first());
                      
// var regionRaster = ee.Image(regionesclassRaster).eq(param.code_region).selfMask();
var mosaicRegion = param.code_region.toString().slice(0, 3);
var mosaic = ee.ImageCollection(AssetMosaic[0]).merge(ee.ImageCollection(AssetMosaic[1]))
            .filterMetadata('region_code', 'equals', Number(mosaicRegion))
            .select(['swir1_median', 'nir_median', 'red_median']);

/**
 * Funcion para asignar una versión por ciclo
 * 
 */
// var getVersion = function (cicle) { 
//   var version = {
//     'ciclo-1': {
//       // Ciclo I
//         version_input:3,
//         version_output:4
//     },
//     'ciclo-2': {
//       // Ciclo II
//         version_input:10,
//         version_output:11
//     }
//   };
  
//   return version[cicle];
// }

/**
 * User defined functions
 */
var applyGapFill = function (image) {

    // apply the gap fill form t0 until tn
    var imageFilledt0tn = bandNames.slice(1)
        .iterate(
            function (bandName, previousImage) {

                var currentImage = image.select(ee.String(bandName));

                previousImage = ee.Image(previousImage);

                currentImage = currentImage.unmask(
                    previousImage.select([0]));

                return currentImage.addBands(previousImage);

            }, ee.Image(image.select([bandNames.get(0)]))
        );

    imageFilledt0tn = ee.Image(imageFilledt0tn);

    // apply the gap fill form tn until t0
    var bandNamesReversed = bandNames.reverse();

    var imageFilledtnt0 = bandNamesReversed.slice(1)
        .iterate(
            function (bandName, previousImage) {

                var currentImage = imageFilledt0tn.select(ee.String(bandName));

                previousImage = ee.Image(previousImage);

                currentImage = currentImage.unmask(
                    previousImage.select(previousImage.bandNames().length().subtract(1)));

                return previousImage.addBands(currentImage);

            }, ee.Image(imageFilledt0tn.select([bandNamesReversed.get(0)]))
        );


    imageFilledtnt0 = ee.Image(imageFilledtnt0).select(bandNames);

    return imageFilledtnt0;
};

// Obtiene la version de salida en base al ciclo
  // var version = getVersion(param.ciclo);
  var version_input = param.version_input;
  var version_output = param.version_output;

/**
 * 
 */

    
if(param.version_input < 10){
    var assetPath = assetCollection + '/' + param.pais + '-' + param.code_region;
    var image = ee.Image(assetPath  + '-' + version_input);
    print(assetPath  + '-' + version_input)
} else {
    var image = ee.ImageCollection(assetOutput)
                   .filterMetadata('code_region', 'equals', param.code_region)
                   .filterMetadata('version', 'equals', param.version_input)
                   .min()
}
print(image)

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
if(param.exclusion.years.length>0){
var yearmaskExcl = ee.Image(0)
param.exclusion.years.forEach(function(year){
  yearmaskExcl = yearmaskExcl.addBands(ee.Image(0).rename('classification_' + String(year)))
})
yearmaskExcl = yearmaskExcl.slice(1).selfMask()
print(yearmaskExcl)
  
}
// Map.addLayer(yearmaskExcl)
 
//--- inserta pixel mask para clase 27 ---
var original =image
if(param.exclusion.years.length>0){
image = image.addBands(yearmaskExcl, null, true)
  }
var classif = ee.Image();
var bandnameReg = image.bandNames();
bandnameReg.getInfo().forEach(
  function (bandName) {
    var imagey = image.select(bandName)
    var band0 = imagey.updateMask(imagey.unmask().neq(27))
    classif = classif.addBands(band0.rename(bandName))
  }
)
image =classif.select(bandnameReg);

// generate a histogram dictionary of [bandNames, image.bandNames()]
var bandsOccurrence = ee.Dictionary(
    bandNames.cat(image.bandNames()).reduce(ee.Reducer.frequencyHistogram())
);

// print(image);

// insert a masked band 
var bandsDictionary = bandsOccurrence.map(
    function (key, value) {
        return ee.Image(
            ee.Algorithms.If(
                ee.Number(value).eq(2),
                image.select([key]).byte(),
                ee.Image().rename([key]).byte().updateMask(image.select(0))
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


// generate image pixel years
var imagePixelYear = ee.Image.constant(years)
    .updateMask(imageAllBands)
    .rename(bandNames);

// apply the gap fill
var imageFilledtnt0 = applyGapFill(imageAllBands);
var imageFilledYear = applyGapFill(imagePixelYear);

// print(imageFilledtnt0);

//************************************************
// insert a masked band 
var bandsDictionaryTwo = bandsOccurrence.map(
    function (key, value) {
        return ee.Image(
            ee.Algorithms.If(
                ee.Number(value).eq(2),
                original.select([key]).byte(),
                ee.Image(27).rename([key]).byte().updateMask(image.select(0))
            )
        );
    }
);

// convert dictionary to image
var imageAllBandsTwo = ee.Image(
    bandNames.iterate(
        function (band, image) {
            return ee.Image(image).addBands(bandsDictionaryTwo.get(ee.String(band)));
        },
        ee.Image().select()
    )
);
//************************************************

var Class_Original = imageAllBandsTwo;
var Class_Filtrada = imageFilledtnt0.select(bandNames);
//Excluir clase y años 
// Classes Exclude in gapfill
  if(param.exclusion.clases.length>0){

        param.exclusion.clases.forEach(function(clase){
          Class_Filtrada = Class_Filtrada.where(Class_Filtrada.eq(clase),Class_Original)
                                         
        })
        print('Clases excluidos en el Filtro temporal', param.exclusion.clases);
  }

// Year Exclude
  if(param.exclusion.years.length>0){
    // var yearExlud = Class_Original.select(bandNamesExclude);  //addbands
    var yearExlud = original.select(bandNamesExclude);  //addbands

    Class_Filtrada =  Class_Filtrada.addBands(yearExlud,null,true); // Remplaza las clases a no modificar
    print('Años excluidos en el Filtro temporal', param.exclusion.years);
  }
  
imageFilledtnt0 =Class_Filtrada.select(bandNames)

/**
* Export images to asset
*/
var imageName = param.pais + '-' + param.code_region + '-' + version_output;

imageFilledtnt0 = imageFilledtnt0.select(bandNames)
        .set('code_region', param.code_region)
        .set('pais', param.pais)
        .set('version', version_output)
        .set('descripcion', 'gapfill')
        .set('paso', 'P06');
        
print('Gapfill Asset',imageFilledtnt0);

Export.image.toAsset({
    'image': imageFilledtnt0,
    'description': imageName,
    'assetId': assetOutput   + '/' +  imageName,
    'pyramidingPolicy': {
        '.default': 'mode'
    },
    'region': regions.geometry().bounds(),
    'scale': 30,
    'maxPixels': 1e13
});

var imageNameGapFill = param.pais + '-' + param.code_region + '-' + version_output + '-metadata';

imageFilledYear = imageFilledYear.set('code_region', param.code_region)
                                .set('pais', param.pais)
                                .set('version', version_output)
                                .set('descripcion', 'gapfill metadata')
                                .set('paso', 'P06');
                                
print('Gapfill metadata',imageFilledYear)


Export.image.toAsset({
    'image': imageFilledYear,  
    'description': imageNameGapFill,
    'assetId': assetOutputMetadata + '/' + imageNameGapFill,
    'pyramidingPolicy': {
        '.default': 'mode'
    },
    'region': regions.geometry().bounds(),
    'scale': 30,
    'maxPixels': 1e13
});

// Exportar a Google Drive
if(param.ExportOpcion.exportClasifToDrive){
  Export.image.toDrive({
    image: imageFilledtnt0.select(bandNames).toInt8(),
    description: imageName + '-DRIVE',
    folder: param.ExportOpcion.DriveFolder,
    scale: 30,
    maxPixels: 1e13,
    region: regions.geometry().bounds()
  });
}



/**
* Layers
*/

for (var yearI= 0; yearI<param.year.length; yearI++){
var vis = {
    'bands': ['classification_' + param.year[yearI]],
    'min': 0,
    'max': 62,
    'palette': palette,
    'format': 'png'
};
Map.addLayer(mosaic.filterMetadata('year', 'equals', param.year[yearI])
                   .mosaic()
                   .updateMask(regionRaster), {
      'bands': ['swir1_median', 'nir_median', 'red_median'],
      'gain': [0.08, 0.06, 0.08],
      'gamma': 0.65
  }, 'mosaic-'+param.year[yearI], false)
  
Map.addLayer(
    original,
    vis,
    'clasificacion original ' + param.year[yearI], false);

Map.addLayer(
    imageFilledtnt0.select(bandNames),
    vis,
    'clasificacion gap fill ' + param.year[yearI], false);


}


Map.addLayer(
    regions.style({
        "color": "ff0000",
        "fillColor": "ff000000"
    }),
    {
        "format": "png"
    },
    'Region ' + param.code_region,
    false);
    
    

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
      description: 'ESTADISTICAS-DE-COBERTURA',
      fileFormat: 'CSV',
      folder: 'P09-GapFill-CLASSIFICATION'
    });
      
  });
  
}
// Generar estadísticas de cobertura
if(param.ExportOpcion.exportEstadistica){
  var areasResult = getAreas(imageFilledtnt0.select(bandNames), regions)
}


// Función para enmascarar valores distintos al especificado
function enmascararValor(banda) {
  return imageFilledtnt0.select([banda]).eq(param.Graficar.claseGraph)
               .multiply(ee.Image.pixelArea()).divide(10000); 
}

var year = ee.List.sequence(1985, 2023); 
var areasPorAño = year.map(function(año) {
  var nombreBanda = ee.String('classification_').cat(ee.Number(año).int().format());
  var area = enmascararValor(nombreBanda).reduceRegion({
    reducer: ee.Reducer.sum(),
    geometry: imageFilledtnt0.geometry(),
    scale: 250, 
    maxPixels: 1e9
  });
  return ee.Number(area.get(nombreBanda)).round(); 
});

print('areas por año:', areasPorAño)


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

print('Grafico de areas por clase - escala 250m :', chart);

