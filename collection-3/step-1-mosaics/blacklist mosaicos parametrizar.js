/** 
                                P1 BLACK LIST
 Update  2019___   Joao et:  
 Update  20220101  EYTC: creacion de nuevo modulo GetImages para blacklist 
 Update  20230314  EYTC: opcion landsat9
 Update  20230321 KTBM: Visualización ly=L8/L9, Cambio Background
 */    

var param = { 
    'grid_name': 'SB-17-X-D',
    't0': '2024-01-01',
    't1': '2024-05-31',
    'satellite': 'LY',   // L4, L5, L7, L8, L9, LX, LY
    'cloud_cover': 80,
    'pais': 'Perú', // Options: 'Colombia'
    'regionMosaic': 705,  //
    'shadowSum':3500,   //0 - 10000  Defaut 3500  
    'cloudThresh':75,  // 0 - 100    Defaut 10
};


/**
 * Definición de imágenes que serán excluidas del procesamiento (Blacklist)
 */
var blackList = [
    '',
];


/**
 * Importa geometria: carta y region
 */
var layers = {
  regions: 'projects/mapbiomas-raisg/MAPBIOMAS-PERU/DATOS-AUXILIARES/VECTORES/per-clasificacion-mosaicos-5',
  grids : 'projects/mapbiomas-raisg/DATOS_AUXILIARES/VECTORES/grid-world'
};


var region = ee.FeatureCollection(layers.regions)
  .filterMetadata('id_region', 'equals', param.regionMosaic);

var grid =  ee.FeatureCollection(layers.grids)
  .filterMetadata('name', 'equals', param.grid_name);



/**  
 * @name
 *      reescale
 * @description
 *      Aplica o reescalonamento em uma imagem
 * @argument
 *      Objecto contendo os atributos
 *          @attribute image {ee.Image}
 *          @attribute min {Integer}
 *          @attribute max {Integer}
 * @example
 *      var obj = {
 *          'image': image.expression('b(red) + b(green) + b(blue)'),
 *          'min': 2000,
 *          'max': 8000
 *      };
 *      
 *      var reescaled = reescale(obj);
 * @returns
 *      ee.Image
 */
var rescale = function (obj) {

  var image = obj
    .image
    .subtract(obj.min)
    .divide(ee.Number(obj.max)
    .subtract(obj.min));

  return image;
    
};



/**
 * 
 */
var scaleFactors = function(image) {
  var optical = [
    'blue',  'green', 'red', 'nir', 'swir1', 'swir2'
  ];
  
  var opticalBands = image
    .select(optical).multiply(0.0000275).add(-0.2).multiply(10000);
  
  var thermalBand = image
    .select('temp*').multiply(0.00341802).add(149.0).multiply(10);
  
  return image
    .addBands(opticalBands, null, true)
    .addBands(thermalBand, null, true);
};



/**
 * @name
 *      cloudScore
 * @description
 *      Constroi uma máscara de nuvens usando varios indicadores de presença de nuvens 
 * @argument
 *      @attribute image {ee.Image}
 * @example
 *      var image = cloudScore(image);
 * @returns 
 *      ee.Image
 */
var cloudScore = function (image) {

  var cloudThresh = param.cloudThresh;

  // Compute several indicators of cloudiness and take the minimum of them.
  var score = ee.Image(1.0);

  // Clouds are reasonably bright in the blue band.
  score = score.min(
    rescale(
      {
        'image': image.select(['blue']),
        'min': 1000,
        'max': 3000
      }
    )
  );

  // Clouds are reasonably bright in all visible bands.
  score = score.min(
    rescale(
      {
        'image': image.expression("b('red') + b('green') + b('blue')"),
        'min': 2000,
        'max': 8000
      }
    )
  );

  // Clouds are reasonably bright in all infrared bands.
  score = score.min(
    rescale(
      {
        'image': image.expression("b('nir') + b('swir1') + b('swir2')"),
        'min': 3000,
        'max': 8000
      }
    )
  );

 // Clouds are reasonably cool in temperature.
  var temperature = image.select(['temp']);
  
  score = score.where(temperature.mask(),
      score.min(rescale({
          'image': temperature,
          'min': 3000,
          'max': 2900
      })));


  // However, clouds are not snow.
  var ndsi = image.normalizedDifference(['green', 'swir1']);

  score = score.min(
    rescale(
      {
      'image': ndsi,
      'min': 0.8,
      'max': 0.6
      }
    )
  )
  .multiply(100)
  .byte();

  score = score.gte(cloudThresh).rename('cloudScoreMask');

  return image.addBands(score);
  
};



