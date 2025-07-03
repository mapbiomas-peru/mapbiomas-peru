/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: #d63000 */ee.Geometry.Point([-76.23151412311866, -6.558316595484611]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
/**
 * 
 */

// product versions
var code_regions =  70103
var inputVersion = 1;
var outputVersion = '1';

// import modules
var palette = require('users/mapbiomas/modules:Palettes.js').get('classification8');

// assets
// var assetInput = 'projects/earthengine-legacy/assets/projects/mapbiomas-raisg/MAPBIOMAS-PERU/COLECCION2/INTEGRACION/integracion-pais/PERU-6';
var assetInput  =  'projects/mapbiomas-raisg/MAPBIOMAS-PERU/COLECCION3/INTEGRACION/integracion-region'
var assetOutput = 'projects/mapbiomas-raisg/MAPBIOMAS-PERU/COLECCION2/PRODUTOS-1/deforestacion-vegetacion-secundaria';
var assetBiomas = "projects/mapbiomas-raisg/MAPBIOMAS-PERU/DATOS-AUXILIARES/ESTADISTICAS/COLECCION2/bioma-pais-raster";

//
var yearVis = [2001, 2022]; // VISUALIZAR MOS Y CLAS C2, 2022 NO PRESENTA RESULTADOS

//
var years = [
    // 1985, 1986, 1987, 1988,
    // 1989, 1990, 1991, 1992,
    // 1993, 1994, 1995, 1996,
    // 1997, 1998, 
    // 1999, 2000,
    2001, 2002, 2003, 2004,
    2005, 2006, 2007, 2008,
    2009, 2010, 2011, 2012,
    2013, 2014, 2015, 2016,
    2017, 2018, 2019, 2020,
    2021, 2022, 2023
];
var bandNames = ee.List(
    years.map(
        function (year) {
            return 'classification_' + String(year);
        }
    )
);


// [1] Antrópico
// [2] Veg.Primária
// [3] Veg.Secundária
// [4] Supressão Veg.Primária
// [5] Recuperação para Veg.Secundária
// [6] Supressão Veg.Secundária
// [7] Outras transições
var rules = [
    // [4] Supressão Veg.Primária
    [[2, 2, 1, 1], [2, 2, 4, 1]],
];

var rulesSecVeg = [
    // 
    [[1, 2, 2, 2], [1, 5, 3, 3]],
    [[5, 3, 3, 2], [5, 3, 3, 3]],
    [[3, 2, 2, 2], [3, 3, 3, 3]],
    [[3, 2, 2, 4], [3, 3, 3, 4]],
    [[3, 3, 2, 4], [3, 3, 3, 6]],
    [[3, 3, 2, 2], [3, 3, 3, 3]],
    [[3, 3, 3, 2], [3, 3, 3, 3]],
    [[1, 2, 2, 4], [1, 1, 1, 1]],
];

var rulesDefSecVeg = [
    // 
    [[3, 4, 1], [3, 6, 1]],
];

/**
 * [mapbiomas_id, aggregation_id]
 * Aggregated ids
 * 0 - Ignorado
 * 1 - Antrópico
 * 2 - Vegetação
 * 7 - otros
 */
var classes = [
    // [1, 2], //. Forest
    [3, 2], //.1. Forest Formation
    [4, 2], //.2. Savanna Formation
    [5, 2], //.3. Mangrove
    [6, 2], //.4 Floodable Forest (beta)
    // [49, 2], //1.5. Wooded Sandbank Vegetation
    // [10, 2], //2. Non Forest Natural Formation
    [11, 2], //2.1. Wetland
    [12, 2], //2.2. Grassland
    [32, 7], //2.3. Hypersaline Tidal Flat
    // [29, 2], //2.4. Rocky Outcrop
    // [50, 2], //2.4. Herbaceous Sandbank Vegetation
    [13, 2], //2.6. Other non Forest Formations
    // [14, 1], //3. Farming
    [15, 1], //3.1. Pasture
    [18, 1], //3.2. Agriculture
    // [19, 1], //3.2.1. Temporary Crop
    // [39, 1], //3.2.1.1. Soybean
    // [20, 1], //3.2.1.2. Sugar cane
    // [40, 1], //3.2.1.3. Rice
    // [62, 1], //3.2.1.4. Cotton (beta)
    // [41, 1], //3.2.1.5. Other Temporary Crops
    // [36, 1], //3.2.2. Perennial Crop
    // [46, 1], //3.2.2.1. Coffee
    // [47, 1], //3.2.2.2. Citrus
    [35, 1], //3.2.2.3. Palm Oil (beta)
    // [48, 1], //3.2.2.4. Other Perennial Crops
    [9, 1], //.3. Forest Plantation
    [21, 1], //3.4. Mosaic of Uses
    // [22, 1], //4. Non vegetated area
    // [23, 7], //4.1. Beach, Dune and Sand Spot
    [24, 1], //4.2. Urban Area
    [30, 1], //4.3. Mining
    [25, 1], //4.4. Other non Vegetated Areas
    // [26, 7], //5. Water
    [33, 7], //5.1. River, Lake and Ocean
    [34, 7], // 
    // [31, 1], //5.2. Aquaculture
    [0, 0], //6. Not Observed
    [27, 0], //6. Not Observed
];

