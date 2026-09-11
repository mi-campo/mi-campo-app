MI CAMPO — PLAN DE REFACTORIZACIÓN V2

Objetivo: evolucionar la aplicación actual hacia la arquitectura definida en MI_CAMPO_ESPECIFICACION_V2.md y DECISIONES_V2.md, preservando datos, funcionalidades útiles y posibilidad de volver atrás.

1. Principios obligatorios

No trabajar directamente sobre main.

Crear una rama nueva para la reestructuración v2.

Hacer backup completo antes de cambios estructurales.

No eliminar datos ni funcionalidades existentes sin revisión previa.

Implementar por etapas.

Validar cada etapa antes de continuar.

Mantener la app actual operativa mientras se migra.

Toda migración debe ser reversible mientras esté en desarrollo.

MI_CAMPO_ESPECIFICACION_V2.md define cómo debe quedar el sistema.

DECISIONES_V2.md define reglas ya cerradas y no debe ser contradicho sin aprobación.

2. Preparación inicial

2.1 Crear rama de trabajo

Crear una rama, por ejemplo:

reestructuracion-v2

La rama main debe quedar intacta hasta que la v2 esté probada.

2.2 Crear backups

Antes de modificar estructura:

backup del repositorio actual;

backup del archivo de datos actual;

copia ZIP del proyecto;

copia externa del backup.

2.3 Registrar versión actual

Crear un punto de referencia con:

commit estable;

fecha;

versión;

descripción de funcionalidades actuales.

3. Auditoría de la app actual

Antes de programar la v2:

Leer la estructura completa del proyecto.

Identificar módulos existentes.

Revisar:

frontend;

backend;

autenticación;

bot de WhatsApp;

parser IA;

almacenamiento de datos;

compras;

stock;

riego;

costos;

usuarios;

mercado;

documentación.

Detectar qué funcionalidades:

se conservan;

se migran;

se transforman;

se descartan.

No descartar nada sin justificarlo.

Generar un informe corto:

AUDITORIA_V2.md

4. Diseñar el modelo de datos antes de cambiar pantallas

No empezar por diseño visual.

Primero crear el modelo de datos v2.

Entidades mínimas esperadas:

Empresa

Usuario

Participante

Campo

Lote

Campaña

Cultivo

Actividad

Insumo

Compra

MovimientoStock

StockUbicacion

Riego

Pozo

FacturaEnergia

CompraCombustible

Cosecha

Presupuesto

Costo

Acuerdo

AporteParticipante

Nota

MemoriaAgronomica

Documento

AuditoriaCambio

Recordatorio

Debe existir relación clara entre:

lote;

campaña;

cultivo;

actividad;

costo;

insumo;

participante.

5. Migrar de data.json a una base más segura

5.1 Primera opción

Usar SQLite para la primera etapa.

Objetivos:

evitar reescritura completa del archivo de datos;

mejorar consistencia;

permitir consultas por IA;

facilitar auditoría;

permitir crecimiento futuro.

5.2 No borrar data.json al inicio

Durante la migración:

conservar data.json;

crear la nueva base;

migrar datos;

comparar resultados;

mantener una herramienta de validación.

5.3 Script de migración

Crear un script reproducible:

migrate-json-to-sqlite.js

Debe:

leer datos existentes;

transformar estructura;

registrar errores;

no modificar el original;

generar un informe de migración.

5.4 Validación

Comparar:

cantidad de campos;

lotes;

actividades;

compras;

usuarios;

costos;

datos históricos.

No avanzar si faltan datos.

6. Crear capa de acceso a datos

No permitir que frontend o módulos escriban directamente sobre la base.

Crear una capa clara, por ejemplo:

services/
repositories/

Ejemplos:

campoService

loteService

actividadService

stockService

riegoService

costosService

participantesService

Objetivo:

una única lógica para leer/escribir;

facilitar auditoría;

evitar inconsistencias;

permitir cambiar SQLite por PostgreSQL más adelante.

7. Separar el frontend grande por módulos

El archivo actual de administración es demasiado grande.

No refactorizar todo de golpe.

Separar progresivamente por módulos:

Dashboard

Campos

