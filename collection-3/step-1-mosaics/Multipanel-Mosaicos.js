/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry_21 = /* color: #d63000 */ee.Geometry.MultiPoint(),
    geometry_12 = /* color: #d63000 */ee.Geometry.Polygon(
        [[[-70.5798842022956, 6.067846207204013],
          [-70.5798842022956, 6.067035383348475],
          [-70.57911172609931, 6.067035383348475],
          [-70.57911172609931, 6.067846207204013]]], null, false),
    image = ee.Image("projects/mapbiomas-raisg/MAPBIOMAS-PERU/REFERENCE/mb-peru-regiones-mosaico-2");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var param = {
    'code_region': 70206,
    'country': 'PERU',
    'paso': 'CO', // CO: CLASIFICACION ORIGINAL,  CF: Clasificacion con filtros
    'version_input': '1',
};

var pais ='Peru'
// var CodRegMosaico = 304 // solo ingresar una region de mosaico de referencia  para captar todo el pais

// var result 
// if (param.paso == 'CO'){
//     result = 'projects/mapbiomas-raisg/TRANSVERSALES/'+param.country+'/COLECCION5/URBANA/clasificacion';
// } else {
//     result = 'projects/mapbiomas-raisg/TRANSVERSALES/'+param.country+'/COLECCION5/URBANA/clasificacion-ft';
// }

var regionesclass = ee.FeatureCollection('projects/mapbiomas-raisg/DATOS_AUXILIARES/VECTORES/PERU/per-clasificacion-regiones-5'); 
var regionesMOS = ee.Image("projects/mapbiomas-raisg/MAPBIOMAS-PERU/DATOS-AUXILIARES/RASTER/mb-peru-regiones-mosaico-2");

var years = [ 1985, 1986, 1987, 1988, 1989, 1990, 
              1991, 1992, 1993, 1994, 1995, 1996, 
              1997, 1998, 1999, 2000, 2001, 2002, 
              2003, 2004, 2005, 2006, 2007, 2008, 
              2009, 2010, 2011, 2012, 2013, 2014, 
              2015, 2016, 2017, 2018, 2019, 2020, 
              2021, 2022, 2023
              ];

// *************** Ruta - Mosaicos

var asset = 'projects/nexgenmap/MapBiomas2/LANDSAT/PANAMAZON/mosaics-2';
var mosaics = [
        'projects/nexgenmap/MapBiomas2/LANDSAT/PANAMAZON/mosaics-2',
        'projects/mapbiomas-raisg/MOSAICOS/mosaics-2'
          ];


    // var joinedMosaics = ee.ImageCollection(mosaics[0]).merge(ee.ImageCollection(mosaics[1]))
    //               .filterMetadata('region_code', 'equals', Number(mosaicRegion))



var regionclas = regionesclass.filterMetadata('id_regionC', 'equals', param.code_region);
// print(regionclas)

// var collection 
// if (param.paso == 'CO'){
//     collection = ee.ImageCollection(result)
//                 .filterMetadata('region', 'equals', param.code_region)
//                 .filterMetadata('version', 'equals', param.version_input)
// } else {
//     collection = ee.ImageCollection(result)
//                 .filter(ee.Filter.neq('descripcion', 'gapfill metadata'))
//                 .filterMetadata('code_region', 'equals', param.code_region)
//                 .filterMetadata('version', 'equals', param.version_input)
// }

// **************** Carga de mosaicos
var collection2 = ee.ImageCollection(mosaics[0]).merge(ee.ImageCollection(mosaics[1]))
                //.filterMetadata('region_code', 'equals', param.code_region)
                .filter(ee.Filter.eq('country',pais.toUpperCase()))

collection2 = collection2
                        .map(
                            function (image) {
                                return image.updateMask(
                                    regionesMOS.eq(ee.Number.parse(image.get('region_code')).toInt16()));
                            }
                        );

// print(collection2)

var maps = [],
    map,
    mosaic,
    mosaic2;
    