/**
 * @name
 *      tdom
 * @description
 *      The TDOM method first computes the mean and standard deviation of the near-infrared(NIR) and
 *      shortwave-infrared(SWIR1) bands across a collection of images.For each image, the algorithm then
 *      computes the z - score of the NIR and SWIR1 bands(z(Mb))(Equation(5))(Figure 2). Each image also has a
 *      darkness metric computed as the sum of the NIR and SWIR1 bands().Cloud shadows are then identified
 *      if a pixel has a z - score of less than −1 for both the NIR and SWIR1 bands and a darkness
 *      value less than 0.35 (Equation(8)).These thresholds were chosen after extensive qualitative evaluation of
 *      TDOM outputs from across the CONUS.
 * 
 * https://www.mdpi.com/2072-4292/10/8/1184/htm
 * @argument
 *      Objecto contendo os atributos
 *          @attribute collection {ee.ImageCollection}
 *          @attribute zScoreThresh {Float}
 *          @attribute shadowSumThresh {Float}
 *          @attribute dilatePixels {Integer}
 * @example
 *      var obj = {
 *          'collection': collection,
 *          'zScoreThresh': -1,
 *          'shadowSumThresh': 0.5,
 *          'dilatePixels': 2,
 *      };
 *      
 *      collection = tdom(obj);
 * @returns
 *      ee.ImageCollection
 */
var tdom = function (obj) {

    var shadowSumBands = ['nir', 'swir1'];

    // Get some pixel-wise stats for the time series
    var irStdDev = obj.collection
        .select(shadowSumBands)
        .reduce(ee.Reducer.stdDev());

    var irMean = obj.collection
        .select(shadowSumBands)
        .mean();

    // Mask out dark dark outliers
    var collection = obj.collection.map(
        function (image) {
            var zScore = image.select(shadowSumBands)
                .subtract(irMean)
                .divide(irStdDev);

            var irSum = image.select(shadowSumBands)
                .reduce(ee.Reducer.sum());

            var tdomMask = zScore.lt(obj.zScoreThresh)
                .reduce(ee.Reducer.sum())
                .eq(2)
                .and(irSum.lt(obj.shadowSumThresh))
                .not();

            tdomMask = tdomMask.focal_min(obj.dilatePixels);

            return image.addBands(tdomMask.rename('tdomMask'));
        }
    );

    return collection;
};



/**
 * @name
 *      cloudProject
 * @description
 *      
 * @argument
 *      Objecto contendo os atributos
 *          @attribute image {ee.Image}
 *          @attribute cloudHeights {ee.List}
 *          @attribute shadowSumThresh {Float}
 *          @attribute dilatePixels {Integer}
 *          @attribute cloudBand {String}
 * @example
 *      var obj = {
 *          'image': image,
 *          'cloudHeights': ee.List.sequence(200, 10000, 500),
 *          'shadowSumThresh': 0.5,
 *          'dilatePixels': 2,
 *          'cloudBand': 'cloudScoreMask',
 *      };
 *      
 *      image = cloudProject(obj);
 * @returns
 *      ee.Image
 */
