import { Injectable, Logger } from '@nestjs/common';
import { StatsConfig } from '../stats.config';

@Injectable()
export class StatsCacheService {
    private readonly logger = new Logger(StatsCacheService.name);
    private readonly cache = new Map<string, { data: any; timestamp: number }>();
    private readonly CACHE_TTL = StatsConfig.CACHE.TTL;
    private readonly MAX_SIZE = StatsConfig.CACHE.MAX_SIZE;

    /**
     * Obtiene datos del cache si no han expirado
     */
    get(key: string): any | null {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            return cached.data;
        }
        this.cache.delete(key);
        return null;
    }

    /**
     * Guarda datos en el cache con timestamp
     */
    set(key: string, data: any): void {
        this.cache.set(key, { data, timestamp: Date.now() });
        
        // Limpiar cache si es muy grande
        if (this.cache.size > this.MAX_SIZE) {
            const oldestKey = this.cache.keys().next().value;
            this.cache.delete(oldestKey);
            this.logger.debug(`Cache limpiado, eliminada clave: ${oldestKey}`);
        }
    }

    /**
     * Verifica si una clave existe en el cache
     */
    has(key: string): boolean {
        const cached = this.cache.get(key);
        return !!(cached && Date.now() - cached.timestamp < this.CACHE_TTL);
    }

    /**
     * Elimina una clave específica del cache
     */
    delete(key: string): boolean {
        return this.cache.delete(key);
    }

    /**
     * Limpia todo el cache
     */
    clear(): void {
        this.cache.clear();
        this.logger.log('Cache limpiado completamente');
    }

    /**
     * Obtiene estadísticas del cache
     */
    getStats() {
        return {
            size: this.cache.size,
            maxSize: this.MAX_SIZE,
            ttl: this.CACHE_TTL,
            hitRate: this.calculateHitRate()
        };
    }

    /**
     * Calcula el hit rate del cache
     */
    private calculateHitRate(): number {
        // Implementación básica - en producción se podría usar métricas más avanzadas
        return this.cache.size / this.MAX_SIZE;
    }

    /**
     * Genera clave de cache para reportes
     */
    generateReportKey(params: {
        startDate: string;
        endDate: string;
        gender?: string;
        minAge?: number;
        maxAge?: number;
        userId?: number;
        status?: string;
        ageRange?: string;
    }): string {
        return `report_${params.startDate}_${params.endDate}_${params.gender || 'all'}_${params.minAge || 'all'}_${params.maxAge || 'all'}_${params.userId || 'all'}_${params.status || 'all'}_${params.ageRange || 'all'}`;
    }
}
