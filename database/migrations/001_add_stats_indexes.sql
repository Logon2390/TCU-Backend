-- Migración para agregar índices optimizados a la tabla de estadísticas
-- Ejecutar después de crear la tabla

-- Índice compuesto para consultas por fecha y usuario (muy común)
CREATE INDEX IF NOT EXISTS idx_stats_entrydatetime_userid 
ON stats (entryDateTime, userId);

-- Índice para consultas por año y mes
CREATE INDEX IF NOT EXISTS idx_stats_year_month 
ON stats (year, month);

-- Índice para consultas por género y edad
CREATE INDEX IF NOT EXISTS idx_stats_gender_age 
ON stats (gender, age);

-- Índice para consultas por estado y fecha
CREATE INDEX IF NOT EXISTS idx_stats_status_entrydatetime 
ON stats (status, entryDateTime);

-- Índice para consultas de rango de fechas
CREATE INDEX IF NOT EXISTS idx_stats_entrydatetime_asc 
ON stats (entryDateTime ASC);

-- Índice para consultas de rango de fechas descendente
CREATE INDEX IF NOT EXISTS idx_stats_entrydatetime_desc 
ON stats (entryDateTime DESC);

-- Índice parcial para usuarios registrados (evita NULL)
CREATE INDEX IF NOT EXISTS idx_stats_userid_not_null 
ON stats (userId) WHERE userId IS NOT NULL;

-- Índice para consultas de edad
CREATE INDEX IF NOT EXISTS idx_stats_age 
ON stats (age);

-- Índice compuesto para consultas complejas
CREATE INDEX IF NOT EXISTS idx_stats_complex_query 
ON stats (entryDateTime, gender, age, status);

-- Estadísticas de la tabla para el optimizador de consultas
ANALYZE stats;

-- Comentarios sobre el uso de índices
COMMENT ON INDEX idx_stats_entrydatetime_userid IS 'Optimiza consultas por rango de fechas y usuario específico';
COMMENT ON INDEX idx_stats_year_month IS 'Optimiza consultas por período anual/mensual';
COMMENT ON INDEX idx_stats_gender_age IS 'Optimiza consultas de distribución demográfica';
COMMENT ON INDEX idx_stats_status_entrydatetime IS 'Optimiza consultas por estado y período';
COMMENT ON INDEX idx_stats_complex_query IS 'Optimiza consultas complejas con múltiples filtros';
