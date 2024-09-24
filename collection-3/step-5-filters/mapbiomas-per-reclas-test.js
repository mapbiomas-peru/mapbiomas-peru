/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var natural85_21 = 
    /* color: #d63000 */
    /* shown: false */
    ee.FeatureCollection(
        [ee.Feature(
            ee.Geometry.Polygon(
                [[[-75.06391627755904, -8.352393886653621],
                  [-75.06683452096725, -8.3532643189021],
                  [-75.06683452096725, -8.353285548932671],
                  [-75.07243497339034, -8.35986680272024]]]),
            {
              "original": "3,33",
              "new": "21,3",
              "t0": 2020,
              "t1": 2022,
              "system:index": "0"
            }),
        ee.Feature(
            ee.Geometry.Point([-75.06832920316064, -8.354727038411665]),
            {
              "original": "3,33",
              "new": "21,3",
              "t0": 2020,
              "t1": 2022,
              "system:index": "1"
            })]),
    de_12_15_a_11 = 
    /* color: #d63000 */
    /* shown: false */
    ee.FeatureCollection(
        [ee.Feature(
            ee.Geometry.Polygon(
                [[[-78.63317676676608, -6.71707453990804],
                  [-78.63249013905829, -6.719802190481026],
                  [-78.62596717613759, -6.7208250555247275],
                  [-78.62974362833393, -6.714005914676272]]]),
            {
              "original": 12,
              "new": 15,
              "t0": 1985,
              "t1": 1988,
              "system:index": "0"
            }),
        ee.Feature(
            ee.Geometry.Polygon(
                [[[-78.65444727889147, -6.678345578789656],
                  [-78.71212550154772, -6.753358310487042],
                  [-78.65307398787584, -6.821541616094415],
                  [-78.5411507701024, -6.819496257656913],
                  [-78.63041468611803, -6.67305630104089]]]),
            {
              "original": 12,
              "new": 15,
              "t0": 1985,
              "t1": 1988,
              "system:index": "1"
            })]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/


// remap
var param = {
    code_region: 70305,  //Region de Clasificacion
    pais: 'PERU', 
    year: [    1985, 1986, 1987, 1988,
    1989, 1990, 1991, 1992,
    1993, 1994, 1995, 1996,
    1997, 1998, 1999, 2000,
    2001, 2002, 2003, 2004,
    2005, 2006, 2007, 2008,
    2009, 2010, 2011, 2012,
    2013, 2014, 2015, 2016,
    2017, 2018, 2019, 2020, 
    2021, 2022, 2023],  // Solo visualizacion
    version_input:25, // 
    version_output:26,// 
    remapGeometry: [de_12_15_a_11],
    Graficar:{ 
      claseGraph:15,// clase que se graficará en la consola, tando la class original como la filtrada
    },
    AltitudeFilter:{
      UseAltitude: false,
      Altitude_thr: 2100,
      class_origin : 4, 
      class_reclass: 12
  },
};

var dirs = require('users/mapbiomasperu/mapbiomas-lulc:collection-3/modules/CollectionDirectories-cloud.js');
var paths = dirs.listpaths(param.pais);
var assetClasif = paths.classification;
var assetFiltros = paths.clasificacionFiltros
var dirout  = paths.clasificacionFiltros
var regionesclass = paths.regionVector
var AssetMosaic= [ paths.mosaics_c4_raisg,  paths.mosaics_c4_nexgen]

// Obtiene la version de salida en base al ciclo
  // var version = getVersion(param.ciclo);
  var version_input = param.version_input;
  var version_output = param.version_output;
  var prefixo_out = param.pais+ '-' + param.code_region + '-' 

////*************************************************************
// Do not Change from these lines
////*************************************************************

var palettes = require('users/mapbiomas/modules:Palettes.js').get('classification8');
var vis = {
    'min': 0,
    'max': 62,
    'palette': palettes
};
var GenaPalettes = require('users/gena/packages:palettes');
var regioes = ee.FeatureCollection(regionesclass)
                .filterMetadata("id_regionC","equals", param.code_region);
                
var setVersion = function(item) { return item.set('version', 1) };
var regionRaster = regioes
                      .map(setVersion)
                      .reduceToImage(['version'], ee.Reducer.first());

  
var mosaicRegion = param.code_region.toString().slice(0, 3);
var mosaic = ee.ImageCollection(AssetMosaic[0]).merge(ee.ImageCollection(AssetMosaic[1]))
            .filterMetadata('region_code', 'equals', Number(mosaicRegion))
            .select(['swir1_median', 'nir_median', 'red_median']);
var image_FE
if(param.version_input == 1 || param.version_input == 3){
    var assetPath = assetClasif + '/' + param.pais + '-' + param.code_region;
    image_FE = ee.Image(assetPath  + '-' + version_input);
   } else {
    image_FE = ee.ImageCollection(assetFiltros)
               .filterMetadata('code_region', 'equals', param.code_region)
               .filterMetadata('version', 'equals', version_input)
               .first()
   }
   
print(image_FE);

//-----
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
    //-----------------------------------------------------------------------------
      /** 
   * Slope FABDEM for filtering  
   * 
   */
   
  var FABDEM = ee.ImageCollection("projects/sat-io/open-datasets/FABDEM");
  var proj_FABDEM = FABDEM.first().select(0).projection();//.aside(print);
  var slopeFABDEM = ee.Terrain.slope(FABDEM.mosaic()
                               .setDefaultProjection(proj_FABDEM))
                               .rename('slope')
                               
  var paletteFABDEM = GenaPalettes.crameri.lajolla[50] 
  Map.addLayer(slopeFABDEM, {palette: paletteFABDEM}, 'slopeFABDEM', false)                             
  print(slopeFABDEM, 'slopeFABDEM')
  
         /** 
   * Altitude FABDEM for filtering  
   * 
   */
   
  var AltFabdem = FABDEM.mosaic().setDefaultProjection(proj_FABDEM)
  Map.addLayer(AltFabdem, {palette: paletteFABDEM}, 'AltitudeFABDEM', false)
  print(AltFabdem, 'AltitudeFABDEM')
// get band names list 
var bandNames = ee.List(
    years.map(
        function (year) {
            return 'classification_' + String(year);
        }
    )
);

// generate a histogram dictionary of [bandNames, image.bandNames()]
var bandsOccurrence = ee.Dictionary(
    bandNames.cat(image_FE.bandNames()).reduce(ee.Reducer.frequencyHistogram())
);

// print(bandsOccurrence);

// insert a masked band 
var bandsDictionary = bandsOccurrence.map(
    function (key, value) {
        return ee.Image(
            ee.Algorithms.If(
                ee.Number(value).eq(2),
                image_FE.select([key]).byte(),
                ee.Image().rename([key]).byte().updateMask(image_FE.select(0))
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

image_FE = imageAllBands
var filtered = image_FE;



/**
 * Función para remapear, de manera interactiva, zonas delimitadas por polígonos
 * Estos polígonos se dibujan con las herramientas de dibujo de GEE
 * y se definen como ee.FeatureCollection()
 */
function remapWithPolygons(imageYear, polygons, years) {
  
  if(polygons.length > 0) {  
    polygons.forEach(function( polygon ) {
      
      var excluded = polygon.map(function( layer ){
        
        var area = imageYear.clip(layer);
        var from = ee.String(layer.get('original')).split(',');
        var to = ee.String(layer.get('new')).split(',');
        
        var t0 = ee.Number.parse(layer.get('t0'));
        var t1 = ee.Number.parse(layer.get('t1'));
        var yearsSel = ee.List.sequence(t0,t1,1)

        from = from.map( function( item ){
          return ee.Number.parse( item );
        });
        to = to.map(function(item){
          return ee.Number.parse( item );
        });
        
        var remapRY = area;

        var imageOperation = function(year, previousImage) {
          var remapYear = area.select(ee.String('classification_').cat(ee.Number(year).toInt16()))
                              .remap(from, to)
                              .rename(ee.String('classification_').cat(ee.Number(year).toInt16()));
          
          return ee.Image(previousImage).addBands(remapYear, null, true);
        };
        
        remapRY = ee.Image(yearsSel.iterate(imageOperation, remapRY));
        
        return remapRY;
      });
      print('excluded',excluded);
      excluded = ee.ImageCollection( excluded ).mosaic();
      Map.addLayer(excluded, {}, 'excluded', false);
      
      imageYear = excluded.unmask( imageYear );
      imageYear = imageYear.mask( imageYear.neq(27) );
    });
  } else imageYear = imageYear;
  
  return imageYear;
  
}

// Exclusión de clases en areas delimitadas con geometrías
  var polygons = param.remapGeometry;
  filtered = remapWithPolygons(filtered, polygons, years);
  

  

    //Altitude Filter
    
    if(param.AltitudeFilter.UseAltitude){
      var altitudeCond = AltFabdem.gte(param.AltitudeFilter.Altitude_thr);
      
      img = img.where(img.eq(param.AltitudeFilter.class_origin)
                .and(altitudeCond.eq(1)), param.AltitudeFilter.class_reclass)
                .selfMask()
    }
    


filtered =filtered.select(bandNames)
                    .updateMask(regionRaster);

//----


for (var yearI=0;yearI<param.year.length;yearI++) {

var vis = {
    'bands': 'classification_'+param.year[yearI],
    'min': 0,
    'max': 62,
    'palette': palettes
};
Map.addLayer(mosaic.filterMetadata('year', 'equals', param.year[yearI])
                   .mosaic()
                   .updateMask(regionRaster), {
      'bands': ['swir1_median', 'nir_median', 'red_median'],
      'gain': [0.08, 0.06, 0.08],
      'gamma': 0.65
  }, 'mosaic-'+param.year[yearI], false);
  
Map.addLayer(image_FE, vis, 'original'+param.year[yearI],false);

Map.addLayer(filtered, vis, 'filtered'+param.year[yearI],false);
}

filtered = filtered
          .set('code_region', param.code_region)
          .set('pais', param.pais)
          .set('version', version_output)
          .set('descripcion', 'filtro reclas')
          .set('paso', 'P06');
          
print(filtered)
          
// EXPORTS 
  Export.image.toAsset({
      'image': filtered,
      'description': prefixo_out+version_output,
      'assetId': dirout+'/' +prefixo_out+version_output,
      'pyramidingPolicy': {
          '.default': 'mode'
      },
      'region': regioes.geometry().bounds(),
      'scale': 30,
      'maxPixels': 1e13
  });
  
// Función para seleccionar la clase a graficar
function enmascararValor(image, banda) {
  return image.select([banda]).eq(param.Graficar.claseGraph)
               .multiply(ee.Image.pixelArea()).divide(10000); // Convierte el área de m² a hectáreas
}

//GRAFICO ORIGINAL:
var year = ee.List.sequence(1985, 2023); // Ajusta los años según tus bandas
var areasPorAño0 = year.map(function(año) {
  var nombreBanda = ee.String('classification_').cat(ee.Number(año).int().format());
  var area0 = enmascararValor(image_FE, nombreBanda).reduceRegion({
    reducer: ee.Reducer.sum(),
    geometry: regioes.geometry(),
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
  colors: [palettes[param.Graficar.claseGraph]],
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
  var area = enmascararValor(filtered, nombreBanda).reduceRegion({
    reducer: ee.Reducer.sum(),
    geometry: regioes.geometry(),
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
  colors: [palettes[param.Graficar.claseGraph]],
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

 