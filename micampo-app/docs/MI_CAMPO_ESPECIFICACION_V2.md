MI CAMPO — Especificación Funcional v2

1. Propósito del sistema

MI CAMPO debe ser una plataforma de gestión agronómica y económica orientada a registrar de forma simple lo que sucede en el campo, valorizarlo, conservar su historia y permitir consultarlo rápidamente mediante IA.

Principio rector: cargar poco, calcular mucho.

Estructura principal:
Empresa → Campo → Lote → Campaña → Cultivo → Actividades → Costos → Producción → Resultado

La plataforma debe priorizar simplicidad de carga, trazabilidad, costos por hectárea, historia por lote, consulta rápida por IA, seguridad, respaldo de datos y capacidad de crecer sin perder información histórica.

2. Empresas

El sistema debe permitir más de una empresa, aunque inicialmente se trabaje principalmente con una. Cada empresa mantendrá separados sus campos, lotes, campañas, participantes, compras, stock, costos, documentos, usuarios y permisos.

3. Participantes

Se utilizará el concepto Participante y no necesariamente “Socio”, porque una persona o empresa puede participar solo en determinados negocios.

Ejemplo conceptual:

Participante principal o titular.

S.A.G.: participa en La Nazarena.

D.L.A.: participa en Montoya Cravero y Guma.

La participación puede variar según campo, lote o campaña.

4. Campos

Cada campo debe contener: nombre, superficie total, condición de tenencia, propietario si corresponde, participantes relacionados, condiciones particulares, lotes y notas generales.

5. Lotes

El lote es la unidad productiva mínima habitual. Cada lote debe tener nombre, superficie, tipo riego/secano, particularidades espaciales, relación con pozos, historial de campañas, rotación, notas permanentes y documentos asociados.

Los corners no serán una categoría independiente: serán lotes de secano con relación espacial particular con un círculo de riego.

6. Campañas

Nomenclatura:

Fina 2026

Gruesa 2026/27

Un mismo lote puede tener Fina 2026 → trigo y luego Gruesa 2026/27 → soja. La sucesión forma parte de la rotación.

La información debe poder consultarse por campaña, cultivo, campo, lote, variedad/híbrido y empresa.

7. Cultivo dentro de lote/campaña

Datos básicos: cultivo, variedad o híbrido, superficie, fecha de siembra, densidad, rendimiento esperado, rendimiento real, precio proyectado y precio final o de referencia.

8. Actividades agronómicas

8.1 Siembra

Puede ser siembra sola, siembra con fertilización o siembra al voleo cuando corresponda. Debe guardar fecha, lote, superficie efectiva, semilla, variedad/híbrido, cantidad total, dosis por ha calculada, fertilizante usado en la siembra si corresponde, kg/ha, costo de semilla, costo del fertilizante, costo del servicio y costo total.

No existirá una actividad separada llamada “fertilización incorporada en siembra”. La actividad es Siembra, pero el costo del fertilizante también debe computar analíticamente dentro de Fertilización, sin duplicar el costo.

8.2 Pulverización

Método: terrestre o dron. Guarda fecha, lote, superficie efectiva, insumos, cantidad total utilizada, dosis por ha calculada, costo de insumos, costo del servicio y costo total.

8.3 Fertilización

Método: voleo con voleadora o dron.

8.4 Cebo

Método: voleadora o dron.

8.5 Siembra al voleo

Método: voleadora o dron.

8.6 Riego

Registro individual por evento.

8.7 Cosecha

Registro de producción física.

8.8 Otras labores

Debe ser posible agregar nuevas actividades sin rehacer la arquitectura.

9. Superficie efectivamente trabajada

Una actividad no necesariamente cubre toda la superficie nominal del lote. Si una aplicación de 100 ha corresponde a 80 ha del lote A y 20 ha del lote B, el sistema debe repartir automáticamente insumos, cantidades y costos de forma proporcional.

10. Cantidad total y dosis

La gente de campo suele informar cantidad total usada y superficie aplicada. Ese será el dato original. El sistema calcula cantidad total / superficie efectiva = dosis por ha. La cantidad total original siempre debe conservarse.

11. Línea de tiempo del lote

Debe ser una vista principal y muy amigable, no una tabla pesada.

