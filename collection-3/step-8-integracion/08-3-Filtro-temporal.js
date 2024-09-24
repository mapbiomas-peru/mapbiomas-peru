/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = 
    /* color: #d63000 */
    /* shown: false */
    ee.Geometry.Polygon(
        [[[-83.47741293168657, -0.10766761358224534],
          [-83.56233352575742, -18.393598929072468],
          [-66.15998977575742, -18.81009307760673],
          [-66.68733352575742, 0.3543331339911832],
          [-81.62873977575742, 0.442221626949172]]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// FILTRO TEMPORAL

// Parámetros y Configuración
var param = {
    codesAndVersions: [
        [70305, 2],  
        [70310, 2], 
    ],
    pais: 'PERU', 
    years: [2000, 2022],  // Solo visualización
    version_output: 21,  // Versión de salida
    exportOpcion: {
        DriveFolder: 'DRIVE-EXPORT',  // Carpeta a exportar archivo drive
        exportClasifToDrive: false,   // Exporta clasificaciones a drive
        exportEstadistica: false      // Exporta áreas
    },
    exclusion: {  // Clases y años a excluir en el filtro
        clases: [],
        years: []
    },
    Graficar: { 
        claseGraph: 12  // Clase a graficar en la consola
    },
    piramide:true
};

// Lista de prioridades de ejecución del filtro temporal
var ordem_exec_first = [12, 34, 11];
var ordem_exec_last = [15, 25, 13, 3];
var ordem_exec_middle = [11, 15, 25, 13, 3, 12, 34, 33];

// Años a considerar
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
    2021, 2022, 2023
];


// Paths y Assets
var dirs = require('users/mapbiomasperu/mapbiomas-lulc:collection-3/modules/CollectionDirectories.js');
var paths = dirs.listpaths(param.pais);

var dirinput = 'projects/mapbiomas-raisg/MAPBIOMAS-PERU/COLECCION3/INTEGRACION/integracion-region'
var dirout = 'projects/mapbiomas-raisg/MAPBIOMAS-PERU/COLECCION3/INTEGRACION/integracion-region';

var regionesclass = 'projects/mapbiomas-raisg/MAPBIOMAS-PERU/DATOS-AUXILIARES/VECTORES/per-regiones-clasificacion-mbperu-3'
var regionesclassRaster = 'projects/mapbiomas-raisg/MAPBIOMAS-PERU/DATOS-AUXILIARES/RASTER/per-regiones-clasificacion-mbperu-3'
var regionesMosaicRaster = 'projects/mapbiomas-raisg/DATOS_AUXILIARES/RASTERS/mosaico-regiones-4' 

var dirs = require('users/mapbiomasperu/mapbiomas-lulc:collection-3/modules/CollectionDirectories.js');
var paths = dirs.listpaths(param.pais);
var dirTransv = paths.transversales;

var AssetMosaic = [paths.mosaics_c4_raisg, paths.mosaics_c4_nexgen];

// Get Mosaic
var regionMosaicRaster = ee.Image(regionesMosaicRaster)

var MosaicoCollection = ee.ImageCollection(AssetMosaic[0]).merge(ee.ImageCollection(AssetMosaic[1]))
                          .filter(ee.Filter.inList('year',param.years))
                          .filterMetadata('country', 'equals', param.pais)
                          .select(['swir1_median', 'nir_median', 'red_median'])
                          .map(
                              function (image) {
                                  return image.updateMask(
                                      regionMosaicRaster.eq(ee.Number.parse(image.get('region_code')).toInt16()));
                              }
                          );
                          
// get band names list 
var years = ee.List.sequence(1985,2023).getInfo()
var bandNames = ee.List(
    years.map(
        function (year) {
            return 'classification_' + String(year);
        }
    )
);

var palettes = require('users/mapbiomas/modules:Palettes.js').get('classification8');
var vis = {
    'min': 0,
    'max': 62,
    'palette': palettes
};


// Funciones de máscara para el filtro temporal
var mask3 = function(valor, ano, imagem) {
    var mask = imagem.select('classification_' + (parseInt(ano) - 1)).eq(valor)
        .and(imagem.select('classification_' + ano).neq(valor))
        .and(imagem.select('classification_' + (parseInt(ano) + 1)).eq(valor));
    var muda_img = imagem.select('classification_' + ano).mask(mask.eq(1)).where(mask.eq(1), valor);  
    var img_out = imagem.select('classification_' + ano).blend(muda_img);
    return img_out;
};
    
var anos3 = [
  '1986', '1987', '1988', '1989', '1990', '1991', '1992', '1993', '1994', '1995',
  '1996', '1997', '1998', '1999', '2000', '2001', '2002', '2003', '2004', '2005',
  '2006', '2007', '2008', '2009', '2010', '2011', '2012', '2013', '2014', '2015',
  '2016', '2017', '2018', '2019', '2020', '2021', '2022'];
  
var window3years = function(imagem, valor){
   var img_out = imagem.select('classification_1985')
   for (var i_ano=0;i_ano<anos3.length; i_ano++){  
     var ano = anos3[i_ano];   
     img_out = img_out.addBands(mask3(valor,ano, imagem)) }
     img_out = img_out.addBands(imagem.select('classification_2023'))
   return img_out
}


var mask3first = function(valor, imagem){
  var mask = imagem.select('classification_1985').neq (valor)
        .and(imagem.select('classification_1986').eq(valor))
        .and(imagem.select('classification_1987').eq (valor))
  var muda_img = imagem.select('classification_1985').mask(mask.eq(1)).where(mask.eq(1), valor);  
  var img_out = imagem.select('classification_1985').blend(muda_img)
  img_out = img_out.addBands([imagem.select('classification_1986'),
                              imagem.select('classification_1987'),
                              imagem.select('classification_1988'),
                              imagem.select('classification_1989'),
                              imagem.select('classification_1990'),
                              imagem.select('classification_1991'),
                              imagem.select('classification_1992'),
                              imagem.select('classification_1993'),
                              imagem.select('classification_1994'),
                              imagem.select('classification_1995'),
                              imagem.select('classification_1996'),
                              imagem.select('classification_1997'),
                              imagem.select('classification_1998'),
                              imagem.select('classification_1999'),
                              imagem.select('classification_2000'),
                              imagem.select('classification_2001'),
                              imagem.select('classification_2002'),
                              imagem.select('classification_2003'),
                              imagem.select('classification_2004'),
                              imagem.select('classification_2005'),
                              imagem.select('classification_2006'),
                              imagem.select('classification_2007'),
                              imagem.select('classification_2008'),
                              imagem.select('classification_2009'),
                              imagem.select('classification_2010'),
                              imagem.select('classification_2011'),
                              imagem.select('classification_2012'),
                              imagem.select('classification_2013'),
                              imagem.select('classification_2014'),
                              imagem.select('classification_2015'),
                              imagem.select('classification_2016'),
                              imagem.select('classification_2017'),
                              imagem.select('classification_2018'),
                              imagem.select('classification_2019'),
                              imagem.select('classification_2020'),
                              imagem.select('classification_2021'),
                              imagem.select('classification_2022'),
                              imagem.select('classification_2023')])
  return img_out;
}

var mask3last = function(valor, imagem){
  var mask = imagem.select('classification_2021').eq (valor)
        .and(imagem.select('classification_2022').eq(valor))
        .and(imagem.select('classification_2023').neq (valor))
  var muda_img = imagem.select('classification_2023').mask(mask.eq(1)).where(mask.eq(1), valor);  
  var img_out = imagem.select('classification_1985')
  img_out = img_out.addBands([imagem.select('classification_1986'),
                              imagem.select('classification_1987'),
                              imagem.select('classification_1988'),
                              imagem.select('classification_1989'),
                              imagem.select('classification_1990'),
                              imagem.select('classification_1991'),
                              imagem.select('classification_1992'),
                              imagem.select('classification_1993'),
                              imagem.select('classification_1994'),
                              imagem.select('classification_1995'),
                              imagem.select('classification_1996'),
                              imagem.select('classification_1997'),
                              imagem.select('classification_1998'),
                              imagem.select('classification_1999'),
                              imagem.select('classification_2000'),
                              imagem.select('classification_2001'),
                              imagem.select('classification_2002'),
                              imagem.select('classification_2003'),
                              imagem.select('classification_2004'),
                              imagem.select('classification_2005'),
                              imagem.select('classification_2006'),
                              imagem.select('classification_2007'),
                              imagem.select('classification_2008'),
                              imagem.select('classification_2009'),
                              imagem.select('classification_2010'),
                              imagem.select('classification_2011'),
                              imagem.select('classification_2012'),
                              imagem.select('classification_2013'),
                              imagem.select('classification_2014'),
                              imagem.select('classification_2015'),
                              imagem.select('classification_2016'),
                              imagem.select('classification_2017'),
                              imagem.select('classification_2018'),
                              imagem.select('classification_2019'),
                              imagem.select('classification_2020'),
                              imagem.select('classification_2021'),
                              imagem.select('classification_2022')]);
  img_out = img_out.addBands(imagem.select('classification_2023').blend(muda_img));
  return img_out;
};


// Integración de Regiones y Aplicación del Filtro Temporal
var integracion_coll = ee.List([])
var integracion_gener = ee.List([])
var filtered = ee.Image([]);

param.codesAndVersions.forEach(function(codeAndVersion) {
    var region = codeAndVersion[0];
    var versionRegion = codeAndVersion[1];
    
    var ClassGeneralList = ee.ImageCollection(dirinput)
                      .filterMetadata('version', 'equals', versionRegion)
                      .mosaic()
                      .byte();
    print(ClassGeneralList)
    
    integracion_gener = integracion_gener.add(ClassGeneralList)

    var regionsRaster = ee.Image(regionesclassRaster).eq(region).selfMask();    

    var regioV = ee.FeatureCollection(regionesclass)
                    .filterMetadata("id_regionC","equals", region);

    filtered = ClassGeneralList
    
    for (var i_class=0;i_class<ordem_exec_first.length; i_class++){
      var id_class = ordem_exec_first[i_class]; 
      filtered = mask3first(id_class, filtered)
    }
    
    for (var i_class=0;i_class<ordem_exec_last.length; i_class++){
      var id_class = ordem_exec_last[i_class]; 
      filtered = mask3last(id_class, filtered)
    }

    for (var i_class=0;i_class<ordem_exec_middle.length; i_class++){  
      var id_class = ordem_exec_middle[i_class]; 
      filtered = window3years(filtered, id_class)
    }
    
    filtered = filtered.set('code_region', region)
                      .set('pais', param.pais)
                      .set('version', param.version_output)
                      .set('descripcion', 'FTemporal-region');
    var prefixo_out = param.pais+ '-' + region + '-' + param.version_output;
                  
    Export.image.toAsset({
    'image': filtered, 
    'description': prefixo_out,
    'assetId': dirout+'/'+ prefixo_out,
    'pyramidingPolicy': {
        '.default': 'mode'
    },
    'region': regioV.geometry().bounds(),
    'scale': 30,
    'maxPixels': 1e13
  });
    
  integracion_coll = integracion_coll.add(filtered);
  print(integracion_coll, 'integracion_coll')
  if(param.exportArea) {
    var patchAreaCalc = require('users/raisgmb01/projects-mapbiomas:mapbiomas-peru/collection-5/modules/CalcularAreaRaster.js');
    patchAreaCalc.Clasif_Area_Calc(filtered, bandNames.getInfo(), 30, regionsRaster, 'Area_IntegracionCol3_pe_Ftemp', 'Area-'+prefixo_out); // Cambiado de integracion_v1 a integracion_list_remap
  }

});

var integra = ee.ImageCollection(integracion_gener).mosaic()

var listReg = ee.List([]);
param.codesAndVersions.forEach(function(codeAndVersion) {
    var region = codeAndVersion[0];
    listReg = listReg.add(region);
});
print('listReg', listReg);
var regionsRasterList = ee.List(listReg).map( function(regionOne){
  var regionR = ee.Image(regionesclassRaster).eq(ee.Number.parse(regionOne)).selfMask();
  return regionR;
});

print(regionsRasterList, 'regionsRasterList')
regionsRasterList = ee.ImageCollection(regionsRasterList).mosaic()


for (var yearI=0;yearI<param.years.length;yearI++) {
  
  var vis = {
    'bands': 'classification_'+param.years[yearI],
    'min': 0,
    'max': 62,
    'palette': palettes
    
  };

    Map.addLayer(
      MosaicoCollection.filterMetadata('year', 'equals', param.years[yearI])
                      .mosaic().updateMask(regionsRasterList),
      {
        'bands': ['swir1_median', 'nir_median', 'red_median'],
        'gain': [0.08, 0.06, 0.08],
        'gamma': 0.65
      },
      'Mosaic' + '-' + param.years[yearI],
      false
    );

  if(param.piramide){
    Map.addLayer(
      integra,
      vis, 'integracionOriginal' + '-' + param.years[yearI], false
    )
    Map.addLayer(
      filtered,
      vis, 'integracion' + '-remap-' + param.years[yearI], false
    )
  } else {
    Map.addLayer(
      integracion_list.reproject('EPSG:4326', null, 30),
      vis, 'integracion' + '-' + param.years[yearI], false
    )
  }
}

// Función para generar las estadísticas de cobertura por año y clase
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
    bandNames.evaluate(function(bands, error) {
        if (error) print(error.message);
        var yearsAreas = [];
        bands.forEach(function(band) {
            var year = ee.String(band).split('_').get(1),
                yearImage = image.select([band]);
            var covers = classIds.map(function(classId) {
                classId = ee.Number(classId).int8();
                var yearCoverImage = yearImage.eq(classId),
                    coverArea = yearCoverImage.multiply(pixelArea).divide(1e6);
                return coverArea.reduceRegion(reducer).get(band);
            }).add(year);
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
            var dict = ee.Dictionary.fromLists(keys, covers);
            yearsAreas.push(ee.Feature(null, dict));
        });
        yearsAreas = ee.FeatureCollection(yearsAreas);
        Export.table.toDrive({
            collection: yearsAreas,
            description: 'ESTADISTICAS-DE-COBERTURA-' + prefixo_out + param.version_output,
            fileFormat: 'CSV',
            folder: 'P10-FiltroTempor-CLASSIFICATION'
        });
    });
}