//
// var integrated = ee.Image(assetInput);
var integrated = ee.ImageCollection(assetInput)
                .filter(ee.Filter.eq('code_region', code_regions))
                .filter(ee.Filter.eq('version', inputVersion))
                .mosaic()
                .select(bandNames)
                                              // .filter(ee.Filter.eq('descripcion', 'integracion-ft'))
                                              // .filter(ee.Filter.eq('version', inputVersion))
                                              // .mosaic();

var biomas = ee.Image(assetBiomas);

integrated = integrated.updateMask(biomas.eq(4)) // BIOMA AMAZONIA

// get input lookup
var lookupIn = classes.map(
    function (c) {
        return c[0];
    }
);

// get output lookup
var lookupOut = classes.map(
    function (c) {
        return c[1];
    }
);

/**
 * 
 * @param {ee.Image} classification 
 * @param {List} yearsList 
 * @param {List} inputClasses 
 * @param {List} outputClasses 
 * @returns  ee.ImageCollection
 */
var aggregateClasses = function (classification, lookupIn, lookupOut) {

    var bandNames = classification.bandNames();

    var remapedImages = bandNames
        .iterate(
            function (band, image) {

                band = ee.String(band);

                var remaped = classification
                    .select(band)
                    .remap(lookupIn, lookupOut, 0)
                    .rename(band);

                return ee.Image(image).addBands(remaped);
            },
            ee.Image().select()
        );

    return ee.Image(remapedImages);
};

/**
 * 
 */
var classificationAgg = aggregateClasses(integrated, lookupIn, lookupOut);

print(classificationAgg);

/**
 * 
 * @param {*} year 
 * @param {*} classificationFtd 
 * @returns 
 */
var getDeforestation = function (rule, obj) {

    rule = ee.List(rule);
    obj = ee.Dictionary(obj);

    var classification = ee.Image(obj.get('classification'));
    var years = ee.List(obj.get('years'));

    // iterate over exceptions list and apply the filter function
    classification = years.iterate(
        /**
         * 
         * @param {*}  
         * @param {*}  
         * @returns 
         */
        function (year, classification) {

            classification = ee.Image(classification);
            year = ee.Number(year).int16();

            var b1 = ee.String('classification_').cat(ee.String(year));
            var b2 = ee.String('classification_').cat(ee.String(year.add(1)));
            var b3 = ee.String('classification_').cat(ee.String(year.add(2)));
            var b4 = ee.String('classification_').cat(ee.String(year.add(3)));

            var t1 = classification.select(b1);
            var t2 = classification.select(b2);
            var t3 = classification.select(b3);
            var t4 = classification.select(b4);

            var kernelBef = ee.List(ee.List(rule).get(0));
            var kernelAft = ee.List(ee.List(rule).get(1));

            // cb - class before, ca - class after
            var cb1 = ee.Number(kernelBef.get(0));
            var cb2 = ee.Number(kernelBef.get(1));
            var cb3 = ee.Number(kernelBef.get(2));
            var cb4 = ee.Number(kernelBef.get(3));

            var ca1 = ee.Number(kernelAft.get(0));
            var ca2 = ee.Number(kernelAft.get(1));
            var ca3 = ee.Number(kernelAft.get(2));
            var ca4 = ee.Number(kernelAft.get(3));

            // detects deforestation
            var mask1 = t1.eq(cb1).and(t2.eq(cb2)).and(t3.eq(cb3)).and(t4.eq(cb4));

            t1 = t1.where(mask1, ca1);
            t2 = t2.where(mask1, ca2);
            t3 = t3.where(mask1, ca3);
            t4 = t4.where(mask1, ca4);

            classification = classification.addBands(t1, null, true);
            classification = classification.addBands(t2, null, true);
            classification = classification.addBands(t3, null, true);
            classification = classification.addBands(t4, null, true);

            return classification;

        }, classification
    );

    classification = ee.Image(classification);

    // update obj
    obj = obj.set('classification', classification);

    return obj;
};


