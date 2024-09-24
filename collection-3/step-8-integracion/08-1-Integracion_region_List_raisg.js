/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: #d63000 */ee.Geometry.MultiPoint(),
    de_3_a_21 = 
    /* color: #ffcd12 */
    /* shown: false */
    ee.FeatureCollection(
        [ee.Feature(
            ee.Geometry.Polygon(
                [[[-79.4372862662393, -4.922922171679422],
                  [-79.43767250433744, -4.925573102344232],
                  [-79.42565620795072, -4.9253593180049675],
                  [-79.41891849890531, -4.918603697492509],
                  [-79.41466987982572, -4.914285195294578],
                  [-79.4146251651683, -4.913001575011243],
                  [-79.41466271609451, -4.912886663767398],
                  [-79.41470563143875, -4.912870629638775],
                  [-79.41478848719281, -4.912828591425453],
                  [-79.41531420015973, -4.912823246715491]]]),
            {
              "class_original": 3,
              "class_final": 21,
              "system:index": "0"
            }),
        ee.Feature(
            ee.Geometry.Polygon(
                [[[-79.40437019720854, -4.898806769555103],
                  [-79.39505756750883, -4.892136398170129],
                  [-79.39351261511625, -4.883541783211955],
                  [-79.39123810187162, -4.874818777786831],
                  [-79.39106644049467, -4.8722959266612405],
                  [-79.39063728705229, -4.865368727431322],
                  [-79.39364136114897, -4.863658296889934],
                  [-79.39784706488432, -4.879223054499423],
                  [-79.40531433478178, -4.897438493668596]]]),
            {
              "class_original": 3,
              "class_final": 21,
              "system:index": "1"
            }),
        ee.Feature(
            ee.Geometry.Polygon(
                [[[-78.31085571326275, -5.079865978668275],
                  [-78.31291564705093, -5.0749073393288056],
                  [-78.32115538221375, -5.081917818273169]]]),
            {
              "class_original": 3,
              "class_final": 21,
              "system:index": "2"
            })]),
    de_25_13_85_23 = 
    /* color: #d616ca */
    /* shown: false */
    ee.FeatureCollection(
        [ee.Feature(
            ee.Geometry.Polygon(
                [[[-79.48311746048871, -5.768476393712126],
                  [-79.54354226517621, -5.849084514790609],
                  [-79.50920998978559, -5.911923473822902],
                  [-79.27987039017621, -5.877772746100367],
                  [-79.28124368119184, -5.758911954899833],
                  [-79.34166848587934, -5.7042549377741985]]]),
            {
              "original": 25,
              "new": 13,
              "t0": 1985,
              "t1": 2023,
              "system:index": "0"
            })]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// INTEGRACION POR REGIONES MAPBIOMAS PERÚ COLECCION3 
// GRUPO DE DESARROLLO 
var param = {
    //region, version
    codesAndVersions: [
        [70305, 25],
        [70310, 15],
        //[70101, 17],
    ],  
    pais: 'PERU',
    years: [2022, 2023],  // Solo visualizacion
    ReglasIntegracion:[   // Orden de integracion de clases 
                          // LOS PRIMEROS TIENEN LA MAYOR PREVALENCIA  (T=TRANVERSAL, G=GENERAL)
            [34, 'T'],
            [34, 'G'],
            [9,  'T'],
            [23, 'T'],
            [23, 'G'],
            [33, 'G'],
            [33, 'T'],
            [30, 'T'],
            [24, 'T'],
            [29, 'G'],
            [68, 'G'],
            [25, 'G'],
            [12, 'G'],
            [11, 'G'],
            [35, 'T'],
            [18, 'T'],
            [18, 'G'],
            [15, 'T'],
            [15, 'G'],
            [21, 'T'],
            [21, 'G'],
            [13, 'G'],
            [6, 'T'],
            [6, 'T'],
            [4, 'G'],
            [3, 'G']
                      ], 
    remapGeometry: [de_25_13_85_23], //remap por años
     versionTransversal:{  // Indicar version de los temas transversales
          //manglar5: 1,
          bosqinund6 :1,
          plantacion9 :1,
          fnnfinund11:1,
          pastos15:1,
          agricultura18:1,
          agricultura21:1,
          playa23:1,
          urbano24   :1,
          mining30   :1, 
          acuicultura31 : 2,
          glaciar34  :4,
          palma35:1,
          agua33:2
            },
    version_output: 2,
    source:'Instituto del Bien Común (IBC)',
    exportArea: false,
    piramide: true  //
   };
var assetsRemap = [
      de_3_a_21
  ]; //toda la serie

//-----
var yearsList = [
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
// Assets
//---------------------------------

var palettes = require('users/mapbiomas/modules:Palettes.js');
var mapbiomasPalette = palettes.get('classification8');

// Assets
var dirinput = 'projects/mapbiomas-raisg/MAPBIOMAS-PERU/COLECCION3/clasificacion-ft'
var dirout = 'projects/mapbiomas-raisg/MAPBIOMAS-PERU/COLECCION3/INTEGRACION/integracion-region'

var regionesclass = 'projects/mapbiomas-raisg/MAPBIOMAS-PERU/DATOS-AUXILIARES/VECTORES/per-regiones-clasificacion-mbperu-3'
var regionesclassRaster = 'projects/mapbiomas-raisg/MAPBIOMAS-PERU/DATOS-AUXILIARES/RASTER/per-regiones-clasificacion-mbperu-3'
var regionesMosaicRaster = 'projects/mapbiomas-raisg/DATOS_AUXILIARES/RASTERS/mosaico-regiones-4' 

var dirs = require('users/mapbiomasperu/mapbiomas-lulc:collection-3/modules/CollectionDirectories.js');
var paths = dirs.listpaths(param.pais);
var dirTransv = paths.transversales;

var AssetMosaic= [ paths.mosaics_c4_raisg,  paths.mosaics_c4_nexgen]

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

// ----TRANSVERSALES----

var bosqinund6 = ee.Image(dirTransv + 'INUNDABLES/INTEGRACION/PERU-FLOODABLE-' + param.versionTransversal.bosqinund6)
                    .eq(6).multiply(6)
                    .byte()
                    .selfMask();
print('bosqinund6',bosqinund6)

var plantacion9 = ee.Image(dirTransv + 'PLANTACION/INTEGRACION/PERU-PLANTACION-'+param.versionTransversal.plantacion9)
                      .eq(9).multiply(9)
                      .byte()
                      .selfMask();
                      
print('plantacion9',plantacion9)

var pastos15 = ee.Image(dirTransv + 'PASTO/INTEGRACION/PERU-PASTURE-' + param.versionTransversal.pastos15)
                .eq(15).multiply(15)
                .byte()
                .selfMask();
print('pastos15',pastos15)

var agricultura18 = ee.Image(dirTransv + 'AGRICULTURA/INTEGRACION/PERU-AGRICULTURE-'+param.versionTransversal.agricultura18)
                        .eq(18).multiply(18)
                        .byte()
                        .selfMask();
        
print('agricultura18',agricultura18)

var agricultura21 = ee.Image(dirTransv + 'AGROPECUARIO/INTEGRACION/PERU-AGROPECUARIO-'+param.versionTransversal.agricultura21)
                .eq(21).multiply(21)
                .byte()
                .selfMask();
  
print('agricultura21',agricultura21)

var playa23 = ee.Image(dirTransv +'PLAYAS/INTEGRACION/PERU-BEACH-'+param.versionTransversal.playa23)
                        .eq(23).multiply(23)
                        .byte()
                        .selfMask();
        
print('playa23',playa23)

var urbano24 = ee.Image(dirTransv +'URBANA/INTEGRACION/PERU-URBAN-'+param.versionTransversal.urbano24)
                  .eq(24).multiply(24)
                  .byte()
                  .selfMask();
                  
print('urbano24',urbano24)

var mining30 = ee.Image(dirTransv +'MINERIA/INTEGRACION/PERU-MINING-'+param.versionTransversal.mining30)
                .eq(30).multiply(30)
                .byte()
                .selfMask()

print('mining30',mining30)

var fnnfinund11 = ee.Image(dirTransv + 'INUNDABLES/INTEGRACION/PERU-WETLAND-' + param.versionTransversal.fnnfinund11)
                    .eq(11).multiply(11)
                    .byte()
                    .selfMask();
print('fnnfinund11',fnnfinund11)

// Water
var clasif_water = ee.ImageCollection('projects/mapbiomas-raisg/MAPBIOMAS-WATER/COLECCION2/PERU/POSTPROCESSING/05-remap-0'+param.versionTransversal.agua33)
var years = ee.List.sequence(1985,2023).getInfo()
var agua33 = ee.Image([]).select([])
  years.forEach(function(year){
    var clasif_water_year = clasif_water.filter(ee.Filter.eq('year',year)).mosaic()
    var clasif_agua_total = clasif_water_year.gte(1).and(clasif_water_year.lte(3)).selfMask()
    var clasif_agua_frec1 = clasif_agua_total.reduce(ee.Reducer.sum()).gte(6).selfMask()
    agua33 = agua33.addBands(clasif_agua_frec1.rename('classification_'+year))
  })

var agua33 = agua33
                .eq(1).multiply(33)
                .byte()
                .selfMask()
                
print('agua33',agua33)

var glaciar34 = ee.Image('projects/mapbiomas-raisg/PRODUCTOS/AGUA/COLECCION01/glacier-integracion-'+param.versionTransversal.glaciar34)
                .eq(34).multiply(34)
                .byte()
                .selfMask();
                
print('glaciar34',glaciar34)

var palma35 = ee.Image('projects/mapbiomas-raisg/MAPBIOMAS-PERU/COLECCION3/TRANSVERSALES/PALMA/INTEGRACION/PERU-PALM-'+param.versionTransversal.palma35)
              .eq(35).multiply(35)
              .byte()
              .selfMask();
  
print('palma35',palma35)

// Integración de clasificaciones
var integracion_coll = ee.List([])
var integracion_gener = ee.List([])
var integracion_list_remap = ee.List([]);
param.codesAndVersions.forEach(function(codeAndVersion){
  
  var region = codeAndVersion[0];
  var versionRegion = codeAndVersion[1];
  
  var ClassGeneralList = ee.ImageCollection(dirinput)
                      .filterMetadata('version', 'equals', versionRegion)
                      .filterMetadata('code_region', 'equals', region)
                      .mosaic()
                      .byte();

  
  var regionsRaster = ee.Image(regionesclassRaster).eq(region).selfMask();
  
  var regioV = ee.FeatureCollection(regionesclass)
                    .filterMetadata("id_regionC","equals", region);
                    
  var ClassGeneral = ClassGeneralList.updateMask(regionsRaster)
                      
  integracion_gener = integracion_gener.add(ClassGeneral)
  
  var assetsClasificaciones = {
      '6-T': bosqinund6,
      '9-T' : plantacion9,
      '11-T': fnnfinund11,
      '15-T': pastos15,
      '18-T': agricultura18,
      '21-T': agricultura21,
      '23-T': playa23,
      '24-T': urbano24,
      '30-T': mining30,
      '33-T': agua33,
      '34-T': glaciar34,
      '35-T': palma35,
      '3-G': ClassGeneral.eq(3).multiply(3).selfMask(),
      '4-G': ClassGeneral.eq(4).multiply(4).selfMask(),
      '6-G': ClassGeneral.eq(6).multiply(6).selfMask(),
      '9-G': ClassGeneral.eq(9).multiply(9).selfMask(),
      '11-G': ClassGeneral.eq(11).multiply(11).selfMask(),
      '12-G': ClassGeneral.eq(12).multiply(12).selfMask(),
      '13-G': ClassGeneral.eq(13).multiply(13).selfMask(),
      '15-G': ClassGeneral.eq(15).multiply(15).selfMask(),
      '18-G': ClassGeneral.eq(18).multiply(18).selfMask(),
      '21-G': ClassGeneral.eq(21).multiply(21).selfMask(),
      '23-G': ClassGeneral.eq(23).multiply(23).selfMask(),
      '24-G': ClassGeneral.eq(24).multiply(24).selfMask(),
      '25-G': ClassGeneral.eq(25).multiply(25).selfMask(),
      '27-G': ClassGeneral.eq(27).multiply(27).selfMask(),
      '29-G': ClassGeneral.eq(29).multiply(29).selfMask(),
      '30-G': ClassGeneral.eq(30).multiply(30).selfMask(),
      '31-G': ClassGeneral.eq(31).multiply(31).selfMask(),
      '33-G': ClassGeneral.eq(33).multiply(33).selfMask(),
      '34-G': ClassGeneral.eq(34).multiply(34).selfMask(),
      '35-G': ClassGeneral.eq(35).multiply(35).selfMask(),
      '68-G': ClassGeneral.eq(68).multiply(68).selfMask(),
      }
      
  var list_integrate = ee.List(param.ReglasIntegracion).reverse().getInfo()
  
  var integracion_v1 = ClassGeneral.multiply(0).add(27);

  list_integrate.forEach(function(clase) {
          integracion_v1 = integracion_v1.blend(ee.Image(assetsClasificaciones[clase[0]+'-'+clase[1]]))
  });
  var prefixo_out = param.pais+ '-' + region + '-' + param.version_output;

  integracion_v1 = integracion_v1.toByte().updateMask(regionsRaster);

  var polygons = param.remapGeometry;
  var integracion_remap = remapWithPolygons(integracion_v1, polygons, years);
  
  integracion_remap = integracion_remap//.updateMask(regionsRaster)
                              .set('code_region', region)
                              .set('pais', param.pais)
                              .set('version', param.version_output)
                              .set('descripcion', 'integracion');
  
  // Exportación de la imagen remapeada
  Export.image.toAsset({
    'image': integracion_remap, // Cambiado de integracion_v1 a integracion_list_remap
    'description': prefixo_out,
    'assetId': dirout+'/'+ prefixo_out,
    'pyramidingPolicy': {
        '.default': 'mode'
    },
    'region': regioV.geometry().bounds(),
    'scale': 30,
    'maxPixels': 1e13
  });

  integracion_coll = integracion_coll.add(integracion_v1); // Cambiado de integracion_v1 a integracion_list_remap
  integracion_list_remap = integracion_list_remap.add(integracion_remap); // Cambiado de integracion_v1 a integracion_list_remap

  if(param.exportArea) {
    var patchAreaCalc = require('users/raisgmb01/projects-mapbiomas:mapbiomas-peru/collection-5/modules/CalcularAreaRaster.js');
    patchAreaCalc.Clasif_Area_Calc(integracion_list_remap, bandNames.getInfo(), 30, regionsRaster, 'Area_IntegracionCol5_pe', 'Area-'+prefixo_out); // Cambiado de integracion_v1 a integracion_list_remap
  }

})

var integracion_list = ee.ImageCollection(integracion_coll).mosaic()
var integracion_list_remap = ee.ImageCollection(integracion_list_remap).mosaic()

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

print(regionsRasterList)
regionsRasterList = ee.ImageCollection(regionsRasterList).mosaic()

var integra = ee.ImageCollection(integracion_gener).mosaic();
print(integra, regionsRasterList)

// REMAP------------------------------------------------------------------------------------
var remap = function (datos_integrado){
  var remapCollection = ee.FeatureCollection(
      assetsRemap.map(
          function (item) {
              return ee.FeatureCollection(item);
          }
      )
  ).flatten();
  
  var integratedRemaped = remapCollection.iterate(
      function (feature, image) {
          image = ee.Image(image);
  
          var polygon = ee.FeatureCollection(feature);
          var original = ee.Image().paint(polygon, 'class_original')
              .clipToBoundsAndScale(polygon.geometry(), null, null, null, 30);
  
          var final = ee.Image().paint(polygon, 'class_final')
              .clipToBoundsAndScale(polygon.geometry(), null, null, null, 30);
  
          return image.where(image.eq(original), final);
      },
      datos_integrado
  );
  
  return integratedRemaped
}

/// REMAP POR PERIODO -----------------------

function remapWithPolygons(imageYear, polygons, years) {
  
  if(polygons.length > 0) {  
    polygons.forEach(function( polygon ) {
      
      var excluded = polygon.map(function( layer ){
        
        var area = imageYear.clip(layer);
        var from = ee.String(layer.get('original')).split(',');
        var to = ee.String(layer.get('new')).split(',');
        
        var t0 = ee.Number.parse(layer.get('t0'));
        var t1 = ee.Number.parse( layer.get('t1') );
        var yearsSel = ee.List.sequence(t0,t1,1);

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

for (var yearI = 0; yearI < param.years.length; yearI++) {
    var vis = {
        'bands': 'classification_'+param.years[yearI],
        'min': 0,
        'max': 62,
        'palette': mapbiomasPalette
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
  Map.addLayer(
      integra.updateMask(regionsRasterList),
      vis, 'classifGeneral' + '-' + param.years[yearI], false
    );
    
  var yearbosqinund6 = bosqinund6.select('classification_' + param.years[yearI]);
  var yearplantacion9 = plantacion9.select('classification_' + param.years[yearI]);
  var yearFnnfinund11 = fnnfinund11.select('classification_' + param.years[yearI]);
  var yearPastos15 = pastos15.select('classification_' + param.years[yearI]);
  var yearagricultura18 = agricultura18.select('classification_' + param.years[yearI]);
  var yearMosaic21transv = agricultura21.select('classification_' + param.years[yearI]);
  var yearplaya23 = playa23.select('classification_' + param.years[yearI]);
  var yearUrbano = urbano24.select('classification_' + param.years[yearI]);
  var yearMining = mining30.select('classification_' + param.years[yearI]);
  var yearAgua33 = agua33.select('classification_' + param.years[yearI]); 
  var yearGlaciar = glaciar34.select('classification_' + param.years[yearI]); 
  var yearPalma = palma35.select('classification_' + param.years[yearI]); 

  var listTrans = [
                  [yearbosqinund6, 'Bosque Inundable'],
                  [yearplantacion9,'plantacion9'],
                  [yearFnnfinund11,'Fnnfinund'], 
                  [yearPastos15,'Pastos15'],
                  [yearagricultura18,'agricultura18'],
                  [yearMosaic21transv,'MosaicCultivo21'],
                  [yearplaya23,'Playa'], 
                  [yearUrbano,'Urbano'], 
                  [yearMining,'Mineria'], 
                  [yearAgua33,'Agua'], 
                  [yearGlaciar,'Glaciar'],
                  [yearPalma,'Palma'],
                  ];
  
  listTrans.forEach(function(transv){
    Map.addLayer(transv[0].updateMask(regionsRasterList), vis, transv[1] + '-' + param.years[yearI],false
  )
  });
  
  if(param.piramide){
    Map.addLayer(
      integracion_list,
      vis, 'integracion' + '-' + param.years[yearI]
    )
    Map.addLayer(
      integracion_list_remap,
      vis, 'integracion' + '-remap-' + param.years[yearI]
    )
  } //else {
    //Map.addLayer(
    //  integracion_list.reproject('EPSG:4326', null, 30),
    //  vis, 'integracion' + '-' + param.years[yearI]
    //)
  //}
}

/*/**************************************************************
// Añadimos una leyenda para la visualización de colores
//**************************************************************
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
  value: 'Clases definidas para la colección 3 PE (paleta v8)',
  style: {
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
          backgroundColor:  color,
          fontSize: '10px',
          padding: '6px',
          margin: '0 0 4px 0'
        }
      });
 
var description = ui.Label({
        value: name,
        style: {
          margin: '0 0 4px 6px',
          fontSize: '10px',
        }
      });
      return ui.Panel({
        widgets: [colorBox, description],
        layout: ui.Panel.Layout.Flow('horizontal')
      });
};

var Elemento =[
    [mapbiomasPalette[3],'C03-Formación Forestal'],  
    [mapbiomasPalette[4],'C04-Bosque abierto'],
    [mapbiomasPalette[6],'C06-Bosque inundable'],     
    [mapbiomasPalette[9],'C09-Plantación Forestal'], 
    [mapbiomasPalette[10],'C10-Formación Natural no Forestal'], 
    [mapbiomasPalette[11],'C11-Area inundable Natural no Forestal'], 
    [mapbiomasPalette[12],'C12-Formación campestre'], 
    [mapbiomasPalette[13],'C13-Otra Formación no Forestal'],
    [mapbiomasPalette[14],'C14-Agropecuario'],         
    [mapbiomasPalette[15],'C15-Pasto'],            
    [mapbiomasPalette[17],'C17-Arbustal'],         
    [mapbiomasPalette[18],'C18-Agricultura'],         
    [mapbiomasPalette[21],'C21-Mosaico de Agricultura o Pastura'], 
    [mapbiomasPalette[22],'C22-Area sin Vegetación'],  
    [mapbiomasPalette[23],'C23-Playas'],  
    [mapbiomasPalette[24],'C24-Infraestrutura Urbana'],
    [mapbiomasPalette[25],'C25-Otra Area no Vegetada'],
    [mapbiomasPalette[29],'C29-Afloramento Rocoso'],   
    [mapbiomasPalette[30],'C30-Mineria'],            
    [mapbiomasPalette[33],'C33-Cuerpo de agua'],       
    [mapbiomasPalette[34],'C34-Glaciar'],            
    [mapbiomasPalette[35],'C35-Palma Aceitera'],
    [mapbiomasPalette[62],'C62-Salar']
  ]

Elemento.forEach(function(ele){
  legend.add(makeRow(ele[0], ele[1]))
})
Map.add(legend);*/


var assetregionVectors= paths.regionVector
var RegionVector = ee.FeatureCollection(assetregionVectors)

Map.addLayer(RegionVector.style({fillColor: '00000000',color:'black', width: 1}), {}, 'RegionVector')

