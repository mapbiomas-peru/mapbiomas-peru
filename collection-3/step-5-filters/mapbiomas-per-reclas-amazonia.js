/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var imageVisParam = {"opacity":1,"bands":["Agricultura_2020_MINAGRI"],"min":0,"max":34,"palette":["ffffff","129912","1f4423","006400","00ff00","687537","76a5af","29eee4","77a605","935132","bbfcac","45c2a5","b8af4f","f1c232","ffffb2","ffd966","f6b26b","f99f40","e974ed","d5a6bd","c27ba0","ff3d4f","ea9999","dd7e6b","aa0000","ff99ff","0000ff","d5d5e5","dd497f","b2ae7c","af2a2a","8a2be2","968c46","0000ff","4fd3ff"]},
    imageVisParam2 = {"opacity":1,"bands":["Agricultura_2020_MINAGRI"],"min":0,"max":34,"palette":["ffffff","129912","1f4423","006400","00ff00","687537","76a5af","29eee4","77a605","935132","bbfcac","45c2a5","b8af4f","f1c232","ffffb2","ffd966","f6b26b","f99f40","e974ed","d5a6bd","c27ba0","fdff2b","ea9999","dd7e6b","aa0000","ff99ff","0000ff","d5d5e5","dd497f","b2ae7c","af2a2a","8a2be2","968c46","0000ff","4fd3ff"]},
    image = ee.Image("projects/mapbiomas-raisg/MAPBIOMAS-PERU/COLECCION3/MUESTRAS/PERDIDA-BOSQUE-2024/polygons-Peru-inclusion-perdida-2023"),
    geometry = /* color: #d63000 */ee.Geometry.Point([-78.16773496750842, -5.0966552618221606]),
    imageVisParam3 = {"opacity":1,"bands":["sum"],"palette":["f53aff"]};
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// LIMPIEZA POR PIXEL ESTABLE Y CAPAS REFERENCIA MINAM Y MIDAGRI
// Aplicado por region de clasificacion

var param = {
    ID_pais: 8,
    pais: 'PERU',
    region: 70203,
    year: 1986,          // Solo visualizacion
    version_input: 14,
    version_output:15,
    // ATENCION: EDITAR LOS CONDICIONALES EN LAS LINEAS 180 A 200
    periodo: [1985,2023], // Indicar el periodo para el reclass
    dist_buffer: 300,       // metros
    inc_agua_buffer: true,      // Incluir clase hidrografia al buffer
    inc_dez_buffer: true,
    inc_geometrias: true, // true: Agrega geometrias dibujadas por practicantes
    // use_stablePixel: false //condicionar remap pixel estable aplicado para todos los años
};

var palettes = require('users/mapbiomas/modules:Palettes.js');
var dirs = require('users/mapbiomasperu/mapbiomas-lulc:collection-3/modules/CollectionDirectories-cloud.js');
var paths = dirs.listpaths(param.country);
var assetClasif = paths.classification;
var assetFiltros = paths.clasificacionFiltros
var dirout  = paths.clasificacionFiltros
var regionesclass = paths.regionVectorBuffer
var pathpixelstable = 'projects/mapbiomas-raisg/MUESTRAS/'+ param.pais + '/COLECCION5/MUESTRAS_ESTABLES/muestras-estables/ME-' + param.pais  +'-' + param.region + '-1'
var AssetMosaic= [ paths.mosaics_c4_raisg,  paths.mosaics_c4_nexgen]

// var assetMosaic =  'projects/nexgenmap/MapBiomas2/LANDSAT/PANAMAZON/mosaics-2';
var assetCountries = 'projects/mapbiomas-raisg/DATOS_AUXILIARES/VECTORES/paises-2';
var assetNoBosque2000 = ee.Image('projects/mapbiomas-peru/assets/LAND-COVER/AUXILIARY-DATA/RASTER/PNCB_Bosque_No_Bosque_2022')
                         .eq(2).selfMask(); //'No bosque 2000 PNCB'
