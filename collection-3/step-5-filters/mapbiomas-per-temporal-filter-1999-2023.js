var param = {
    code_region: 70206,  //Region de Clasificacion
    pais: 'PERU', 
    year: [2000,2022, 2023],  // Solo visualizacion
    // ciclo: 'ciclo-1',
    version_input:21, // 
    version_output:22,// 
    exportOpcion: {   // Opciones para exportar
      DriveFolder: 'DRIVE-EXPORT',  // carpeta a exportar archivo drive
      exportClasifToDrive:  false, // exporta clasificaciones a drive (true or false)
      exportEstadistica: false, // Exporta Areas (true or false)
    },
    exclusion:{  // Indicar en la lista las clases y años a excluir en el filtro
      clases : [],  //lista de clases a excluir en todos los años
      years  : [],  //lista de años a excluir con todas la clases
    }
};

 
//---------------------ORDEN DE PRIORIDAD DE EJECUCIÓN-----------------------
// Ejemplo si se pasa 3  caso: FF NV FF NV FF NV FF =  FF FF FF FF FF FF FF   La prioridad de mantener la clase será la clase a pasar primero
var ordem_exec_first =  [3, 4, 6, 12, 11, 13];              //Filtro de primer año
var ordem_exec_last =   [21];                               //Filtro de ultimo año
var ordem_exec_middle = [33, 13, 4, 29, 21, 3, 12, 22,34];  //Filtro de años intermedios

//--------------------------------------------

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
  var prefixo_out = param.pais+ '-' + param.code_region + '-' 

////*************************************************************
// Do not Change from these lines
////*************************************************************

