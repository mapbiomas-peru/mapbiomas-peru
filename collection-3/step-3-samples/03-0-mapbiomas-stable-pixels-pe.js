/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var exclusion_30203_1 = 
    /* color: #d63000 */
    /* shown: false */
    ee.FeatureCollection(
        [ee.Feature(
            ee.Geometry.Polygon(
                [[[-68.42970717504, 3.2388939895940463],
                  [-68.38574332470961, 3.0797760772362697],
                  [-68.18242304551431, 3.074288576977067],
                  [-68.18242149211123, 3.1840282735559673]]]),
            {
              "original": "12,33",
              "new": "11,6",
              "system:index": "0"
            })]),
    exclusion_30203_2 = 
    /* color: #b3d63a */
    /* shown: false */
    ee.FeatureCollection(
        [ee.Feature(
            ee.Geometry.Polygon(
                [[[-67.63214821780117, 3.2801844400311544],
                  [-67.52777810061367, 3.351476016991634],
                  [-67.52228493655117, 3.4145373163835573],
                  [-67.62940163576992, 3.466628313286214],
                  [-67.69531960451992, 3.403570429199645]]]),
            {
              "original": 3,
              "new": 22,
              "system:index": "0"
            })]),
    natural85 = /* color: #d63000 */ee.FeatureCollection(
        [ee.Feature(
            ee.Geometry.Polygon(
                [[[-74.64943331013512, -11.47930434061534],
                  [-74.52583711872887, -11.447002798997197],
                  [-74.59999483357262, -11.4173898125842],
                  [-74.65217989216637, -11.39585115315023]]]),
            {
              "original": "3,",
              "new": "27,",
              "system:index": "0"
            })]),
    natural86 = /* color: #d3d61e */ee.FeatureCollection(
        [ee.Feature(
            ee.Geometry.Polygon(
                [[[-74.21944379273087, -4.824889198982332],
                  [-74.14253949585587, -4.813941713623335],
                  [-74.18373822632462, -4.745515954670814]]]),
            {
              "original": "3,22,6",
              "new": "27,27,34",
              "system:index": "0"
            })]),
    natural87 = /* color: #ce4fd6 */ee.FeatureCollection(
        [ee.Feature(
            ee.Geometry.Polygon(
                [[[-74.24396872296643, -11.69614900810988],
                  [-74.14509176984143, -11.674631746576221],
                  [-74.12861227765393, -11.569711237733213],
                  [-74.18354391827893, -11.615450675985958],
                  [-74.25770163312268, -11.583164791032253]]]),
            {
              "original": "3,21,11,",
              "new": "27,27,27,",
              "system:index": "0"
            })]),
    geometry = /* color: #d63000 */ee.FeatureCollection(
        [ee.Feature(
            ee.Geometry.Polygon(
                [[[-74.0813315068641, -12.062244180284583],
                  [-74.00649447482118, -12.043444555161882],
                  [-74.04906689305852, -12.014574669042501],
                  [-74.0827045499804, -11.952108370471802],
                  [-74.12459030654253, -12.007177200557393]]]),
            {
              "original": "3,33,",
              "new": "27,27,",
              "system:index": "0"
            })]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/

 
/** 
 * STEP 03-0: CÁLCULO DE PIXELES ESTABLES Y AREAS DE EXCLUSIÓN v3.2 
 * DOCUMENTACIÓN:
 * ----------------------------------------------------------------------------------------------
 */ 
/** 
 * PARAMETROS DE USUARIO:
 * Ajuste los parámetros a continuacón para generar la imagen de pixeles estables correspondiente
 * CUIDADO: considere que el proceso de exclusión con polígonos o shapes ocurré LUEGO
 * del remap y puede afectar el resultado generado por este último si los polígonos de
 * exclusión y las clases remapeadas se solapan.
 * ----------------------------------------------------------------------------------------------
 */
var param = {
  regionId: 70401,
  country: 'PERU',
  yearsPreview: [ 1986, 1987, 1990, 2000, 2022 ],
  remap: {
    from: [3, 4, 5, 6, 9, 11, 12, 13, 14, 15, 18, 19, 20, 21, 22, 23, 24, 25, 26, 29, 30, 31, 32, 33, 34, 35, 68],
    to:   [3,	4,5,	6,9,	11,	12,	13,	21,	21,	21,	19,	20,	21,	22,	23,	25,	29,	26,	29,	25,	31,	32,	33,	34,35, 68]
  },
  yearsStable : [1985,2022], // Periodo año inicio y año de fin
  exclusion : {
    years: [
     // 1987, 1989
    ],
    classes: [ ],
    polygons: [ natural85, natural86, natural87, geometry ],
    shape: '',
  },
  driveFolder: 'DRIVE-EXPORT',
  ciclo: 'ciclo-1',
  version:1
};

/**
 * IMPLEMETACIÓN DE LA APLICACIÓN
 * Self invoked expresion que ejecuta el paso 2 de la metodología
 * ----------------------------------------------------------------------------------------------
 */
var dirs = require('users/mapbiomasperu/mapbiomas-lulc:collection-3/modules/CollectionDirectories-cloud.js');
var paths = dirs.listpaths(param.country);

(function init(param) {
  print(paths.mensaje)  
  var assets = {
    basePath: paths.pixelesEstables, 
    regions: paths.regionVectorBuffer,
    mosaics:[ paths.mosaics_c4_raisg,  paths.mosaics_c4_nexgen],
    image: paths.collection2_PE,
    canopy_height :'users/nlang/ETH_GlobalCanopyHeight_2020_10m_v1'
  };
  
  
  // Obtener la version de salida en base al ciclo
  var version = getVersion(param.ciclo);

  // Crear máscara con base en el vector de región
  var regionId = param.regionId;
  var region = getRegion(assets.regions, '', regionId);
  var regionMask = region.rasterMask;
  
  print(region.vector)
    
  var country = region.vector.first().get('pais').getInfo().toUpperCase();
  country = country .replace('Ú', 'U').replace(' ', '_');
  var countryRegion = country + '-' + regionId;


  // Exclusión de áreas
  var shapePath = assets.basePath + country + '/';
  var shapeName = param.exclusion.shape;
  var fullRegion = excludeAreas(regionMask, shapePath, shapeName);
  
  
  // Extraer la classificación, ignorando años con inconsistencias.
  var image = ee.Image(assets.image).updateMask(fullRegion);
  image = selectBands(image,param.yearsStable)

  image = ExclusionBands(image, param.exclusion.years);
  print('Años usados', image.bandNames());

  // Remapeo de clases
  var originalClasses = param.remap.from;
  var newClasses = param.remap.to;
  image = remapBands(image, originalClasses, newClasses);
  

  // Generar pixeles estables
  var classes = ee.List.sequence(1, 34);
  classes = classes.removeAll(param.exclusion.classes).getInfo();
  var stablePixels = getStablePixels(image, classes);

  

  // Exclusión de clases en areas delimitadas con geometrías
  var polygons = param.exclusion.polygons;
  stablePixels = remapWithPolygons(stablePixels, polygons);
  
  
  // Importar mosaicos para visualización
  var assetsMosaics = assets.mosaics;
  var variables = ['nir_median', 'swir1_median', 'red_median'];
  var mosaics = getMosaic(assetsMosaics, param.regionId, variables, '');
  // print(mosaics)

  // Mostrar imagenes en el mapa
  var assetData = {
    asset: assets.image,
    region: region,
    years: param.yearsPreview    
  };
  
  addLayersToMap(stablePixels, mosaics, assetData);
  
  // Exportar assets a GEE y Google Drive
  var imageName = 'ME-'+ countryRegion + '-' + param.version;
  var assetId = assets.basePath + imageName;
  var driveFolder = param.driveFolder;
  var vector = region.vector;

  var props = {
    code_region: param.regionId,
    pais: country,
    version: version.toString(),
    paso: 'P02'
  };

  stablePixels = stablePixels.set(props);
  exportImage(stablePixels, imageName, assetId, vector, driveFolder);
  
})(param);

/**
 * FUNCIONALIDADES
 * A continuación se definen las funciones que se usan en la aplicación.
 * ----------------------------------------------------------------------------------------------
 */

/**
 * Funcion para asignar una versión por ciclo
 * 
 */
function getVersion(cicle) { 
  var version = {
    'ciclo-1': 1,
    'ciclo-2': 2
  };
  
  return version[cicle];
}
/**
 * Función para remapear (reclasificar) clases según sea necesario
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
 * Función para delimitar áreas de excusión en las que no se tomarán 
 * muestra de entrenamiento. 
 * Estas áreas pueden incluirse como polígonos desde las herramientas de 
 * dibujo o como una colección de tipo ee.FeatureCollection() ubicada en la ruta
 * establecida en el parámetro exclusion.shape.
 */
function excludeAreas(image, shapePath, shapeName) {
  var exclusionRegions;
  
  var shapes = shapePath !== '' && shapeName !== '';
    
  if(shapes)
    exclusionRegions = ee.FeatureCollection(shapePath + shapeName);
  
  else exclusionRegions = null;

  
  // Excluir todas las areas definidas
  if(exclusionRegions !== null) {
    var setVersion = function(item) { return item.set('version', 1) };
  
    exclusionRegions = exclusionRegions
      .map(setVersion)
      .reduceToImage(['version'], ee.Reducer.first())
      .eq(1);
    
    return image.where(exclusionRegions.eq(1), 0)
      .selfMask();
  } 
  else return image;
}
/**
 * Función para remapear, de manera interactiva, zonas delimitadas por polígonos
 * Estos polígonos se dibujan con las herramientas de dibujo de GEE
 * y se definen como ee.FeatureCollection()
 */
function remapWithPolygons(stablePixels, polygons) {
  
  if(polygons.length > 0) {
    polygons.forEach(function( polygon ) {
      
      var excluded = polygon.map(function( layer ){
        
        var area = stablePixels.clip( layer );
        var from = ee.String(layer.get('original')).split(',');
        var to = ee.String(layer.get('new')).split(',');
        
        from = from.map( function( item ){
          return ee.Number.parse( item );
        });
        to = to.map(function(item){
          return ee.Number.parse( item );
        });
        
        return area.remap(from, to);
      });
        
      excluded = ee.ImageCollection( excluded ).mosaic();
      stablePixels = excluded.unmask( stablePixels ).rename('reference');
      stablePixels = stablePixels.mask( stablePixels.neq(27) );
    });
  } else stablePixels = stablePixels;
  
  return stablePixels;
  
}
/**
 * Función para seleccionar las bandas con base en los años definidos en
 * los parámetros
 */
function ExclusionBands(image, years) {
  var bandNames = [];
  
  years.forEach(function(year) {
    bandNames.push('classification_' + year);
  });
  
  return ee.Image(
    ee.Algorithms.If(
      years.length === 0, 
      image, 
      image.select(image.bandNames().removeAll(bandNames))
    )  
  );
}
/**
 * Función para seleccionar las bandas con base en los años definidos en
 * los parámetros
 */
function selectBands(image, years) {
  var bandNames = [];
  
  var y = ee.List.sequence(years[0], years[1], 1).getInfo()
  
  y.forEach(function(year) {
    bandNames.push('classification_' + year);
  });
  
  return ee.Image(image.select(bandNames))
}
/**
 * Función para generar region de interés (ROI) con base en
 * las región de clasificación o una grilla millonésima contenida en ella
 */
function getRegion(regionPath, regionImagePath, regionId){
  
  var region = ee.FeatureCollection(regionPath)
                 .filterMetadata("id_regionC", "equals", regionId);
  
  //var regionMask = ee.Image(regionImagePath).eq(regionId).selfMask();
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
function getMosaic(paths, regionId, variables, gridName) {
  
  // Importar datos de altitud
  var altitude = ee.Image('JAXA/ALOS/AW3D30_V1_1')
    .select('AVE')
    .rename('altitude');
      
  var slope = ee.Terrain.slope(altitude).int8()
    .rename('slope');
  
  // Gestionar mosaicos Landsat
  var mosaicRegion = regionId.toString().slice(0, 3);

  var mosaics = paths.map( function(path) {
    
    var mosaic = ee.ImageCollection(path)
      .filterMetadata('region_code', 'equals', Number(mosaicRegion))
      .map(function(image) {
        var index = ee.String(image.get('system:index')).slice(0, -3);
        return image.set('index', index);
      });
    
    if(gridName && gridName !== '')
      mosaic = mosaic
        .filterMetadata('grid_name', 'equals', gridName);
    else
      mosaic = mosaic;
    
    if(mosaic.size().getInfo() !== 0) return mosaic;
    
  });
  
  mosaics = mosaics.filter( function(m) { return m !== undefined });

  var joinedMosaics = mosaics[0].merge(mosaics[1]);

  // seleccionar variables
  if(variables.length > 0) return joinedMosaics.select(variables);
  
  else return joinedMosaics;

}
/**
 * Función para extracción de pixeles estables
 * Esta función toma dos parámetros. La imagen de la clasificación y las clases que
 * se quieren obtener como salida
 */
function getStablePixels(image, classes) {
  
  var bandNames = image.bandNames(),
      images = [];

  classes.forEach(function(classId){
      var previousBand = image
        .select([bandNames.get(0)]).eq(classId);
          
      var singleClass = ee.Image(
        bandNames.slice(1)
          .iterate(
            function( bandName, previousBand ) {
              bandName = ee.String( bandName );
              return image
                .select(bandName).eq(classId)
                .multiply(previousBand);
            },
            previousBand
          )
      );
      
      singleClass = singleClass
        .updateMask(singleClass.eq(1))
        .multiply(classId);
      
      images.push(singleClass);
  });
  
  
  // blend all images
  var allStable = ee.Image();
  
  for(var i = 0; i < classes.length; i++) 
    allStable = allStable.blend(images[i]);

  return allStable;
} 
/**
 * Función para graficar resultados en el mapa
 */
function addLayersToMap(stablePixels, mosaics, originalImage) {
  
  var palette = require('users/mapbiomas/modules:Palettes.js')
    .get('classification8');
    
  var region = originalImage.region;
    
  var image = ee.Image(originalImage.asset)
    .updateMask(region.rasterMask);
    
  var bands;
  
  if(originalImage.years.length === 0) {
    bands = image.bandNames();
  } 
  else {
    bands = ee.List([]);
    originalImage.years.forEach(function(year){
      bands = bands.add('classification_' + year.toString());
    });
  }
  
  bands.evaluate(function(bandnames){

    bandnames.forEach(function(bandname){
      
      // Mosaicos
      var year = parseInt(bandname.split('_')[1], 10);
      
      var mosaic = mosaics.filterMetadata('year', 'equals', year)
        .mosaic()
        .updateMask(region.rasterMask);
        
      Map.addLayer(
        mosaic,
        {
          bands: ['swir1_median', 'nir_median', 'red_median'],
          gain: [0.08, 0.06, 0.2]
        },
        'MOSAICO ' + year.toString(), false
      );

      // Clasificaciones
      Map.addLayer(
        image,
        {
          bands: bandname,
          min: 0, max: 62,
          palette: palette
        },
        bandname.toUpperCase().replace('TION_', 'CION '), false
      );
      
    });
    
    
    // Región
    Map.addLayer(region.vector.style({
      fillColor: '00000066', color: 'FCBA03'
    }), {}, 'REGION ' + param.regionId);
    
    
    // Pixeles estables
    Map.addLayer(
      stablePixels,
      {
        min: 0,
        max: 62,
        palette: palette
      },
      'PIXELES ESTABLES'
    );

  });
}

/**
 * Funciones para exportar resultados a GEE y Drive
 */
function exportImage(image, imageName, imageId, region, driveFolder) {
  Export.image.toAsset({
    image: image.toInt8(),
    description: imageName,
    assetId: imageId,
    scale: 30,
    pyramidingPolicy: {
      '.default': 'mode'
    },
    maxPixels: 1e13,
    region: region.geometry().bounds()
  });
  
  if(driveFolder !== '' && driveFolder !== undefined) {
    Export.image.toDrive({
      image: image.toInt8(),
      description: imageName + '-DRIVE',
      folder: driveFolder,
      scale: 30,
      maxPixels: 1e13,
      region: region.geometry().bounds()
    });
  }
}