Ejemplo compacto:

08 JUN · SIEMBRA — 71 ha · Semilla + fertilizante · USD 175/ha

22 AGO · PULVERIZACIÓN — 71 ha · 3 productos · USD 34/ha

03 SEP · RIEGO — 20 mm · USD 18/ha

Al desplegar se muestra el detalle. Principio visual: primero comprender, luego profundizar.

12. Compras

Una compra nace cuando se cierra el negocio, no cuando se retira o paga. Debe guardar producto, cantidad, proveedor, fecha de cierre, precio contado, precio financiado o datos para calcularlo, plazo, tasa mensual/anual, vencimiento, moneda, IVA y ubicación inicial.

13. Costos en USD

Todos los costos de gestión deben terminar expresados en USD. Se conserva importe original, moneda original, tipo de cambio utilizado, fecha del tipo de cambio y equivalente USD.

14. IVA

Regla actual: se recuperan hasta 10,5 puntos porcentuales de IVA. Deben conservarse neto, IVA total, IVA recuperable, IVA no recuperable y costo económico.

Mostrar:

contado sin IVA;

contado + IVA no recuperable;

financiado sin IVA;

financiado + IVA no recuperable.

15. Stock

La vista principal será por producto. Ejemplo: Urea — 18.400 kg; Proveedor 8.000 kg; Planta 6.400 kg; Campo 4.000 kg. Internamente se conservarán las compras individuales para la valorización.

16. Ubicaciones de stock

Proveedor: mercadería comprada y no retirada.

Planta: subdividida en sectores A1, A2, A3, etc.

Campo: depósito de campo.

Movimientos: Proveedor → Planta, Planta → Campo, Proveedor → Campo.

Cuando se aplica un insumo, se descuenta siempre desde Campo y pasa a costo/consumo del lote.

17. Movimientos y ajustes

Cada movimiento queda registrado. Los ajustes exigen motivo obligatorio, usuario y fecha. Los remanentes viejos se cargan como Stock inicial valorizado a precio de reposición y se distinguen de una compra real.

18. Valorización de insumos y cierre de campaña

Mientras una campaña está abierta, los precios promedio ponderados pueden actualizarse. Cuando una campaña se cierra, los costos quedan congelados y futuras compras no modifican esa campaña histórica.

Ejemplo: Fina 2026 cierra en noviembre. Una compra de diciembre no modifica su costo de urea.

Debe implementarse un snapshot económico al cierre.

19. Riego

Cada evento guarda fecha, lote, superficie efectiva, mm y pozo. Se permiten riegos completos o parciales.

20. Pozos

La Silvina

Pozo eléctrico: riega Círculo 1, Círculo 2, Círculo 3 Bustamante, Círculo 4 Efraín y Círculo 5 Efraín.

Existe un pozo a combustible todavía no operativo. Estado: STANDBY. No debe aparecer como opción normal hasta activarlo.

El Rosario

Pozo 1 / bomba oeste: habitualmente C3, C4 y C5; excepcionalmente C1 y C2.

Pozo 2 / bomba este: habitualmente C1 y C2; excepcionalmente C3, C4 y C5.

Estas relaciones son habituales, no rígidas.

21. Riego eléctrico

Se sube la factura original. El sistema debe extraer y permitir revisar fecha de emisión, período, importe, IVA, impuestos y otros conceptos. La factura original se conserva.

Tipo de cambio: primer día hábil posterior a la fecha de emisión.

El costo se reparte según mm × ha. Indicadores: costo mensual, costo por mm/ha, costo por lote, USD/ha, ponderado por cultivo y costo total del ciclo.

22. Riego a combustible

El combustible funciona como stock valorizado. Cada compra registra litros, precio, fecha, IVA, costo USD y depósito asociado al pozo. Se usa consumo de referencia del motor y relación horas/mm.

El combustible se consume siguiendo el orden de las compras. Si sobra, pasa al cultivo/campaña siguiente conservando su valor económico.

23. Indicadores de riego

Debe poder consultarse: mm totales por lote, USD/ha de riego por lote, costo por pozo, combustible vs eléctrico, costo mensual, historial de costo, costo ponderado y costo total por ciclo.

24. Cosecha