/**
 * 
 * @param {*} year 
 * @param {*} classificationFtd 
 * @returns 
 */
var getSecondaryVegetation = function (rule, obj) {

    rule = ee.List(rule);
    obj = ee.Dictionary(obj);

    var classification = ee.Image(obj.get('classification'));
    var years = ee.List(obj.get('years'));

    // iterate over exceptions list and apply the filter function
    classification = years.iterate(
        /**
         * 
         * @param {*}  
         * @param {*}  
         * @returns 
         */
        function (year, classification) {

            classification = ee.Image(classification);
            year = ee.Number(year).int16();

            var b1 = ee.String('classification_').cat(ee.String(year));
            var b2 = ee.String('classification_').cat(ee.String(year.add(1)));
            var b3 = ee.String('classification_').cat(ee.String(year.add(2)));
            var b4 = ee.String('classification_').cat(ee.String(year.add(3)));

            var t1 = classification.select(b1);
            var t2 = classification.select(b2);
            var t3 = classification.select(b3);
            var t4 = classification.select(b4);

            var kernelBef = ee.List(ee.List(rule).get(0));
            var kernelAft = ee.List(ee.List(rule).get(1));

            // cb - class before, ca - class after
            var cb1 = ee.Number(kernelBef.get(0));
            var cb2 = ee.Number(kernelBef.get(1));
            var cb3 = ee.Number(kernelBef.get(2));
            var cb4 = ee.Number(kernelBef.get(3));

            var ca1 = ee.Number(kernelAft.get(0));
            var ca2 = ee.Number(kernelAft.get(1));
            var ca3 = ee.Number(kernelAft.get(2));
            var ca4 = ee.Number(kernelAft.get(3));

            // detects deforestation
            var mask1 = t1.eq(cb1).and(t2.eq(cb2)).and(t3.eq(cb3)).and(t4.eq(cb4));

            t1 = t1.where(mask1, ca1);
            t2 = t2.where(mask1, ca2);
            t3 = t3.where(mask1, ca3);
            t4 = t4.where(mask1, ca4);

            classification = classification.addBands(t1, null, true);
            classification = classification.addBands(t2, null, true);
            classification = classification.addBands(t3, null, true);
            classification = classification.addBands(t4, null, true);

            return classification;

        }, classification
    );

    classification = ee.Image(classification);

    // update obj
    obj = obj.set('classification', classification);

    return obj;
};

/**
 * 
 * @param {*} year 
 * @param {*} classificationFtd 
 * @returns 
 */
