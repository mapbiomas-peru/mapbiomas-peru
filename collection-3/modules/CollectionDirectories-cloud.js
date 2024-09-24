exports.listpaths = function(country){return {  
   
  /**  
   * Rutas generales usadas en toda la metodología 
   */ 
          mensaje: country,
      // GENERAL
          regionVector:       'projects/mapbiomas-peru/assets/LAND-COVER/COLLECTION3/AUXILIARY-DATA/VECTOR/per-regiones-clasificacion-mbperu-3',
          regionVectorBuffer: 'projects/mapbiomas-peru/assets/LAND-COVER/COLLECTION3/AUXILIARY-DATA/VECTOR/per-regiones-clasificacion-mbperu-3',
          regionClasRaster:   'projects/mapbiomas-peru/assets/LAND-COVER/COLLECTION3/AUXILIARY-DATA/RASTER/per-regiones-clasificacion-mbperu-3',
          regionMosVector:    'projects/mapbiomas-peru/assets/LAND-COVER/COLLECTION3/AUXILIARY-DATA/VECTOR/per-regiones-mosaicos-mbperu-3',
          regionMosRaster:    'projects/mapbiomas-peru/assets/LAND-COVER/COLLECTION3/AUXILIARY-DATA/RASTER/per-regiones-mosaicos-mbperu-3',
          grids:'projects/mapbiomas-peru/assets/LAND-COVER/COLLECTION3/AUXILIARY-DATA/VECTOR/grid-world',


      // GENERAL
        mosaics_c3_v2: 'projects/nexgenmap/MapBiomas2/LANDSAT/PANAMAZON/mosaics-1', //mosaicos hasta el 2021,
        
        mosaics_c4_raisg: 'projects/mapbiomas-raisg/MOSAICOS/mosaics-2', //mosaicos del 2022 y 2023
        mosaics_c4_nexgen:'projects/nexgenmap/MapBiomas2/LANDSAT/PANAMAZON/mosaics-2', //mosaicos de 1985-2021
        
        
        mosaics: 'projects/nexgenmap/MapBiomas2/LANDSAT/PANAMAZON/', //colecciones de mosaico
        terrain:       'JAXA/ALOS/AW3D30_V1_1', //DEM
        collection1:   'projects/mapbiomas-raisg/COLECCION1/integracion',
        collection2: 'projects/mapbiomas-raisg/SUBPRODUCTOS/MOORE/classification/mapbiomas-raisg-collection20-integration-v8',
        collection3: 'projects/mapbiomas-raisg/public/collection3/mapbiomas_raisg_panamazonia_collection3_integration_v2',
        collection4: 'projects/mapbiomas-raisg/public/collection4/mapbiomas_raisg_panamazonia_collection4_integration_v1',
        collection5: "projects/mapbiomas-raisg/public/collection5/mapbiomas_raisg_panamazonia_collection5_integration_v1",
        collection6: "projects/mapbiomas-raisg/public/collection5/mapbiomas_raisg_panamazonia_collection6_integration_v1",   
        collection1_PE: "projects/mapbiomas-public/assets/peru/collection1/mapbiomas_peru_collection1_integration_v1",
        collection2_PE: "projects/mapbiomas-peru/assets/LAND-COVER/COLLECTION2/INTEGRATION/mapbiomas_peru_collection2_integration_v1",
        Ref_lulc2: "users/mapbiomas_c1/lulc2",
    
  /**
   * Rutas correspondientes al step-3
   */
  basePath: 'projects/mapbiomas-peru/assets/LAND-COVER/COLLECTION3/',
  muestrasestables: 'projects/mapbiomas-peru/assets/LAND-COVER/COLLECTION3/GENERAL/SAMPLES/',
  pixelesEstables: 'projects/mapbiomas-peru/assets/LAND-COVER/COLLECTION3/GENERAL/STABLE/pixeles-estables/', 

  trainingPoints01: 'projects/mapbiomas-peru/assets/LAND-COVER/COLLECTION3/GENERAL/SAMPLES/TRAINING/',
  AreasClass: 'projects/mapbiomas-peru/assets/LAND-COVER/COLLECTION3/GENERAL/SAMPLES/AREAS_CLASE_REGION/',

  /**
   * Rutas correspondientes al  step-4
   */
      // AMBITO PERU 
       classification:       'projects/mapbiomas-peru/assets/LAND-COVER/COLLECTION3/GENERAL/classification',
       clasificacionFiltros: 'projects/mapbiomas-peru/assets/LAND-COVER/COLLECTION3/GENERAL/classification-ft',
       filtrosMetadata:      'projects/mapbiomas-raisg/MAPBIOMAS-PERU/COLECCION3/metadata',
       integracion:          'asset=projects/mapbiomas-peru/assets/LAND-COVER/COLLECTION3/INTEGRATION',
       transversales:        'asset=projects/mapbiomas-peru/assets/LAND-COVER/COLLECTION3/'

}
  
};

