var cloudProject = function (obj) {

    // Get the cloud mask
    var cloud = obj.image
        .select(obj.cloudBand);

    // Get TDOM mask
    var tdomMask = obj.image
        .select(['tdomMask']);

    //Project the shadow finding pixels inside the TDOM mask that are dark and 
    //inside the expected area given the solar geometry
    //Find dark pixels
    var darkPixels = obj.image.select(['nir', 'swir1', 'swir2'])
        .reduce(ee.Reducer.sum())
        .lt(obj.shadowSumThresh);

    //Get scale of image
    var nominalScale = cloud
        .projection()
        .nominalScale();

    //Find where cloud shadows should be based on solar geometry
    //Convert to radians
    var meanAzimuth = obj.image.get('sun_azimuth_angle');
    var meanElevation = obj.image.get('sun_elevation_angle');

    var azR = ee.Number(meanAzimuth)
        .multiply(Math.PI)
        .divide(180.0)
        .add(ee.Number(0.5).multiply(Math.PI));

    var zenR = ee.Number(0.5)
        .multiply(Math.PI)
        .subtract(ee.Number(meanElevation).multiply(Math.PI).divide(180.0));

    //Find the shadows
    var shadows = obj.cloudHeights.map(
        function (cloudHeight) {

            cloudHeight = ee.Number(cloudHeight);

            var shadowCastedDistance = zenR.tan()
                .multiply(cloudHeight); //Distance shadow is cast

            var x = azR.cos().multiply(shadowCastedDistance)
                .divide(nominalScale).round(); //X distance of shadow

            var y = azR.sin().multiply(shadowCastedDistance)
                .divide(nominalScale).round(); //Y distance of shadow

            return cloud.changeProj(cloud.projection(), cloud.projection()
                .translate(x, y));
        }
    );

    var shadow = ee.ImageCollection.fromImages(shadows).max().unmask();

    //Create shadow mask
    shadow = shadow.focal_max(obj.dilatePixels);
    shadow = shadow.and(darkPixels).and(tdomMask.not().and(cloud.not()));

    var shadowMask = shadow
        .rename(['shadowTdomMask']);

    return obj.image.addBands(shadowMask);
};



/**
 * @name
 *      cloudBQAMaskSr
 * @description
 *      
 * @argument
 * 
 * @example
 * 
 * @returns
 *      ee.Image
 */
var cloudBQAMaskSr = function (image) {

    var qaBand = image.select(['pixel_qa']);

    var cloudMask = qaBand.bitwiseAnd(Math.pow(2, 3))
                          .or(qaBand.bitwiseAnd(Math.pow(2, 2)))
                          .or(qaBand.bitwiseAnd(Math.pow(2, 1)))
                          .neq(0)
                          .rename('cloudBQAMask');

    return ee.Image(cloudMask);
};



/**
 * @name
 *      cloudBQAMask
 * @description
 *      
 * @argument
 * 
 * @example
 * 
 * @returns
 *      ee.Image
 */
var cloudBQAMask = function (image) {

    var cloudMask = cloudBQAMaskSr(image);

    return image.addBands(ee.Image(cloudMask));
};



/**
 * @name
 *      shadowBQASrLX
 * @description
 *      
 * @argument
 * 
 * @example
 * 
 * @returns
 *      ee.Image
 */
var shadowBQAMaskSrLX = function (image) {

    var qaBand = image.select(['pixel_qa']);

    var cloudShadowMask = qaBand.bitwiseAnd(Math.pow(2, 4))
                                .neq(0)
                                .rename('shadowBQAMask');

    return ee.Image(cloudShadowMask);
};



/**
 * @name
 *      cloudBQAMask
 * @description
 *      
 * @argument
 * 
 * @example
 * 
 * @returns
 *      ee.Image
 */
var shadowBQAMask = function (image) {

    var cloudShadowMask = ee.Algorithms.If(
        ee.String(image.get('satellite_name')).slice(0, 10).compareTo('Sentinel-2').not(),
        // true
        ee.Image(0).mask(image.select(0)).rename('shadowBQAMask'),
        // false
        shadowBQAMaskSrLX(image)
    );

    return image.addBands(ee.Image(cloudShadowMask));
    
};

