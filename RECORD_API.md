# API de Registro de Visitas

## Descripción
El sistema de registro de visitas ha sido actualizado para funcionar con el número de cédula (documento) del usuario en lugar de requerir un ID de usuario preexistente.

## Endpoints

### Crear Registro de Visita
**POST** `/records`

**Cuerpo de la petición:**
```json
{
  "document": "1234567890",        // Número de cédula (requerido)
  "moduleId": 1,                   // ID del módulo (requerido)
  "date": "2024-01-15",           // Fecha de la visita (requerido)
  "name": "Juan Pérez",           // Nombre (requerido solo si el usuario no existe)
  "gender": "M",                  // Género: "F", "M", "O" (requerido solo si el usuario no existe)
  "birthday": "1990-05-15"        // Fecha de nacimiento (opcional)
}
```

**Comportamiento:**
1. Si el usuario con el documento proporcionado existe:
   - Se actualiza su `lastRecord` con la fecha de la visita
   - Se crea el registro de visita
2. Si el usuario no existe:
   - Se crea un nuevo usuario con los datos proporcionados
   - Se crea el registro de visita
   - Los campos `name` y `gender` son obligatorios para crear un nuevo usuario

**Respuesta exitosa:**
```json
{
  "id": 1,
  "user": {
    "id": 1,
    "name": "Juan Pérez",
    "document": "1234567890",
    "gender": "M",
    "birthday": "1990-05-15",
    "lastRecord": "2024-01-15"
  },
  "module": {
    "id": 1,
    "name": "Biblioteca"
  },
  "date": "2024-01-15"
}
```

### Obtener Todos los Registros
**GET** `/records`

### Obtener Registro por ID
**GET** `/records/:id`

### Obtener Registros por Usuario
**GET** `/records/user/:document`

**Ejemplo:** `GET /records/user/1234567890`

### Obtener Registros por Módulo
**GET** `/records/module/:moduleId`

**Ejemplo:** `GET /records/module/1`

### Actualizar Registro
**PATCH** `/records/:id`

**Cuerpo de la petición:**
```json
{
  "document": "1234567890",        // Nuevo documento (opcional)
  "moduleId": 2,                   // Nuevo módulo (opcional)
  "date": "2024-01-16",           // Nueva fecha (opcional)
  "name": "Juan Pérez",           // Nombre (requerido si se crea nuevo usuario)
  "gender": "M"                   // Género (requerido si se crea nuevo usuario)
}
```

### Eliminar Registro
**DELETE** `/records/:id`

## Ejemplos de Uso

### Ejemplo 1: Usuario existente
```json
POST /records
{
  "document": "1234567890",
  "moduleId": 1,
  "date": "2024-01-15"
}
```

### Ejemplo 2: Usuario nuevo
```json
POST /records
{
  "document": "9876543210",
  "moduleId": 1,
  "date": "2024-01-15",
  "name": "María García",
  "gender": "F",
  "birthday": "1985-03-20"
}
```

## Notas Importantes

1. **Documento único:** Cada usuario debe tener un documento único
2. **Campos obligatorios para nuevos usuarios:** `name` y `gender` son requeridos cuando se crea un nuevo usuario
3. **Actualización automática:** El campo `lastRecord` del usuario se actualiza automáticamente con cada nueva visita
4. **Relaciones:** Los registros incluyen automáticamente la información del usuario y módulo relacionado 