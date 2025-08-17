export const StatsConfig = {
  // Configuración de cache
  CACHE: {
    TTL: 5 * 60 * 1000, // 5 minutos
    MAX_SIZE: 100, // Máximo número de elementos en cache
    CLEANUP_INTERVAL: 10 * 60 * 1000, // 10 minutos
  },

  // Configuración de paginación
  PAGINATION: {
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
    MAX_PAGE_SIZE: 1000, // Para reportes grandes
  },

  // Umbrales para optimizaciones - ESCALABLE PARA GRANDES VOLÚMENES
  THRESHOLDS: {
    SMALL_DATASET: 1000,      // < 1K registros: método estándar
    MEDIUM_DATASET: 5000,     // 1K-5K registros: optimizaciones básicas
    LARGE_DATASET: 25000,     // 5K-25K registros: consultas SQL optimizadas
    MASSIVE_DATASET: 100000,  // 25K-100K registros: procesamiento en lotes
    HUGE_DATASET: 1000000,    // > 100K registros: particionamiento y streaming
    
    // Tamaños de lote adaptativos
    BATCH_SIZE_SMALL: 500,    // Para datasets medianos
    BATCH_SIZE_MEDIUM: 1000,  // Para datasets grandes
    BATCH_SIZE_LARGE: 2500,   // Para datasets masivos
    BATCH_SIZE_HUGE: 5000,    // Para datasets enormes
    
    MEMORY_LIMIT: 100 * 1024 * 1024, // 100MB límite de memoria (aumentado)
  },

  // Configuración de consultas SQL
  QUERY: {
    TIMEOUT: 60000,           // 60 segundos timeout (aumentado para consultas pesadas)
    MAX_RESULTS: 500000,      // Máximo resultados por consulta (aumentado)
    USE_INDEX_HINTS: true,    // Usar hints de índice
    ENABLE_PARALLEL: true,    // Habilitar consultas paralelas cuando sea posible
  },

  // Configuración de exportación
  EXPORT: {
    MAX_RECORDS: 1000000,     // Máximo registros para exportar (1M)
    CHUNK_SIZE: 5000,         // Tamaño de chunk para exportación
    FORMATS: ['csv', 'xlsx', 'pdf'],
    ENABLE_STREAMING: true,   // Habilitar exportación en streaming
  },

  // Configuración de particionamiento
  PARTITIONING: {
    ENABLED: true,
    DEFAULT_PARTITION_SIZE: 30,    // Días por partición
    MAX_PARTITIONS: 100,           // Máximo número de particiones
    PARALLEL_PROCESSING: true,     // Procesamiento paralelo de particiones
  },

  // Configuración de monitoreo
  MONITORING: {
    ENABLE_PERFORMANCE_LOGGING: true,
    SLOW_QUERY_THRESHOLD: 1000,   // Log queries que tomen más de 1 segundo
    MEMORY_USAGE_ALERT: 80,        // Alerta cuando uso de memoria > 80%
    CACHE_HIT_RATIO_TARGET: 0.8,  // Target de 80% hit ratio en cache
  },
};
