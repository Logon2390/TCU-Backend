# Estructura del Proyecto NestJS
Este documento describe la estructura del proyecto y las convenciones adoptadas para garantizar una arquitectura escalable y mantenible en NestJS.

## Ejemplo de estructura de Carpetas
/src
  /modules
    /users
        users.controller.ts
        users.service.ts
        users.repository.ts
        create-user.dto.ts
        update-user.dto.ts
        users.module.ts
    /auth
        auth.controller.ts
        auth.service.ts
        jwt.strategy.ts
        local.strategy.ts
        jwt.guard.ts
        auth.module.ts
  /core
    /config
      config.module.ts
      config.service.ts
    /exceptions
      exception.filter.ts
    /interceptors
      logging.interceptor.ts
    /middlewares
      request-logger.middleware.ts
  /infrastructure
    /database
      prisma.service.ts
    /utils
      helpers.ts
      constants.ts
  /main.ts

## Descripción de Carpetas

### 1. `modules/` (Módulos de la aplicación)
Cada módulo tiene su propia carpeta dentro de modules la cual tendrá:
- Un archivo `controller`, `service`, `repository`,`dto`, y/o cualquier archivo pertinente perteneciente al modulo.
- El archivo `module` que unifica a todas las demás.

*Carpeta 2 generado por chatGPT, sujeto a cambio o eliminación*
### 2. `core/` (Núcleo de la aplicación)
Contiene configuraciones globales y utilidades reutilizables:
- `config/`: Manejo de variables de entorno y configuración.
- `exceptions/`: Centraliza el manejo de excepciones.
- `interceptors/`: Modifica solicitudes y respuestas.
- `middlewares/`: Procesa las solicitudes antes de llegar a los controladores.

### 3. `infrastructure/` (Capa de infraestructura)
Se generan dos carpetas con usos especificos, las cuales son:
- Carpeta `database/`la cual permite tener archivos relacionados a la conexión a DB
- Carpeta `utils/` la cual permite tener funciones auxiliares y constantes para el proyecto.