var getDeforestationInSecondaryVegetation = function (rule, obj) {

    rule = ee.List(rule);
    obj = ee.Dictionary(obj);

    var classification = ee.Image(obj.get('classification'));
    var years = ee.List(obj.get('years'));

    // iterate over exceptions list and apply the filter function
    classification = years.iterate(
        /**
         * 
         * @param {*}  
         * @param {*}  
         * @returns 
         */
        function (year, classification) {

            classification = ee.Image(classification);
            year = ee.Number(year).int16();

            var b1 = ee.String('classification_').cat(ee.String(year));
            var b2 = ee.String('classification_').cat(ee.String(year.add(1)));
            var b3 = ee.String('classification_').cat(ee.String(year.add(2)));
            // var b4 = ee.String('classification_').cat(ee.String(year.add(3)));

            var t1 = classification.select(b1);
            var t2 = classification.select(b2);
            var t3 = classification.select(b3);
            // var t4 = classification.select(b4);

            var kernelBef = ee.List(ee.List(rule).get(0));
            var kernelAft = ee.List(ee.List(rule).get(1));

            // cb - class before, ca - class after
            var cb1 = ee.Number(kernelBef.get(0));
            var cb2 = ee.Number(kernelBef.get(1));
            var cb3 = ee.Number(kernelBef.get(2));
            // var cb4 = ee.Number(kernelBef.get(3));

            var ca1 = ee.Number(kernelAft.get(0));
            var ca2 = ee.Number(kernelAft.get(1));
            var ca3 = ee.Number(kernelAft.get(2));
            // var ca4 = ee.Number(kernelAft.get(3));

            // detects deforestation
            // var mask1 = t1.eq(cb1).and(t2.eq(cb2)).and(t3.eq(cb3)).and(t4.eq(cb4));
            var mask1 = t1.eq(cb1).and(t2.eq(cb2)).and(t3.eq(cb3));

            t1 = t1.where(mask1, ca1);
            t2 = t2.where(mask1, ca2);
            t3 = t3.where(mask1, ca3);
            // t4 = t4.where(mask1, ca4);

            classification = classification.addBands(t1, null, true);
            classification = classification.addBands(t2, null, true);
            classification = classification.addBands(t3, null, true);
            // classification = classification.addBands(t4, null, true);

            return classification;

        }, classification
    );

    classification = ee.Image(classification);

    // update obj
    obj = obj.set('classification', classification);

    return obj;
};

/**
 * 
 * @param {*} image 
 * @param {*} classId 
 */
var getClassFrequency = function (image, classId) {

    var bandNames = image.bandNames();

    var freq = bandNames.slice(1)
        .iterate(
            function (band, imageFreq) {
                var mask = image.select([band]).eq(classId);

                var currentNames = ee.Image(imageFreq).bandNames();

                var lastFreq = ee.Image(imageFreq)
                    .select([currentNames.reverse().get(0)]);

                var newFreq = lastFreq.add(mask)
                    .rename([band]);

                return ee.Image(imageFreq).addBands(newFreq);
            },
            image.select([0]).eq(classId)
        );

    return ee.Image(freq);
};

/**
 * iterates over biomes and applies rules
 */
// 1. detect deforestation
var obj = ee.List(rules)
    .iterate(
        getDeforestation,
        {
            'classification': classificationAgg,
            'years': ee.List(years).slice(0, years.length - 3)
        }
    );

obj = ee.Dictionary(obj);

var transitions = ee.Image(obj.get('classification'));

// 2. detect secondary vegetation
obj = ee.List(rulesSecVeg)
    .iterate(
        getSecondaryVegetation,
        {
            'classification': transitions,
            'years': ee.List(years).slice(0, years.length - 3)
        }
    );

obj = ee.Dictionary(obj);

transitions = ee.Image(obj.get('classification'));

// 2. detect secondary vegetation
obj = ee.List(rulesDefSecVeg)
    .iterate(
        getDeforestationInSecondaryVegetation,
        {
            'classification': transitions,
            'years': ee.List(years).slice(0, years.length - 2) // kernel size == 3
        }
    );

obj = ee.Dictionary(obj);

transitions = ee.Image(obj.get('classification'));
//
//
var anthropicFreq = getClassFrequency(classificationAgg, 1);
// var vegetationAge = getClassFrequency(classificationAgg, 2);

// Regras gerais
transitions = transitions.where(anthropicFreq.gt(1).and(transitions.eq(4)), 6);
transitions = transitions.where(anthropicFreq.gt(0).and(transitions.eq(2)), 3);

var transitions2020 = transitions.select('classification_2020');
var transitions2021 = transitions.select('classification_2021');
var transitions2022 = transitions.select('classification_2022');

// ajusta ultimos anos da vegetação secundária não confirmada
transitions2021 = transitions2021.where(transitions2020.eq(1).and(transitions2021.eq(3)), 1);
transitions2022 = transitions2022.where(transitions2020.eq(1).and(transitions2022.eq(3)), 1);
transitions2022 = transitions2022.where(transitions2021.eq(1).and(transitions2022.eq(3)), 1);