Cada movimiento: fecha, campo/lote, kg o tn, patente del camión o número de silobolsa. El sistema calcula kg acumulados, toneladas, rendimiento por lote y rendimiento promedio.

Por ahora no se profundiza en humedad, logística comercial detallada ni liquidaciones por camión.

25. Parámetros comerciales

Se podrán cargar precio proyectado del cultivo, precio final/promedio, flete promedio, gastos de comercialización y tarifas de labores.

26. Costos por actividad

Cada actividad puede tener insumos + servicio = costo de actividad.

Ejemplo Voleo de urea: Urea USD 62/ha + Servicio USD 8/ha = Total USD 70/ha.

27. Presupuesto

Se realiza al inicio de campaña. Se guarda como referencia. El sistema construye el real acumulado y permite comparar proyectado vs real y hacer escenarios con distintos rindes y precios.

28. Resultados

Debe poder calcular ingreso bruto, margen bruto, margen neto, ROI, rentabilidad, rendimiento de indiferencia, costo USD/ha, costo USD/t y comparación riego vs secano.

29. Participantes y acuerdos

No habrá una fórmula universal. Cada negocio puede tener su propia regla de aportes y reparto. Debe admitir excepciones por campaña, por ejemplo que un participante aporte semilla solo un año.

30. Alquileres

Pueden ser qq de soja fijos, una o dos fechas de fijación, fórmulas variables o acuerdos especiales por rendimiento. Si hay dos fijaciones, guardar ambas y calcular ponderado. Si una fecha es futura, dejarla pendiente y poder actualizar automáticamente al llegar.

31. Usuarios y permisos

Administrador

Puede ver, cargar, modificar, anular, ajustar stock, cerrar campañas y gestionar usuarios/permisos.

Dueño

Solo lectura de todos los campos. Puede ver actividades, aplicaciones, costos, costo acumulado, costo proyectado, riego, rendimiento y evolución. No necesita ver stock general, acuerdos, compras detalladas ni cuentas corrientes.

S.A.G.

Solo lectura + comentarios en La Nazarena.

D.L.A.

Solo lectura + comentarios en Montoya Cravero y Guma.

El modelo debe permitir futuros usuarios.

32. Acceso por WhatsApp

Cada usuario tendrá un número asociado. El bot identifica número, usuario, permisos y campos autorizados.

Saludo personalizado según horario y nombre preferido, por ejemplo “Hola Nico, buen día…” o “Hola Nacho, buenas tardes…”.

Número no registrado: no responder absolutamente nada. Puede registrarse internamente el intento.

33. IA: consultas y modificaciones

La IA puede consultar, calcular, comparar y analizar libremente, pero no puede modificar información persistente sin confirmación.

Toda acción de escritura importante debe ofrecer: Confirmar / Corregir / Cancelar.

34. Historial de cambios

Los datos críticos no deben sobrescribirse silenciosamente. Conservar valor anterior, valor nuevo, usuario, fecha/hora y motivo cuando corresponda.

35. Anulación

Los registros importantes no se borran físicamente. Se anulan, desaparecen de la vista normal y permanecen en auditoría con usuario, fecha y motivo.

36. Acciones sensibles

Cerrar campaña, anular aplicación, modificar compra, ajustar stock, cambiar costo consolidado, reasignar gastos o modificar acuerdos requieren confirmación. Las acciones especialmente sensibles también requieren motivo obligatorio.

37. Seguridad web

Usuario, contraseña segura, segundo factor y cierre automático después de 30 minutos sin actividad.

Segundo factor preferido: código temporal por WhatsApp al número previamente asociado, válido una sola vez y con vencimiento breve.

38. Backups

Base activa inicialmente: SQLite.

Backup automático diario.

Backup quincenal histórico.

Al menos una copia externa al servidor principal.

Backup previo a migraciones, importaciones masivas, cambios estructurales y cierres relevantes.

Si pasan 7 días sin un backup válido, alertar al administrador.

Mostrar siempre “Último backup correcto: fecha/hora”.

39. Documentos

Conservar originales de facturas, fotos, análisis, mapas, contratos y otros documentos. La base guarda relación, fecha y metadatos; el archivo original también se respalda.

40. Notas del lote