/**
 * @name
 *      getMasks
 * @description
 *      
 * @argument
 *      Objecto contendo os atributos
 *          @attribute collection {ee.ImageCollection}
 *          @attribute cloudBQA {Boolean}
 *          @attribute cloudScore {Boolean}
 *          @attribute shadowBQA {Boolean}
 *          @attribute shadowTdom {Boolean}
 *          @attribute zScoreThresh { Float}
 *          @attribute shadowSumThresh { Float}
 *          @attribute dilatePixels { Integer}
 *          @attribute cloudHeights {ee.List}
 *          @attribute cloudBand {String}
 * @example
 *      var obj = {
 *          'collection': collection,
 *          'cloudBQA': true,
 *          'cloudScore': true,
 *          'shadowBQA': true,
 *          'shadowTdom': true,
 *          'zScoreThresh': -1,
 *          'shadowSumThresh': 0.5,
 *          'dilatePixels': 2,
 *          'cloudHeights': ee.List.sequence(200, 10000, 500),
 *          'cloudBand': 'cloudScoreMask'
 *      };
 *      
 *      var collectionWithMasks = getMasks(obj);
 * @returns
 *      ee.ImageCollection
 */
var getMasks = function (obj) {
     
    
    // Cloud mask
    var collection = ee.Algorithms.If(obj.cloudBQA,
        ee.Algorithms.If(obj.cloudScore,
            // cloudBQA is true and cloudScore is true
            obj.collection.map(cloudBQAMask).map(cloudScore),
            // cloudBQA is true and cloudScore is false
            obj.collection.map(cloudBQAMask)),
        // cloudBQA is false and cloudScore is true
        obj.collection.map(cloudScore));

    collection = ee.ImageCollection(collection);

    // Cloud shadow Mask
    collection = ee.Algorithms.If(obj.shadowBQA,
        ee.Algorithms.If(obj.shadowTdom,
            // shadowBQA is true and shadowTdom is true
            tdom({
                'collection': collection.map(shadowBQAMask),
                'zScoreThresh': obj.zScoreThresh,
                'shadowSumThresh': obj.shadowSumThresh,
                'dilatePixels': obj.dilatePixels,
            }),
            // shadowBQA is true and shadowTdom is false
            collection.map(shadowBQAMask)),
        // shadowBQA is false and shadowTdom is true
        tdom({
            'collection': collection,
            'zScoreThresh': obj.zScoreThresh,
            'shadowSumThresh': obj.shadowSumThresh,
            'dilatePixels': obj.dilatePixels,
        }));

    collection = ee.ImageCollection(collection); //.map(scaleFactors);

    var getShadowTdomMask = function (image) {

        image = cloudProject({
            'image': image,
            'shadowSumThresh': obj.shadowSumThresh,
            'dilatePixels': obj.dilatePixels,
            'cloudHeights': obj.cloudHeights,
            'cloudBand': obj.cloudBand,
        });

        return image;
    };

    collection = ee.Algorithms.If(
        obj.shadowTdom,
        collection.map(getShadowTdomMask),
        collection);

    return ee.ImageCollection(collection);

};

//*****
// var bns = require('users/raisgmb01/MapBiomas_C4:P01_MOSAICOS/modules/BandNames.js');
var bns = require('users/mapbiomasperu/mapbiomas-lulc:collection-3/step-1-mosaics/modules/BandNames.js');
var col = require('users/mapbiomasperu/mapbiomas-lulc:collection-3/step-1-mosaics/modules/Collection.js');
var dtp = require('users/mapbiomasperu/mapbiomas-lulc:collection-3/step-1-mosaics/modules/DataType.js');
var ind = require('users/mapbiomasperu/mapbiomas-lulc:collection-3/step-1-mosaics/modules/SpectralIndexes.js');
var mis = require('users/mapbiomasperu/mapbiomas-lulc:collection-3/step-1-mosaics/modules/Miscellaneous.js');
var mos = require('users/mapbiomasperu/mapbiomas-lulc:collection-3/step-1-mosaics/modules/Mosaic.js');
var sma = require('users/mapbiomasperu/mapbiomas-lulc:collection-3/step-1-mosaics/modules/SmaAndNdfi.js');