// ajusta o último ano do desmatamento não confirmado em vegetação sencundária
transitions2022 = transitions2022.where(transitions2021.eq(3).and(transitions2022.eq(1)), 3);

transitions = transitions.addBands(transitions2021, null, true);
transitions = transitions.addBands(transitions2022, null, true);

var transitionsPalette = [
    '#ffffff', // [0] No data
    '#faf5d1', // [1] Antrópico
    '#3f7849', // [2] Veg. Primária
    '#5bcf20', // [3] Veg. Secundária
    '#ea1c1c', // [4] Supressão Veg. Primária
    '#b4f792', // [5] Recuperação para Veg. Secundária
    '#fe9934', // [6] Supressão Veg. Secundária
    '#303149', // [7] Outras transições
];

//
Map.addLayer(anthropicFreq, {
    'min': 0,
    'max': 38,
    // 'palette': palette,
    'format': 'png'
}, 'anthropic frequency', false);

yearVis.forEach(function(year){
  var mosaics = [
        'projects/nexgenmap/MapBiomas2/LANDSAT/PANAMAZON/mosaics-2',
        'projects/mapbiomas-raisg/MOSAICOS/mosaics-2'
          ];
  var regionesMOS = ee.Image("projects/mapbiomas-raisg/MAPBIOMAS-PERU/DATOS-AUXILIARES/RASTER/mb-peru-regiones-mosaico-2");
  var coll_mosaic = ee.ImageCollection(mosaics[0]).merge(ee.ImageCollection(mosaics[1]))
                      .filter(ee.Filter.eq('country','PERU'))
                      .filter(ee.Filter.eq('year',year))
  coll_mosaic = coll_mosaic
                          .map(
                              function (image) {
                                  return image.updateMask(
                                      regionesMOS.eq(ee.Number.parse(image.get('region_code')).toInt16()));
                              }
                          );
  Map.addLayer(coll_mosaic.mosaic(), {
        'bands': ['swir1_median', 'nir_median', 'red_median'],
        'gain':[0.08,0.06,0.2],
        // 'min':200,
        // 'max':4000
    }, 'Mosaic'+ year, false);
    
  Map.addLayer(integrated, {
      'bands': ['classification_' + year.toString()],
      'min': 0,
      'max': 62,
      'palette': palette,
      'format': 'png'
  }, 'classification'+ year, false);
  
  Map.addLayer(transitions, {
      'bands': ['classification_' + year.toString()],
      'min': 0,
      'max': 7,
      'palette': transitionsPalette,
      'format': 'png'
  }, 'transitions'+ year);

})

// product properties
var properties = {
    "description": "# Deforestacion e Vegetacion Secundaria\n" +
        "## 1. Descrição do dado\n " +
        "* Versão da integração: " + inputVersion + "\n" +
        "* Versão do produto: " + outputVersion + "\n" +
        "* Detalhes do produto: c8-v" + inputVersion + "-" + outputVersion + "\n",
    "version": outputVersion,
    "territory": "PERU",
    "collection_id": 2.0,
    "source": "GT Deforestacion",
    "theme": "Deforestacion"
};

/**
 * Export to asset
 */
var gridNames = [
  "SA-17",
  "SA-18",
  "SA-19",
  "SB-17",
  "SB-18",
  "SB-19",
  // "SC-17",
  "SC-18",
  "SC-19",
  "SD-18",
  "SD-19",
  // "SE-18",
  // "SE-19",
];

var assetGrids = 'projects/mapbiomas-raisg/DATOS_AUXILIARES/VECTORES/grid-world';

var grids = ee.FeatureCollection(assetGrids);

// gridNames.forEach(
//     function (gridName) {
//         var grid = grids.filter(ee.Filter.stringContains('name', gridName));
//         Export.image.toAsset({
//             image: transitions.set('region', 'AMAZONIA')
//                               .set('version', outputVersion),
//             description: gridName + "-AMAZONIA-" + outputVersion,
//             assetId: assetOutput + "/" + gridName + "-AMAZONIA-" + outputVersion,
//             pyramidingPolicy: {
//                 '.default': 'mode'
//             },
//             region: grid.geometry().buffer(300).bounds(),
//             scale: 30,
//             maxPixels: 1e13
//         });
//     }
// );