Lotes

Campañas

Actividades

Compras

Stock

Riego

Cosecha

Participantes

Costos

Notas

IA

Seguridad

Cada módulo debe:

tener componentes propios;

consumir servicios claros;

evitar duplicar lógica.

8. Implementar primero el núcleo productivo

Orden recomendado:

Etapa 1

Empresa

Campos

Lotes

Campañas

Cultivos

Etapa 2

Siembra

Pulverización

Fertilización

Riego

Cosecha

Etapa 3

Línea de tiempo por lote

La línea de tiempo debe consumir datos reales, no información duplicada.

9. Actividades y costos

Cada actividad debe permitir:

fecha;

lote;

campaña;

superficie efectiva;

insumos;

cantidad total;

dosis calculada;

servicio;

costo de insumos;

costo de labor;

total.

Debe soportar:

aplicación parcial;

una actividad repartida entre varios lotes;

siembra con fertilizante sin duplicar costos;

costo por categoría analítica.

10. Compras y stock

Implementar después del núcleo productivo.

Compras

fecha de cierre;

proveedor;

producto;

cantidad;

precio contado;

financiación;

vencimiento;

moneda;

IVA;

ubicación inicial.

Stock

Ubicaciones:

Proveedor

Planta

Campo

Planta con subsectores:

A1

A2

etc.

Todo ajuste debe exigir motivo.

Todo consumo de actividad descuenta desde Campo.

11. Valorización

Crear lógica central de valorización.

Debe soportar:

costo contado;

costo financiado;

IVA recuperable;

IVA no recuperable;

conversión a USD;

promedio ponderado;

snapshot al cierre.

No dispersar estas fórmulas en distintos módulos.

Crear un servicio único de costos.

12. Cierre de campaña

Implementar una operación explícita:

Cerrar campaña

Al cerrar:

congelar ponderados;

congelar costos;

generar snapshot;

registrar usuario;

registrar fecha;

generar backup previo;

pedir confirmación;

dejar auditoría.

Una campaña cerrada no debe cambiar por compras posteriores.

13. Riego

Implementar como módulo independiente.

Eventos

fecha;

lote;

mm;

superficie;

pozo.

Pozos

Estados:

activo;

standby;

inactivo.

Energía eléctrica

carga de factura;

archivo original;

extracción asistida;

revisión manual;

tipo de cambio;

costo por mm·ha.

Combustible

stock por pozo;

compras;

consumo estimado;

valorización por orden de compra.

14. Participantes y acuerdos

No implementar reglas rígidas globales.

Crear un modelo flexible que permita:

participante;

campo;

lote;

campaña;

tipo de aporte;

porcentaje;

valor;

regla de compensación;

observaciones.

Los acuerdos complejos deben poder modelarse caso por caso.

No automatizar fórmulas especiales hasta validarlas manualmente.

15. Usuarios y permisos

Crear permisos por:

empresa;

campo;

tipo de acción.

Perfiles iniciales:

Administrador

lectura;

escritura;

edición;

anulación;

cierre;

gestión.

Dueño

solo lectura;

todos los campos autorizados.

Participante

solo lectura;

campos autorizados;

comentarios.

Los permisos no deben quedar hardcodeados por nombre.

16. WhatsApp

Vincular:

número;

usuario;

permisos.

Reglas:

número registrado: responde;

número no registrado: silencio total;

saludo por nombre;

acceso restringido a campos permitidos;

consultas sin modificación persistente.

Las escrituras por IA deben pedir confirmación.

17. Auditoría

Crear una tabla o mecanismo de auditoría.

Registrar:

entidad;

id;

valor anterior;

valor nuevo;

usuario;

fecha/hora;

motivo.

Aplicar a:

actividades;

compras;

stock;

costos;

riego;

cosecha;

acuerdos;

cierres.

18. Anulación

No borrar registros críticos.

Implementar:

estado activo/anulado;

usuario;

fecha;

motivo.

Los anulados no aparecen por defecto, pero sí en auditoría.

19. Seguridad

Sesiones

expiración tras 30 minutos sin actividad.

Segundo factor

Preparar código temporal por WhatsApp.