Cada lote puede tener notas permanentes con texto, fecha, autor, foto opcional y recordatorio opcional.

41. Memoria agronómica general

Base de conocimiento no necesariamente ligada a un lote. Tipos: Observación, Recomendación y Aprendizaje. Puede referirse a cultivos, variedades, híbridos, fertilización, riego, enfermedades, malezas, suelos y decisiones de manejo.

42. IA + memoria

La IA puede usar esa memoria, pero debe distinguir dato medido, observación humana y conclusión de IA.

43. Recordatorios desde notas

Una nota puede generar un recordatorio manteniendo su lote, contexto y fecha objetivo.

44. Dashboard principal

Navegación principal: Empresa → Campos → Lotes → Campaña/Cultivo → Línea de tiempo.

El dashboard de empresa debe priorizar un resumen limpio por campo, sin saturación de indicadores.

45. Pantalla de lote

Encabezado sugerido: C2 — Trigo — Fina 2026 — 71 ha.

Arriba: fecha de siembra, variedad/híbrido, costo actual, costo proyectado y mm de riego.

Debajo: línea de tiempo.

Accesos secundarios: presupuesto, análisis, notas, documentos, historial, acuerdos y auditoría.

Principio: Lo frecuente visible. Lo eventual disponible sin molestar.

46. IA por WhatsApp

Consultas rápidas: qué se hizo, cuándo, qué productos, aplicaciones, costos, costo/ha, mm regados, mm faltantes, fecha de siembra, variedad, híbrido, actividades pendientes, stock autorizado y mercadería pendiente de retirar autorizada.

47. IA en escritorio

Análisis con gráficos, tablas, comparaciones, históricos, escenarios, rankings, análisis por variedad, riego vs secano, tendencias de precios y márgenes. Los rankings no deben llenar el dashboard por defecto; se generan al pedirlos.

48. Análisis espacial futuro

La arquitectura debe permitir incorporar mapas de rendimiento, mapas de margen neto, porcentaje del lote sobre/debajo del rendimiento de indiferencia, ambientes, evolución histórica y comportamiento por variedad/híbrido.

49. Desarrollo seguro

No trabajar directamente sobre la versión estable.

main = versión actual estable.

rama nueva = v2 / reestructuración.

backup del proyecto actual.

backup de datos.

posibilidad de volver atrás.

50. La aplicación actual no se descarta

La app actual contiene datos, funcionalidades, conocimiento y reglas ya implementadas. La nueva versión no debe empezar de cero.

Antes de eliminar, modificar o reemplazar una funcionalidad existente, revisar para qué se usa y determinar si debe conservarse, migrarse o transformarse. No descartar información útil sin autorización.

La aplicación actual será fuente de información y contexto. Esta especificación será la fuente principal sobre cómo debe evolucionar la nueva estructura.

51. Principios de diseño

Cargar poco, calcular mucho.

Guardar siempre el dato original.

No mezclar dato con cálculo.

Todo costo termina expresado en USD.

Toda cifra debe poder reconstruirse.

Lo frecuente visible; lo eventual accesible.

La IA consulta libremente, pero no modifica sin confirmación.

Las campañas cerradas congelan sus costos.

Los registros críticos se anulan, no se borran.

Los cambios importantes dejan auditoría.

La información debe estar respaldada.

La app actual se reutiliza y migra, no se descarta.

La estructura debe quedar preparada para IA desde el inicio.

La interfaz debe ser simple, didáctica y agradable.

Seguridad y permisos forman parte del diseño desde el inicio.

52. Instrucción para IA de desarrollo

Antes de realizar cambios:

Revisar la aplicación actual completa.

Identificar funcionalidades y datos existentes.

Comparar con esta especificación.

No borrar ni modificar información útil sin autorización.

Trabajar en una rama separada de main.

Crear backup antes de cambios estructurales.

Implementar por etapas.

Validar cada módulo antes de avanzar.

Mantener compatibilidad con datos existentes durante la migración.

Documentar toda decisión que cambie esta especificación.

Versión: v2
Estado: Especificación funcional inicial consolidada
Uso: Fuente principal para diseño y refactorización de MI CAMPO
Próximo paso: crear DECISIONES_V2.md y luego PLAN_REFACTORIZACION_V2.md