// Añadimos una leyenda para visualizar
var legend = ui.Panel({
  style: {
    position: 'bottom-left',
    padding: '8px 15px'
  }
});
 
var legendTitle = ui.Label({
  value: 'Leyenda',
  style: {
    fontWeight: 'bold',
    fontSize: '18px',
    margin: '0 0 4px 0',
    padding: '0'
    }
});
var legendDesc = ui.Label({
  value: '--------',
  style: {
    //fontWeight: 'bold',
    fontSize: '12px',
    margin: '0 0 4px 0',
    padding: '0'
    }
});
 
legend.add(legendTitle);
legend.add(legendDesc);
var makeRow = function(color, name) {
       var colorBox = ui.Label({ 
        style: {
          backgroundColor: '#' + color,
          fontSize: '10px',
          padding: '6px',
          margin: '0 0 4px 0'
        }
      });
 
var description = ui.Label({
        value: name,
        style: {
          margin: '0 0 4px 6px',
          fontSize: '12px',
        }
      });
      return ui.Panel({
        widgets: [colorBox, description],
        layout: ui.Panel.Layout.Flow('horizontal')
      });
};

        

var Elemento =[
    // Color   Nombre de clase           Clase    Nivel
    // ['ff0000', 'Solo deforestación en Bolivia Col-1'],
    // ['00ff00', 'Deforestación en ambos'],
    // ['0000ff', 'Solo deforestación en Script nuevo'],
    // ['ffffff', '------------'],
    ['ffffff', '[0] No data'],
    ['faf5d1', '[1] Antrópico'],
    ['3f7849', '[2] Veg. Primária'],
    ['5bcf20', '[3] Veg. Secundária'],
    ['ea1c1c', '[4] Supressão Veg. Primária'],
    ['b4f792', '[5] Recuperação para Veg. Secundária'],
    ['fe9934', '[6] Supressão Veg. Secundária'],
    ['303149', '[7] Outras transições'],
  ]
Elemento.forEach(function(ele){
  legend.add(makeRow(ele[0], ele[1]))
})

Map.add(legend);




/**
 * 
 */