var getImages = function (param, blackList, grid) {
    var options = {

        dates: {
            t0: param.t0,
            t1: param.t1
        },

        collection: null,

        regionMosaic: param.regionMosaic,
        gridName: param.grid_name,
        cloudCover: param.cloud_cover,
        shadowSum: param.shadowSum,
        cloudThresh: param.cloudThresh,
        
        blackList: blackList,

        imageList: [],

        collectionid: param.satellite.toLowerCase(),

        collectionIds: {
            'l4': [
                'LANDSAT/LT04/C02/T1_L2'
            ],
            'l5': [
                'LANDSAT/LT05/C02/T1_L2'
            ],
            'l7': [
                'LANDSAT/LE07/C02/T1_L2'
            ],
            'l8': [
                'LANDSAT/LC08/C02/T1_L2'
            ],
            'l9': [
                'LANDSAT/LC09/C02/T1_L2'
            ],
            'lx': [
                'LANDSAT/LT05/C02/T1_L2',
                'LANDSAT/LE07/C02/T1_L2'
            ],
            'ly': [
                'LANDSAT/LC08/C02/T1_L2',
                'LANDSAT/LC09/C02/T1_L2'
            ],
        },

        endmembers: {
            'l4': sma.endmembers['landsat-4'],
            'l5': sma.endmembers['landsat-5'],
            'l7': sma.endmembers['landsat-7'],
            'l8': sma.endmembers['landsat-8'],
            'l9': sma.endmembers['landsat-9'],
            'lx': sma.endmembers['landsat-5'],
            'ly': sma.endmembers['landsat-8'],
        },

        bqaValue: {
            'l4': ['QA_PIXEL', Math.pow(2, 5)],
            'l5': ['QA_PIXEL', Math.pow(2, 5)],
            'l7': ['QA_PIXEL', Math.pow(2, 5)],
            'l8': ['QA_PIXEL', Math.pow(2, 5)],
            'l9': ['QA_PIXEL', Math.pow(2, 5)],
            'lx': ['QA_PIXEL', Math.pow(2, 5)],
            'ly': ['QA_PIXEL', Math.pow(2, 5)],
        },
        bandIds: {
            'LANDSAT/LT04/C02/T1_L2': 'l4_sr2',
            'LANDSAT/LT05/C02/T1_L2': 'l5_sr2',
            'LANDSAT/LE07/C02/T1_L2': 'l7_sr2',
            'LANDSAT/LC08/C02/T1_L2': 'l8_sr2',
            'LANDSAT/LC09/C02/T1_L2': 'l9_sr2',
        },
        visParams: {
            bands: 'swir1,nir,red',
            gain: '0.008,0.006,0.02',
            gamma: 0.75
        }
    }
    
    var applyCloudAndSahdowMask = function (collection) {

        var collectionWithMasks = getMasks({
            'collection': collection,
            'cloudBQA': true,    // cloud mask using pixel QA
            'cloudScore': true,  // cloud mas using simple cloud score
            'shadowBQA': true,   // cloud shadow mask using pixel QA
            'shadowTdom': true,  // cloud shadow using tdom
            'zScoreThresh': -1,
            'shadowSumThresh': options.shadowSum,
            'cloudThresh':options.cloudThresh,
            'dilatePixels': 4,
            'cloudHeights': [200, 700, 1200, 1700, 2200, 2700, 3200, 3700, 4200, 4700],  //ee.List.sequence(2000, 10000, 500),  
            'cloudBand': 'cloudScoreMask' //'cloudScoreMask' or 'cloudBQAMask'
        });

        // get collection without clouds
        var collectionWithoutClouds = collectionWithMasks.map(
            function (image) {
                return image.mask(
                    image.select([
                        'cloudBQAMask',
                        'cloudScoreMask',
                        'shadowBQAMask',
                        'shadowTdomMask'
                    ]).reduce(ee.Reducer.anyNonZero()).eq(0)
                );
            }
        );

        return collectionWithoutClouds;
    };

    var applySingleCloudMask = function (image) {

        return image.mask(
            image.select(options.bqaValue[options.collectionid][0])
                .bitwiseAnd(options.bqaValue[options.collectionid][1]).not());
                
    };

    var processCollection =  function (collectionid) {

        var spectralBands = ['blue', 'red', 'green', 'nir', 'swir1', 'swir2'];

        var objLandsat = {
            'collectionid': collectionid,
            'geometry':     grid.geometry(),
            'dateStart':    options.dates.t0.slice(0, 4)+'-01-01',
            'dateEnd':      options.dates.t1.slice(0, 4)+'-12-31',
            'cloudCover':   options.cloudCover,
        };

        var bands = bns.get(options.bandIds[collectionid]);
        

        var collection = col.getCollection(objLandsat)
            .select(bands.bandNames, bands.newNames)
            .filter(ee.Filter.inList('system:index', options.blackList).not());
            
         collection = collection.map(scaleFactors);
         collection = applyCloudAndSahdowMask(collection)
                     .select(spectralBands);

        // apply SMA
        collection = collection.map(
            function (image) {
                return sma.getFractions(image,
                    options.endmembers[options.collectionid]);
            }
        );

        // calculate SMA indexes        
        collection = collection
            .map(sma.getNDFI)
            .map(sma.getSEFI)
            .map(sma.getWEFI)
            .map(sma.getFNS);

        // calculate Spectral indexes        
        collection = collection
            .map(ind.getCAI)
            .map(ind.getEVI2)
            .map(ind.getGCVI)
            .map(ind.getHallCover)
            .map(ind.getHallHeigth)
            .map(ind.getNDVI)
            .map(ind.getNDWI)
            .map(ind.getPRI)
            .map(ind.getSAVI);

 

        return collection
    }
    
    var makeCollection = function () {

        var collection = processCollection(
                     options.collectionIds[options.collectionid][0]);

        // Unmask data with the secondary mosaic (+L5 or +L7)
        if (options.collectionIds[options.collectionid].length == 2) {
            var collection2 = processCollection(
                options.collectionIds[options.collectionid][1]);

            collection = collection.merge(collection2);
        }

      return collection;
    };

    var coll = makeCollection();

    var coll_median = coll.filterDate(options.dates.t0, options.dates.t1);
    //print(coll_median)
    
    return coll_median
}