var palettes = require('users/mapbiomas/modules:Palettes.js');
var vis = {
    'min': 0,
    'max': 62,
    'palette': palettes.get('classification8')
};
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
if(param.version_input < 10){
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

//--- inserta pixel 27 en vez de mask---
var classif = ee.Image();

bandNames.getInfo().forEach(
  function (bandNames) {
    var image = image_FE.select(bandNames)
    var band0 = ee.Image(27).updateMask(regionRaster)
    band0 = band0.where(image.gte(0),image)
    classif = classif.addBands(band0.rename(bandNames))
  }
)
image_FE =classif.select(bandNames);

//----

var mask3 = function(valor, ano, imagem){
  var mask = imagem.select('classification_'+ (parseInt(ano) - 1)).eq (valor)
        .and(imagem.select('classification_'+ (ano)              ).neq(valor))
        .and(imagem.select('classification_'+ (parseInt(ano) + 1)).eq (valor))
  var muda_img = imagem.select('classification_'+ (ano)    ).mask(mask.eq(1)).where(mask.eq(1), valor);  
  var img_out = imagem.select('classification_'+ano).blend(muda_img)
  return img_out;
}

var mask4 = function(valor, ano, imagem){
  var mask = imagem.select('classification_'+ (parseInt(ano) - 1)).eq (valor)
        .and(imagem.select('classification_'+ (ano)              ).neq(valor))
        .and(imagem.select('classification_'+ (parseInt(ano) + 1)).neq(valor))
        .and(imagem.select('classification_'+ (parseInt(ano) + 2)).eq (valor))
  var muda_img  = imagem.select('classification_'+ (ano)              ).mask(mask.eq(1)).where(mask.eq(1), valor);  
  var muda_img1 = imagem.select('classification_'+ (parseInt(ano) + 1)).mask(mask.eq(1)).where(mask.eq(1), valor); 
  var img_out = imagem.select('classification_'+ano).blend(muda_img).blend(muda_img1)
  return img_out;
}

var mask5 = function(valor, ano, imagem){
  var mask = imagem.select('classification_'+ (parseInt(ano) - 1)).eq (valor)
        .and(imagem.select('classification_'+ (ano)              ).neq(valor))
        .and(imagem.select('classification_'+ (parseInt(ano) + 1)).neq(valor))
        .and(imagem.select('classification_'+ (parseInt(ano) + 2)).neq(valor))
        .and(imagem.select('classification_'+ (parseInt(ano) + 3)).eq (valor))
  var muda_img  = imagem.select('classification_'+ (ano)              ).mask(mask.eq(1)).where(mask.eq(1), valor);  
  var muda_img1 = imagem.select('classification_'+ (parseInt(ano) + 1)).mask(mask.eq(1)).where(mask.eq(1), valor);  
  var muda_img2 = imagem.select('classification_'+ (parseInt(ano) + 2)).mask(mask.eq(1)).where(mask.eq(1), valor);  
  var img_out = imagem.select('classification_'+ano).blend(muda_img).blend(muda_img1).blend(muda_img2)
  return img_out;
}

var anos3 = ['2000',
             '2001','2002','2003','2004','2005','2006','2007','2008','2009','2010','2011','2012','2013','2014','2015',
             '2016','2017','2018','2019','2020', '2021', '2022'];
var anos4 = ['2000',
             '2001','2002','2003','2004','2005','2006','2007','2008','2009','2010','2011','2012','2013','2014','2015',
             '2016','2017','2018','2019', '2020', '2021'];
var anos5 = ['2000',
             '2001','2002','2003','2004','2005','2006','2007','2008','2009','2010','2011','2012','2013','2014','2015',
             '2016','2017','2018','2019', '2020'];

var window5years = function(imagem, valor){
   var img_out = imagem.select('classification_1999')
   for (var i_ano=0;i_ano<anos5.length; i_ano++){  
     var ano = anos5[i_ano];  
     img_out = img_out.addBands(mask5(valor,ano, imagem)) }
     img_out = img_out.addBands(imagem.select('classification_2021'))
     img_out = img_out.addBands(imagem.select('classification_2022'))
     img_out = img_out.addBands(imagem.select('classification_2023'))
     img_out = img_out.addBands(imagem.select('classification_2024'))
   return img_out
}

var window4years = function(imagem, valor){
   var img_out = imagem.select('classification_1999')
   for (var i_ano=0;i_ano<anos4.length; i_ano++){  
     var ano = anos4[i_ano];  
     img_out = img_out.addBands(mask4(valor,ano, imagem)) }
     img_out = img_out.addBands(imagem.select('classification_2022'))
     img_out = img_out.addBands(imagem.select('classification_2023'))
     img_out = img_out.addBands(imagem.select('classification_2024'))
   return img_out
}

var window3years = function(imagem, valor){
   var img_out = imagem.select('classification_1999')
   for (var i_ano=0;i_ano<anos3.length; i_ano++){  
     var ano = anos3[i_ano];   
     img_out = img_out.addBands(mask3(valor,ano, imagem)) }
     img_out = img_out.addBands(imagem.select('classification_2024'))
   return img_out
}

var filtered = image_FE

var mask3first = function(valor, imagem){
  var mask = imagem.select('classification_1999').neq (valor)
        .and(imagem.select('classification_2000').eq(valor))
        .and(imagem.select('classification_2001').eq (valor))
  var muda_img = imagem.select('classification_1999').mask(mask.eq(1)).where(mask.eq(1), valor);  
  var img_out = imagem.select('classification_1999').blend(muda_img)
  img_out = img_out.addBands([
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
                              imagem.select('classification_2023'),
                              imagem.select('classification_2024')])
  return img_out;
}

var mask3last = function(valor, imagem){
  var mask = imagem.select('classification_2020').eq (valor)
        .and(imagem.select('classification_2021').eq(valor))
        .and(imagem.select('classification_2022').neq (valor))
  var muda_img = imagem.select('classification_2022').mask(mask.eq(1)).where(mask.eq(1), valor);  
  var img_out = imagem.select('classification_1999')
  img_out = img_out.addBands([
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
                              imagem.select('classification_2023')]);
  img_out = img_out.addBands(imagem.select('classification_2024').blend(muda_img));
  return img_out;
};

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

for (var i_class=0;i_class<ordem_exec_middle.length; i_class++){  
   var id_class = ordem_exec_middle[i_class]; 
   filtered = window4years(filtered, id_class)
   filtered = window5years(filtered, id_class)
}

for (var i_class=0;i_class<ordem_exec_middle.length; i_class++){  
   var id_class = ordem_exec_middle[i_class]; 
   filtered = window3years(filtered, id_class)
}

//--- inserta pixel 0 para mask---
var classif = ee.Image();

bandNames.getInfo().forEach(
  function (bandNames) {
    var image = filtered.select(bandNames)
    var band0 = image.updateMask(image.unmask().gt(0))
    classif = classif.addBands(band0.rename(bandNames))
  }
)

var classif_FT = classif.select(bandNames)

//Excluir clase y años 
// Classes Exclude
if(param.exclusion.clases.length>0){
   var clasifi = ee.List([])
      
      param.exclusion.clases.forEach(function(clase){
        var clasif_code =image_FE.eq(clase).selfMask()
        clasifi = clasifi.add(image_FE.updateMask(clasif_code).selfMask())
      })
      
      clasifi = ee.ImageCollection(clasifi)
      clasifi = clasifi.max()
      Map.addLayer(clasifi,{},'clasific exclu_classe')
      classif_FT = classif_FT.blend(clasifi)
      print('Clases excluidos en el Filtro temporal', param.exclusion.clases);
}

// Year Exclude
if(param.exclusion.years.length>0){
  var yearExlud = image_FE.select(bandNamesExclude);  //addbands
  classif_FT =  classif_FT.addBands(yearExlud,null,true); // Remplaza las clases a no modificar
  print('Años excluidos en el Filtro temporal', param.exclusion.years);
}
  
filtered =classif_FT.select(bandNames)
                    .updateMask(regionRaster);

//----


for (var yearI=0;yearI<param.year.length;yearI++) {

var vis = {
    'bands': 'classification_'+param.year[yearI],
    'min': 0,
    'max': 34,
    'palette': palettes.get('classification2')
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
          .set('descripcion', 'filtro temporal')
          .set('paso', 'P07');
          
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
  
  // Exportar a Google Drive
  if(param.exportOpcion.exportClasifToDrive){
    Export.image.toDrive({
      image: filtered.toInt8(),
      description: prefixo_out + 'DRIVE-'+version_output,
      folder: param.exportOpcion.DriveFolder,
      scale: 30,
      maxPixels: 1e13,
      region: regioes.geometry().bounds()
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
      description: 'ESTADISTICAS-DE-COBERTURA-'+prefixo_out+version_output,
      fileFormat: 'CSV',
      folder: 'P10-FiltroTempor-CLASSIFICATION'
    });
      
  });
  
}

// Generar estadísticas de cobertura
if(param.exportOpcion.exportEstadistica){
  getAreas(filtered, regioes)
}
  