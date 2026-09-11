MI CAMPO — CONTEXTO IA

1. Qué es MI CAMPO

MI CAMPO es una plataforma de gestión agronómica y económica orientada a:

registrar actividades por campo, lote y campaña;

valorizar costos;

controlar compras y stock;

registrar riego y cosecha;

analizar resultados;

conservar historia productiva;

permitir consultas rápidas mediante IA;

mantener trazabilidad y seguridad.

Principio rector:

Cargar poco, calcular mucho.

2. Estructura principal

La jerarquía conceptual es:

Empresa → Campo → Lote → Campaña → Cultivo → Actividades → Costos → Producción → Resultado

Campañas:

Fina 2026

Gruesa 2026/27

El lote es la unidad productiva mínima habitual.

3. Reglas críticas

Costos

Todos los costos terminan expresados en USD.

Siempre conservar moneda original, valor original, tipo de cambio y fecha.

Los costos deben poder reconstruirse.

Distinguir dato original de cálculo.

IVA

Se recuperan hasta 10,5 puntos porcentuales.

La parte no recuperable forma parte del costo.

Mostrar contado/financiado con y sin IVA no recuperable.

Campañas

Mientras una campaña está abierta, los ponderados pueden cambiar.

Al cerrar una campaña, los costos quedan congelados.

Compras posteriores no deben modificar campañas cerradas.

Stock

Vista principal por producto.

Ubicaciones: Proveedor, Planta, Campo.

Planta puede dividirse en A1, A2, etc.

Toda aplicación descuenta stock desde Campo.

Ajustes requieren motivo obligatorio.

Actividades

Guardar cantidad total usada y superficie efectiva.

Calcular dosis por ha.

Una actividad puede repartirse entre varios lotes proporcionalmente.

Siembra con fertilización es una sola actividad de Siembra.

El fertilizante computa analíticamente como fertilización sin duplicar costo.

Riego

Guardar fecha, lote, superficie, mm y pozo.

Riego eléctrico: distribuir costo por mm × ha.

Combustible: tratar como stock valorizado.

Facturas y documentos originales deben conservarse.

4. Usuarios y permisos

Administrador

puede ver y modificar todo.

Dueño de la empresa

solo lectura;

ve todos los campos;

ve actividades, costos, gasto proyectado, riego y rendimiento;

no necesita ver stock general, compras detalladas ni acuerdos internos.

S.A.G.

solo lectura + comentarios;

acceso a La Nazarena.

D.L.A.

solo lectura + comentarios;

acceso a Montoya Cravero y Guma.

Los permisos deben configurarse por usuario y campo, no por nombres fijos en código.

5. WhatsApp

Cada usuario puede tener un número asociado.

El número define identidad y permisos.

El bot puede saludar por nombre y según la hora.

Número no registrado: no responder nada.

La IA puede consultar libremente.

No puede modificar datos persistentes sin confirmación.

6. Seguridad

Usuario + contraseña segura.

Segundo factor por código de WhatsApp.

Sesión web: cerrar tras 30 minutos sin actividad.

Datos críticos: guardar historial de cambios.

Registros importantes: anular, no borrar.

Acciones sensibles: pedir confirmación.

Cambios especialmente sensibles: pedir motivo.

7. Backups

Backup automático diario.

Backup histórico quincenal.

Al menos una copia fuera del servidor principal.

Backup previo a migraciones, cambios estructurales y cierres relevantes.

Alertar si pasan 7 días sin un backup válido.

Mostrar siempre fecha/hora del último backup correcto.

8. Notas y memoria agronómica

Notas de lote

texto;

fecha;

autor;

foto opcional;

recordatorio opcional.

Memoria agronómica general

Tipos:

Observación;

Recomendación;

Aprendizaje.

La IA debe distinguir:

dato medido;

observación humana;

conclusión de IA.

9. Interfaz

Navegación:

Empresa → Campos → Lotes → Campaña/Cultivo → Línea de tiempo

La interfaz debe ser:

simple;

visual;

didáctica;

no saturada.

Principio:

Lo frecuente visible; lo eventual accesible.

La línea de tiempo del lote debe ser compacta y desplegable.

10. Desarrollo

No trabajar directamente sobre main.

Usar una rama nueva, por ejemplo:

reestructuracion-v2

Antes de cambios estructurales:

backup del proyecto;

backup de datos.

La aplicación actual no se descarta.

Antes de eliminar una función:

revisar para qué sirve;

decidir si se conserva, migra o transforma.

11. Archivos que una IA debe leer primero

Orden recomendado:

CONTEXTO_IA.md

DECISIONES_V2.md

MI_CAMPO_ESPECIFICACION_V2.md

PLAN_REFACTORIZACION_V2.md

Solo después, los archivos de código del módulo que se vaya a trabajar.

No releer todo el proyecto en cada cambio.

12. Cómo trabajar con IA sin gastar contexto innecesario

Para cada tarea:

Identificar el módulo.

Leer CONTEXTO_IA.md.

Consultar DECISIONES_V2.md si hay reglas afectadas.

Abrir solo los archivos necesarios.

Hacer cambios pequeños y verificables.

Documentar decisiones nuevas.

No pedir “revisar todo el proyecto” salvo auditorías o migraciones grandes.

13. Fuente de verdad

MI_CAMPO_ESPECIFICACION_V2.md = cómo debe quedar el sistema.

DECISIONES_V2.md = reglas ya cerradas.

PLAN_REFACTORIZACION_V2.md = orden y método de implementación.

CONTEXTO_IA.md = resumen operativo para trabajar rápido.

Si una IA detecta una contradicción entre código y documentación:

detenerse;

señalarla;

pedir decisión;

actualizar documentación si corresponde;

recién después modificar código.