// Generar estadísticas de cobertura (si está habilitado)
if (param.exportOpcion.exportEstadistica) {
    getAreas(filtered, integrated);
}

// Función para seleccionar la clase a graficar
function enmascararValor(image, banda) {
  return image.select([banda]).eq(param.Graficar.claseGraph)
               .multiply(ee.Image.pixelArea()).divide(10000); // Convierte el área de m² a hectáreas
}

// GRAFICO ORIGINAL:
var areasPorAño0 = years.map(function(año) {
  var nombreBanda = ee.String('classification_').cat(ee.Number(año).int().format());
  var area0 = enmascararValor(integra, nombreBanda).reduceRegion({
    reducer: ee.Reducer.sum(),
    geometry: geometry,
    scale: 250, // Ajusta según la resolución de tu imagen
    maxPixels: 1e9
  });
  return ee.Number(area0.get(nombreBanda)).round(); // Redondea el resultado a hectáreas
});

var chart0 = ui.Chart.array.values({
  array: ee.Array(areasPorAño0),
  axis: 0,
  xLabels: years
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

// GRAFICO FILTRO
var areasPorAño = years.map(function(año) {
  var nombreBanda = ee.String('classification_').cat(ee.Number(año).int().format());
  var area = enmascararValor(filtered, nombreBanda).reduceRegion({
    reducer: ee.Reducer.sum(),
    geometry: geometry,
    scale: 250, // Ajusta según la resolución de tu imagen
    maxPixels: 1e9
  });
  return ee.Number(area.get(nombreBanda)).round(); // Redondea el resultado a hectáreas
});

var chart = ui.Chart.array.values({
  array: ee.Array(areasPorAño),
  axis: 0,
  xLabels: years
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

var assetregionVectors= paths.regionVector
var RegionVector = ee.FeatureCollection(assetregionVectors)

Map.addLayer(RegionVector.style({fillColor: '00000000',color:'black', width: 1}), {}, 'RegionVector')