var Chart = {

    options: {
        'title': 'Inspector',
        'legend': 'none',
        'chartArea': {
            left: 30,
            right: 2,
        },
        'titleTextStyle': {
            color: '#ffffff',
            fontSize: 10,
            bold: true,
            italic: false
        },
        'tooltip': {
            textStyle: {
                fontSize: 10,
            },
            // isHtml: true
        },
        'backgroundColor': '#21242E',
        'pointSize': 6,
        'crosshair': {
            trigger: 'both',
            orientation: 'vertical',
            focused: {
                color: '#dddddd'
            }
        },
        'hAxis': {
            // title: 'Date', //muda isso aqui
            slantedTextAngle: 90,
            slantedText: true,
            textStyle: {
                color: '#ffffff',
                fontSize: 8,
                fontName: 'Arial',
                bold: false,
                italic: false
            },
            titleTextStyle: {
                color: '#ffffff',
                fontSize: 10,
                fontName: 'Arial',
                bold: true,
                italic: false
            },
            viewWindow: {
                max: 38,
                min: 0
            },
            gridlines: {
                color: '#21242E',
                interval: 1
            },
            minorGridlines: {
                color: '#21242E'
            }
        },
        'vAxis': {
            title: 'Class', // muda isso aqui
            textStyle: {
                color: '#ffffff',
                fontSize: 10,
                bold: false,
                italic: false
            },
            titleTextStyle: {
                color: '#ffffff',
                fontSize: 10,
                bold: false,
                italic: false
            },
            viewWindow: {
                max: 62,
                min: 0
            },
            gridlines: {
                color: '#21242E',
                interval: 2
            },
            minorGridlines: {
                color: '#21242E'
            }
        },
        'lineWidth': 0,
        // 'width': '300px',
        'height': '150px',
        'margin': '0px 0px 0px 0px',
        'series': {
            0: { color: '#21242E' }
        },

    },

    assets: {
        image: integrated,
        imagef: transitions
    },

    data: {
        image: null,
        imagef: null,
        point: null
    },

    legend: {
        0: { 'color': palette[0], 'name': 'Ausência de dados' },
        3: { 'color': palette[3], 'name': 'Formação Florestal' },
        4: { 'color': palette[4], 'name': 'Formação Savânica' },
        5: { 'color': palette[5], 'name': 'Mangue' },
        6: { 'color': palette[6], 'name': 'Campo Alagado e Área Pantanosa' },
        49: { 'color': palette[49], 'name': 'Restinga Florestal' },
        11: { 'color': palette[11], 'name': 'Área Úmida Natural não Florestal' },
        12: { 'color': palette[12], 'name': 'Formação Campestre' },
        32: { 'color': palette[32], 'name': 'Apicum' },
        29: { 'color': palette[29], 'name': 'Afloramento Rochoso' },
        50: { 'color': palette[50], 'name': 'Restinga Herbácea/Arbustiva' },
        13: { 'color': palette[13], 'name': 'Outra Formação não Florestal' },
        18: { 'color': palette[18], 'name': 'Agricultura' },
        39: { 'color': palette[39], 'name': 'Soja' },
        20: { 'color': palette[20], 'name': 'Cana' },
        40: { 'color': palette[40], 'name': 'Arroz' },
        62: { 'color': palette[62], 'name': 'Algodão' },
        41: { 'color': palette[41], 'name': 'Outras Lavouras Temporárias' },
        46: { 'color': palette[46], 'name': 'Café' },
        47: { 'color': palette[47], 'name': 'Citrus' },
        48: { 'color': palette[48], 'name': 'Outras Lavaouras Perenes' },
        35: { 'color': palette[35], 'name': 'Palma' },
        9: { 'color': palette[9], 'name': 'Silvicultura' },
        15: { 'color': palette[15], 'name': 'Pastagem' },
        21: { 'color': palette[21], 'name': 'Mosaico de Usos, Áreas abandonadas' },
        22: { 'color': palette[22], 'name': 'Área não Vegetada' },
        23: { 'color': palette[23], 'name': 'Praia e Duna' },
        24: { 'color': palette[24], 'name': 'Infraestrutura Urbana' },
        30: { 'color': palette[30], 'name': 'Mineração' },
        25: { 'color': palette[25], 'name': 'Outra Área não Vegetada' },
        33: { 'color': palette[33], 'name': 'Rio, Lago e Oceano' },
        31: { 'color': palette[31], 'name': 'Aquicultura' },
    },

    legendDeforestation: {
        0: { 'color': transitionsPalette[0], 'name': 'Sem informação' },
        1: { 'color': transitionsPalette[1], 'name': 'Antrópico' },
        2: { 'color': transitionsPalette[2], 'name': 'Veg. Primária' },
        3: { 'color': transitionsPalette[3], 'name': 'Veg. Secundária' },
        4: { 'color': transitionsPalette[4], 'name': 'Supressão Veg. Primária' },
        5: { 'color': transitionsPalette[5], 'name': 'Recuperação para Veg. Secundária' },
        6: { 'color': transitionsPalette[6], 'name': 'Supressão Veg. Secundária' },
        7: { 'color': transitionsPalette[7], 'name': 'Outras transições' },
    },

    loadData: function () {
        Chart.data.image = integrated;
        Chart.data.imagef = transitions;
    },

    init: function () {
        Chart.loadData();
        Chart.ui.init();
    },

    getSamplePoint: function (image, points) {

        var sample = image.sampleRegions({
            'collection': points,
            'scale': 30,
            'geometries': true,
            'tileScale': 8
        });

        return sample;
    },

    ui: {

        init: function () {

            Chart.ui.form.init();
            Chart.ui.activateMapOnClick();

        },

        activateMapOnClick: function () {

            Map.onClick(
                function (coords) {
                    var point = ee.Geometry.Point(coords.lon, coords.lat);

                    var bandNames = Chart.data.image.bandNames();

                    var newBandNames = bandNames.map(
                        function (bandName) {
                            var name = ee.String(ee.List(ee.String(bandName).split('_')).get(1));

                            return name;
                        }
                    );

                    var image = Chart.data.image.select(bandNames, newBandNames);
                    var imagef = Chart.data.imagef.select(bandNames, newBandNames);

                    Chart.ui.inspect(Chart.ui.form.chartInspectorf, imagef, point, 1.0, Chart.legendDeforestation);
                    Chart.ui.inspect(Chart.ui.form.chartInspector, image, point, 1.0, Chart.legend);

                    Chart.ui.form.labelCoords.setValue(coords.lon.toString() + ',' + coords.lat.toString());
                }
            );

            Map.style().set('cursor', 'crosshair');
        },

        refreshGraph: function (chart, sample, opacity, legend) {

            sample.evaluate(
                function (featureCollection) {

                    if (featureCollection !== null) {
                        // print(featureCollection.features);

                        var pixels = featureCollection.features.map(
                            function (features) {
                                return features.properties;
                            }
                        );

                        var bands = Object.getOwnPropertyNames(pixels[0]);

                        // Add class value
                        var dataTable = bands.map(
                            function (band) {
                                var value = pixels.map(
                                    function (pixel) {
                                        return pixel[band];
                                    }
                                );

                                return [band].concat(value);
                            }
                        );

                        // Add point style and tooltip
                        dataTable = dataTable.map(
                            function (point) {
                                var color = legend[point[1]].color;
                                var name = legend[point[1]].name;
                                var value = String(point[1]);

                                var style = 'point {size: 4; fill-color: ' + color + '; opacity: ' + opacity + '}';
                                var tooltip = 'year: ' + point[0] + ', class: [' + value + '] ' + name;

                                return point.concat(style).concat(tooltip);
                            }
                        );

                        var headers = [
                            'serie',
                            'id',
                            { 'type': 'string', 'role': 'style' },
                            { 'type': 'string', 'role': 'tooltip' }
                        ];

                        dataTable = [headers].concat(dataTable);

                        chart.setDataTable(dataTable);

                    }
                }
            );
        },

        refreshMap: function () {

            var pointLayer = Map.layers().filter(
                function (layer) {
                    return layer.get('name') === 'Point';
                }
            );

            if (pointLayer.length > 0) {
                Map.remove(pointLayer[0]);
                Map.addLayer(Chart.data.point, { color: 'yellow' }, 'Point');
            } else {
                Map.addLayer(Chart.data.point, { color: 'yellow' }, 'Point');
            }

        },

        inspect: function (chart, image, point, opacity, legend) {

            // aqui pode fazer outras coisas além de atualizar o gráfico
            Chart.data.point = Chart.getSamplePoint(image, ee.FeatureCollection(point));

            Chart.ui.refreshMap(Chart.data.point);
            Chart.ui.refreshGraph(chart, Chart.data.point, opacity, legend);

        },

        form: {

            init: function () {

                Chart.ui.form.panelChart.add(Chart.ui.form.chartInspector);
                Chart.ui.form.panelChart.add(Chart.ui.form.chartInspectorf);
                Chart.ui.form.panelChart.add(Chart.ui.form.labelCoords);


                Chart.options.title = 'Integrated';
                Chart.ui.form.chartInspector.setOptions(Chart.options);

                Chart.options.title = 'Deforestation/Regeneration';
                Chart.options.vAxis.viewWindow.max = 7;
                Chart.ui.form.chartInspectorf.setOptions(Chart.options);

                // Chart.ui.form.chartInspector.onClick(
                //     function (xValue, yValue, seriesName) {
                //         print(xValue, yValue, seriesName);
                //     }
                // );

                Map.add(Chart.ui.form.panelChart);
            },

            labelCoords: ui.Label({
                'style': {
                    'padding': '0px',
                    'backgroundColor': '#21242E',
                    'color': '#FFFFFF',
                    'fontSize': '10px'
                },
            }),

            panelChart: ui.Panel({
                'layout': ui.Panel.Layout.flow('vertical'),
                'style': {
                    'width': '450px',
                    // 'height': '200px',
                    'position': 'bottom-right',
                    'margin': '0px 0px 0px 0px',
                    'padding': '0px',
                    'backgroundColor': '#21242E'
                },
            }),

            chartInspector: ui.Chart([
                ['Serie', ''],
                ['', -1000], // número menor que o mínimo para não aparecer no gráfico na inicialização
            ]),

            chartInspectorf: ui.Chart([
                ['Serie', ''],
                ['', -1000], // número menor que o mínimo para não aparecer no gráfico na inicialização
            ])
        }
    }
};

Chart.init();