Acciones sensibles

Confirmación obligatoria.

Información sensible

Dejar el modelo preparado para permisos más finos aunque no se definan todos al inicio.

20. Backups

Implementar:

Diario

Backup automático.

Quincenal

Backup histórico.

Externo

Copia fuera del servidor principal.

Previos a operación sensible

Backup antes de:

cierre;

migración;

importación masiva;

cambio estructural.

Monitoreo

Mostrar:

último backup correcto.

Alertar solo si pasan 7 días sin backup válido.

21. Documentos

Crear almacenamiento de documentos separado de la base.

La base guarda:

tipo;

ubicación;

relación con entidad;

fecha;

metadatos.

El archivo original debe conservarse.

Tipos:

factura;

foto;

análisis;

mapa;

contrato;

otro.

22. Notas y memoria agronómica

Notas de lote

texto;

autor;

fecha;

foto;

recordatorio.

Memoria general

observación;

recomendación;

aprendizaje.

Debe poder ser consultada por IA.

23. Dashboard

No diseñarlo completamente al inicio.

Primera versión simple:

Empresa

Resumen por campo.

Campo

Lista de lotes.

Lote

Encabezado:

campaña;

cultivo;

superficie;

siembra;

variedad;

costo actual;

costo proyectado;

mm.

Luego:

línea de tiempo.

Evitar saturación.

24. IA y consultas

Crear una capa de consulta estructurada.

La IA no debe leer archivos enormes para cada pregunta.

Debe consultar datos mediante funciones/servicios.

Ejemplos:

hectáreas de maíz;

variedades por lote;

costo acumulado;

aplicaciones realizadas;

mm regados;

stock;

insumos pendientes;

rendimiento;

margen.

Esto reduce consumo de tokens y mejora precisión.

25. Contexto para IA

Crear CONTEXTO_IA.md.

Debe incluir solo:

arquitectura;

módulos;

reglas críticas;

estado actual;

archivos relevantes;

cambios recientes.

Las IAs deben leer:

CONTEXTO_IA.md

DECISIONES_V2.md

solo los archivos del módulo que van a modificar

No releer todo el proyecto en cada cambio.

26. Orden de implementación recomendado

Fase 0

rama nueva

backup

auditoría

Fase 1

modelo de datos

SQLite

migración

capa de servicios

Fase 2

empresa

campos

lotes

campañas

cultivos

Fase 3

actividades

costos

línea de tiempo

Fase 4

compras

stock

movimientos

Fase 5

riego

Fase 6

cosecha

resultados

Fase 7

participantes

acuerdos

Fase 8

usuarios

permisos

WhatsApp

Fase 9

notas

memoria agronómica

recordatorios

Fase 10

dashboard final

IA avanzada

gráficos

comparaciones

Fase futura

mapas de rendimiento

margen espacial

análisis por ambiente

27. Criterios de aceptación por fase

No avanzar de fase si no se cumple:

datos conservados;

cálculos reproducibles;

permisos correctos;

auditoría operativa;

backup disponible;

interfaz funcional;

pruebas básicas superadas;

no se rompe la versión estable.

28. Regla de cambios futuros

Si una IA encuentra una contradicción entre:

código existente;

especificación;

decisiones;

debe:

detener el cambio;

documentar la contradicción;

pedir decisión;

actualizar la documentación si corresponde;

recién después modificar código.

29. Resultado esperado

Al terminar la refactorización:

la app actual sigue preservada;

la v2 funciona en una rama separada;

los datos históricos están migrados;

los costos son trazables;

las campañas cerradas no cambian;

el stock está ordenado;

el riego se valoriza correctamente;

los participantes ven solo lo autorizado;

la IA consulta datos estructurados;

los cambios dejan auditoría;

los backups son automáticos;

la plataforma puede crecer sin rehacerse desde cero.

30. Próximo paso inmediato

Antes de programar:

subir este archivo al repositorio;

crear CONTEXTO_IA.md;

pedir a la IA de desarrollo una auditoría de la app actual;

crear rama reestructuracion-v2;

no modificar main;

no iniciar la migración hasta aprobar AUDITORIA_V2.md.
