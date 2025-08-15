Add API documentation for reports module
# API de Reportes - Sistema de Centro Cívico
## Descripción General

Este módulo permite generar reportes detallados de visitas al centro cívico, incluyendo estadísticas por edad, género, rangos etarios y exportación a PDF. **Todos los endpoints están integrados en el módulo de estadísticas (`/stats`)**.

## Endpoints Disponibles

### 1. Generar Reporte Personalizado
**POST** `/stats/reports/generate`

Genera un reporte completo con filtros personalizables.

**Body:**
```json
{
  "startDate": "2025-01-01",
  "endDate": "2025-01-31",
  "gender": "F",           // Opcional: "F", "M", "O"
  "minAge": 18,            // Opcional: edad mínima
  "maxAge": 65,            // Opcional: edad máxima
  "ageRange": "juventud",  // Opcional: "infancia", "juventud", "adultez_joven", "adultez_media", "vejez"
  "userId": 123,           // Opcional: ID de usuario específico
  "status": "registrada"   // Opcional: "registrada", "anulada"
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Reporte generado correctamente",
  "data": {
    "totalVisits": 150,
    "totalUsers": 120,
    "genderDistribution": {
      "F": 85,
      "M": 60,
      "O": 5
    },
    "ageRangeDistribution": {
      "infancia": 20,
      "juventud": 45,
      "adultez_joven": 50,
      "adultez_media": 25,
      "vejez": 10
    },
    "averageAge": 32,
    "visitsByDate": [
      {"date": "2025-01-01", "count": 5},
      {"date": "2025-01-02", "count": 8}
    ],
    "topUsers": [
      {"userId": 1, "userName": "Juan Pérez", "visitCount": 15}
    ]
  }
}
```

### 2. Reporte Mensual Automático
**GET** `/stats/reports/monthly-report/:year/:month`

Genera automáticamente un reporte del mes completo.

**Ejemplo:** `/stats/reports/monthly-report/2025/1` (Enero 2025)

### 3. Estadísticas por Rangos de Edad
**GET** `/stats/reports/age-range-stats`

Obtiene solo las estadísticas de distribución por rangos de edad.

**Query Parameters:** Mismos que el endpoint de generación de reportes.

### 4. Estadísticas por Género
**GET** `/stats/reports/gender-stats`

Obtiene solo las estadísticas de distribución por género.

**Query Parameters:** Mismos que el endpoint de generación de reportes.

### 5. Historial de Visitas
**GET** `/stats/reports/visit-history`

Consulta el historial de visitas con filtros y paginación.

**Query Parameters:**
```json
{
  "userId": 123,           // Opcional: ID de usuario específico
  "startDate": "2025-01-01", // Opcional: fecha de inicio
  "endDate": "2025-01-31",   // Opcional: fecha de fin
  "status": "registrada",     // Opcional: estado de la visita
  "page": 1,                  // Opcional: página (default: 1)
  "limit": 20                 // Opcional: elementos por página (default: 20)
}
```

### 6. Exportar a PDF
**POST** `/stats/reports/export-pdf`

Exporta el reporte generado a formato PDF.

**Body:** Mismo formato que el endpoint de generación de reportes.

## Rangos de Edad Definidos

- **Infancia:** 0-14 años
- **Juventud:** 15-24 años
- **Adultez Joven:** 25-44 años
- **Adultez Media:** 45-64 años
- **Vejez:** 65+ años

## Permisos Requeridos

Todos los endpoints requieren autenticación JWT y rol de Moderador (`M`) o Administrador (`A`).

## Ejemplos de Uso

### Reporte del Mes de Enero 2025
```bash
curl -X POST http://localhost:3000/stats/reports/generate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2025-01-01",
    "endDate": "2025-01-31"
  }'
```

### Reporte Solo de Mujeres Jóvenes
```bash
curl -X POST http://localhost:3000/stats/reports/generate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2025-01-01",
    "endDate": "2025-01-31",
    "gender": "F",
    "ageRange": "juventud"
  }'
```

### Historial de un Usuario Específico
```bash
curl -X GET "http://localhost:3000/stats/reports/visit-history?userId=123&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Notas de Implementación

- **Todo integrado en el módulo de estadísticas** - no hay duplicación de código
- El sistema utiliza la entidad `Stats` existente para obtener los datos
- Los reportes se generan en tiempo real basándose en los filtros aplicados
- La exportación a PDF está preparada pero requiere implementación adicional (jsPDF, puppeteer, etc.)
- Todos los cálculos estadísticos se realizan en el servidor para mayor precisión
- El sistema incluye paginación para el historial de visitas
- Los filtros son opcionales y se pueden combinar según las necesidades

## Próximas Mejoras

1. **Exportación a Excel/CSV**
2. **Gráficos y visualizaciones**
3. **Reportes programados automáticos**
4. **Plantillas de reportes personalizables**
5. **Notificaciones por email de reportes completados**