var assetPerdida2022 = ee.Image('projects/mapbiomas-peru/assets/LAND-COVER/AUXILIARY-DATA/RASTER/PNCB_Bosque_No_Bosque_2022')
                        .eq(3).selfMask(); // 'Pérdida 2001-2022 PNCB'
var assetHidrografia = ee.Image('projects/mapbiomas-peru/assets/LAND-COVER/COLLECTION3/WATER/MASCARA/ACUMULADO-TOTAL-WATER-ARROZ')
                      .eq(33).selfMask(); // 'Hidrografía PNCB'
var assetBosque2022 = ee.Image('projects/mapbiomas-peru/assets/LAND-COVER/AUXILIARY-DATA/RASTER/PNCB_Bosque_No_Bosque_2022')
                        .eq(5).selfMask(); // 'Bosque 2022 PNCB'
var assetMidagri2020 = "projects/mapbiomas-peru/assets/LAND-COVER/AUXILIARY-DATA/RASTER/per_midagri2020"; // superficie agricola 2020
var geomPerdida2023 = "projects/mapbiomas-peru/assets/LAND-COVER/COLLECTION3/GENERAL/SAMPLES/PERDIDA-BOSQUE-2024/polygons-Peru-inclusion-perdida-2023"

var deslizamiento = 'projects/mapbiomas-peru/assets/LAND-COVER/COLLECTION3/GENERAL/SAMPLES/PERDIDA-BOSQUE-2024/polygons-Peru-SectoresDeslizamiento-raster'

var region = ee.FeatureCollection(regionesclass).filterMetadata('id_regionC', 'equals', param.region)

//print(assetHidrografia, 'assetHidrografia')
//Map.addLayer(assetHidrografia, {palette:'blue'}, 'assetHidrografia')
var palettes = require('users/mapbiomas/modules:Palettes.js');
var pal = palettes.get('classification8');
var vis = {
      bands: 'classification_'+param.year,
      min:0,
      max:62,
      palette: pal,
      format: 'png'
    };

var setVersion = function(item) { return item.set('version', 1) };
var regionesRaster = region
                      .map(setVersion)
                      .reduceToImage({
  properties: ['version'],
  reducer: ee.Reducer.first(),
  });

print(regionesRaster, 'regionesRaster')   
Map.addLayer(regionesRaster, {}, 'regionesRaster', false)
var pixelstable = ee.Image(pathpixelstable)
print(pixelstable)

var Classif_Input
if(param.version_input == 1 || param.version_input == 2){
    var assetPath = assetClasif + '/' + param.pais + '-' + param.region;
    Classif_Input = ee.Image(assetPath  + '-' + param.version_input);
   } else {
    Classif_Input = ee.ImageCollection(assetFiltros)
              .filterMetadata('code_region', 'equals', param.region)
              .filterMetadata('version', 'equals', param.version_input)
              .min();
   }
   


print(Classif_Input,'Classif_Input')
             

//***************************************************************************************

var country = ee.FeatureCollection(assetCountries).filterMetadata('name', 'equals', 'Perú');

// Capa de No bosque 2000 PNCB
var Hidrografia = ee.Image(assetHidrografia)
                  .updateMask(regionesRaster);
Hidrografia = ee.Image(0).where(Hidrografia,Hidrografia)
                .rename('hidro')
                .updateMask(regionesRaster)  


// Capa de No bosque 2000 PNCB
var NoBosque2000 = ee.Image(assetNoBosque2000)
                  .updateMask(regionesRaster);
                  
// Capa de Perdida de PNCB
var Perdida2022 = ee.Image(assetPerdida2022)
                  .updateMask(regionesRaster);
                  
var Deslizamiento = ee.Image(deslizamiento)
                    .updateMask(regionesRaster);

// Capa de geometrias creadas por practicantes 
var inclusion_raster = ee.Image(geomPerdida2023).updateMask(regionesRaster)

