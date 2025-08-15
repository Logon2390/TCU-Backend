// Exportar todos los servicios modulares para facilitar las importaciones

export { StatsCacheService } from './stats-cache.service';
export { ReportStrategyService } from './report-strategy.service';
export { QueryBuilderService } from './query-builder.service';
export { DataProcessorService } from './data-processor.service';
export { ReportGeneratorsService } from './report-generators.service';
export { BasicStatsService } from './basic-stats.service';

// También exportar tipos y interfaces comunes
export * from '../interfaces/report-statistics.interface';
export * from '../stats.config';