//*****


var collection_without_blacklist = getImages(param, [],grid);
var collection_with_blacklist = getImages(param, blackList,grid);



print('collection sin blackList:', collection_without_blacklist);
print('collection con blackList:', collection_with_blacklist);

//Map.centerObject(grid, 10);

/**
 * Despliega en el mapa los mosaicos y polígonos necesarios
 * para la visualización
 */

Map.addLayer(
    grid.style({ fillColor: 'f8fc03', color: 'f8fc0300'}), 
    {}, 'Background'
);

Map.addLayer(
  collection_without_blacklist.median().clip(region).clip(grid),
  { 
    bands: 'swir1,nir,red',
    gain: '0.08,0.06,0.2'
  },
  'MOSAIC',
  true
);
                    
Map.addLayer(
  collection_with_blacklist.median().clip(region).clip(grid),
  {
    bands: 'swir1,nir,red',
    gain: '0.08,0.06,0.2'
  },
  'MOSAIC BLACK LIST',
  true 
);

Map.addLayer(
    region.style({ fillColor: '#ff000000', color: 'f59e42'}),
    {}, 'Regions ' + param.pais, false
);

/**
 * Despliega las escenas landsat disponibles para cada mosaico, de manera que
 * se puede visualizar cómo afecta la calidad del mosaico
 */
collection_with_blacklist.reduceColumns(ee.Reducer.toList(), ['system:index'])
  .get('list')
  .evaluate(
      function(ids){
          ids.forEach(
              function(imageid){
                  var image = collection_with_blacklist.filterMetadata('system:index', 'equals', imageid);
                  image = image.mosaic()//.clip(paises);
                  Map.addLayer(image,
                    {
                      bands: 'swir1,nir,red',
                      gain: '0.08,0.06,0.2'
                    },
                    imageid,
                    false
                  );
                  print(imageid);
              }
          );
      }  
  );
  