//Map.addLayer(inclusion_raster, {palette:'purple'}, 'geometrias de perdida 2023 digitalizadas', false);
//Map.addLayer(Perdida2022, {palette: 'red'}, 'Perdida 2022', false);

// Blend de Pérdida PNCB con Geometrias para formar la Pérdida actualizada
if(param.inc_geometrias){

var Perdida2023 = Perdida2022.addBands(inclusion_raster)
                  .reduce(ee.Reducer.sum());
}
print(Perdida2023, ' Perdida2023')
//Map.addLayer(Perdida2023, {palette: 'orange'},'Perdida2023 (Perdida22+geometrias)', false)   

// Aplica un filtro espatial
var conect = Perdida2023.connectedPixelCount(100).rename('connected')

var moda = Perdida2023.select(0).focal_mode(1, 'square', 'pixels')

moda = moda.mask(conect.select('connected').lte(5))

var Perdida2023_filtrada = Perdida2023.select([0]).blend(moda)

print(moda, 'moda')

print(Perdida2023_filtrada, 'Perdida2023_filtrada')

// -------APLICACION DE BUFFER A LAS CLASES QUE SE DESEEN AGRUPAR

//Incluye clase hidrografia en el buffer si se cumple la condición "true"

var AreaIntervenida = Perdida2023_filtrada.eq(1).addBands(NoBosque2000.eq(1))
                                                .reduce(ee.Reducer.sum());
//Map.addLayer(NoBosque2000.eq(1), {palette: 'green'}, 'NoBosque2000.eq(1)')
 
if(param.inc_agua_buffer){
  AreaIntervenida = AreaIntervenida.eq(1).addBands(Hidrografia.eq(1)).reduce(ee.Reducer.sum());
  } else {
  AreaIntervenida = AreaIntervenida.eq(1);
}

if(param.inc_dez_buffer){
  AreaIntervenida = AreaIntervenida.eq(1).addBands(Deslizamiento.eq(1)).reduce(ee.Reducer.sum());
  } else {
  AreaIntervenida = AreaIntervenida.eq(1);
}

var buffer = ee.Image(1)
    .cumulativeCost({
      source: AreaIntervenida, 
      maxDistance: param.dist_buffer,
    }).lt(param.dist_buffer);

buffer = ee.Image(0).where(buffer.eq(1), 1)


// Condicionales para reclasificar el resultado de mapbiomas

var years = []
for (var y = param.periodo[0]; y <= param.periodo[1]; y++) {years.push(y)}

var bandNamesPeriodo = ee.List(
    years.map(
        function (year) {
            return 'classification_' + String(year);
        }
    )
);

print(bandNamesPeriodo, 'bandNamesPeriodo')
var Classif_Reclass =  Classif_Input.select(bandNamesPeriodo)

                                     // Para limpiar ruidos de clasificacion en bosque 3  (desactivar los necesarios)
                                      .where(Classif_Input.select(bandNamesPeriodo).eq(21)
                                        .and(buffer.neq(1)), 3)
                                      .where(Classif_Input.select(bandNamesPeriodo).eq(25)
                                        .and(buffer.neq(1)), 3)  
                                      .where(Classif_Input.select(bandNamesPeriodo).eq(33)
                                        .and(buffer.neq(1)), 3)
                                      .where(Classif_Input.select(bandNamesPeriodo).eq(33)
                                        .and(Hidrografia.eq(1).not()), 3)

                                     // Para limpiar ruidos de sombra en pastizal/matorral  (desactivar los necesarios)
                                      .where(Classif_Input.select(bandNamesPeriodo).eq(33)
                                        .and(Hidrografia.neq(1)), 12)                                        
                                      .where(Classif_Input.select(bandNamesPeriodo).eq(33)
                                        .and(Hidrografia.neq(1)), 13)

                                      // Para reclasificar hacia deslizamientos (natural sin vegetacion 68) (desactivar los necesarios)
                                      .where(Classif_Input.select(bandNamesPeriodo).eq(21)
                                        .and(Deslizamiento.eq(1)), 68)
                                      .where(Classif_Input.select(bandNamesPeriodo).eq(25)
                                        .and(Deslizamiento.eq(1)), 68)
                                      .where(Classif_Input.select(bandNamesPeriodo).eq(33)
                                        .and(Deslizamiento.eq(1)), 68)

                                      // Para reclasificar hacia playas (clase 23) (desactivar los necesarios)
                                      .where(Classif_Input.select(bandNamesPeriodo).eq(25)
                                        .and(Hidrografia.eq(1)), 23)