for (var i = 0; i < years.length; i++) {

    // mosaic = collection.mosaic().select('classification_'+ String(years[i]));
    mosaic2 = collection2.filterMetadata('year', 'equals',years[i])
                      //.filterBounds(regions2.geometry().bounds())
                      // .mosaic()
                       //.clip(regions);
                       //.clip(assetmos)
    map = ui.Map();
    
    //Herramienta de Dibujo 
    
    map = ui.Map();
    map.drawingTools().setLinked(true);

    map.add(ui.Label(String(years[i]), {
        'position': 'bottom-left',
        'fontWeight': 'bold'
    }));
    
    
    map.addLayer(mosaic2.mean().clip(regionclas), {
        'bands': ['swir1_median', 'nir_median', 'red_median'],
        'gain':[0.08,0.06,0.2],
        // 'min':200,
        // 'max':4000
    }, years[i]+' green', true);
    
    map.addLayer(mosaic2.mean().clip(regionclas), {
        'bands': ['nir_median', 'swir1_median', 'red_median'],
        'gain':[0.06,0.08,0.2],
        // 'min':200,
        // 'max':4000
    }, years[i]+' red', false);
    
    map.addLayer(mosaic2.mean().clip(regionclas), {
        'bands': ['swir2_median', 'swir1_median', 'red_median'],
        'gain':[0.1, 0.06, 0.1],
        // 'min':200,
        // 'max':4000
    }, years[i]+' beta',false);
    
    
    // map.addLayer(mosaic, {
    // "bands": 'classification_'+ String(years[i]), //classification
    // "min": 0,
    // "max": 34,
    // "palette": "ffffff,129912,1f4423,006400,00ff00,687537,76a5af,29eee4,77a605,"+
    // "935132,bbfcac,45c2a5,b8af4f,f1c232,ffffb2,ffd966,f6b26b,f99f40,"+
    // "e974ed,d5a6bd,c27ba0,fff3bf,ea9999,dd7e6b,aa0000,ff99ff,0000ff,"+
    // "d5d5e5,dd497f,b2ae7c,af2a2a,8a2be2,968c46,0000ff,4fd3ff",
    //     "format": "png"
    // }, years[i]+'a');
    


    map.addLayer(regionclas.style({fillColor: '00000000', color:'blue'}),{},
        'regiones',true
    );
    
    
    

    maps.push(map);
}

// blank map
maps.push(ui.Map());

var linker = ui.Map.Linker(maps);



// Create a title.
var title = ui.Label('Mosaic Collection 1 - Mapbiomas Peru - '+param.code_region, {
    stretch: 'horizontal',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: '24px',

});

// Create a grid of maps.
var mapGrid = ui.Panel([
    ui.Panel([maps[0], maps[1], maps[2], maps[3], maps[4], maps[5], maps[6]],
            ui.Panel.Layout.Flow('horizontal'), {
                stretch: 'both'
            }),
    ui.Panel([maps[7], maps[8], maps[9], maps[10], maps[11], maps[12], maps[13]],
            ui.Panel.Layout.Flow('horizontal'), {
                stretch: 'both'
            }),
    ui.Panel([maps[14], maps[15], maps[16], maps[17], maps[18], maps[19], maps[20]],
            ui.Panel.Layout.Flow('horizontal'), {
                stretch: 'both'
            }),
    ui.Panel([maps[21], maps[22], maps[23], maps[24], maps[25], maps[26], maps[27]],
            ui.Panel.Layout.Flow('horizontal'), {
                stretch: 'both'
            }),
    ui.Panel([maps[28], maps[29], maps[30], maps[31], maps[32], maps[33], maps[34]],
            ui.Panel.Layout.Flow('horizontal'), {
                stretch: 'both'
            }),
    ui.Panel([maps[35], maps[36], maps[37], maps[38]],
            ui.Panel.Layout.Flow('horizontal'), {
                stretch: 'both'
            }),
  ],
    ui.Panel.Layout.Flow('vertical'), {
        stretch: 'both'
    }
);

// Add the maps and title to the ui.root.
ui.root.widgets().reset([title, mapGrid]);
ui.root.setLayout(ui.Panel.Layout.Flow('vertical'));

maps[0].centerObject(regionclas,7);