;
                                        
Classif_Reclass = Classif_Input.addBands(Classif_Reclass, null, true)

print('Classif_Reclass: ', Classif_Reclass )
var remapDif = Classif_Reclass.select('classification_'+param.year)
              .neq(Classif_Input.select('classification_'+param.year))



var mosaicRegion = param.region.toString().slice(0, 3);
var collMosaic = ee.ImageCollection(AssetMosaic[0]).merge(ee.ImageCollection(AssetMosaic[1]))
            .filterMetadata('region_code', 'equals', Number(mosaicRegion))
            .select(['swir1_median', 'nir_median', 'red_median'])
            .filterMetadata('year', 'equals', param.year);
            
Map.addLayer(collMosaic.mosaic().updateMask(regionesRaster), {
        'bands': ['swir1_median', 'nir_median', 'red_median'],
        "min":150,
        "max":4700,
   }, 'Mosaic-'+param.year, false)
   
if(param.use_stablePixel !== true){
Map.addLayer(Classif_Input
            .reproject('EPSG:4326', null, 30), 
            vis, 'Resultado original '+param.year, false);
}
Map.addLayer(Classif_Reclass
            .reproject('EPSG:4326', null, 30),
            vis, 'Resultado reclasificado '+param.year, false);



Map.addLayer(Perdida2023_filtrada
            .reproject('EPSG:4326', null, 30), 
            {palette:'red'}, 'Perdida2023_MINAM_filtrada', false)
Map.addLayer(Deslizamiento, {palette:'green'}, 'Deslizamientos IBC', false);
Map.addLayer(Hidrografia.selfMask(), {palette:'blue'}, 'Hidrografia MB', false);
Map.addLayer(AreaIntervenida.selfMask(), 
            {palette: ["f53aff"]}, 'Area Intervenida (Perdida+Desliz+Hidro)', false)
Map.addLayer(buffer.mask(buffer)
            .reproject('EPSG:4326', null, 30), 
            {min: 0, max: 1, palette: ['ff4c3b'], opacity:0.5}, 'Area Intervenida + buffer', false);
Map.addLayer(remapDif.updateMask(remapDif),
            //.reproject('EPSG:4326', null, 30), 
            {max:1, min:0, palette: 'red'}, 'Pixeles Reclasificados', true) 



Classif_Reclass = Classif_Reclass.byte()
          .set('code_region', param.region)
          .set('pais', param.pais)
          .set('version', param.version_output)
          .set('descripcion', 'filtro bosque')
          .set('paso', 'P14');
          
print('Classif_Reclass',Classif_Reclass)


var prefijo_out = param.pais+ '-' + param.region + '-' +  param.version_output;

Export.image.toAsset({
    'image': Classif_Reclass.byte(),
    'description': prefijo_out,
    'assetId': dirout+'/'+prefijo_out,
    'pyramidingPolicy': {
        '.default': 'mode'
    },
    'region': region.geometry().bounds(),
    'scale': 30,
    'maxPixels': 1e13
});






// APUNTES REF
// Script de recuperacion de pixeles estables
//  recuperar los pixeles estables de la coll 3 y remplazaria a la col4
//  col3 estable clase 3, col4 estable clase 12.   revisar
//  col3 estable clase 3, col4 no estable clase 12.   remplaza la col 3

//preferencia bosque y agricultura


