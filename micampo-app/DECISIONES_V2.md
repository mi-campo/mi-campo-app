MI CAMPO — DECISIONES V2

Estado: decisiones funcionales cerradas y vigentes
Uso: referencia obligatoria para cualquier IA o desarrollador que trabaje sobre MI CAMPO

1. Estructura general

La jerarquía principal será:

Empresa → Campo → Lote → Campaña → Cultivo → Actividades → Costos → Producción → Resultado

La unidad productiva mínima habitual es el lote.

Las campañas se nombran:

Fina 2026

Gruesa 2026/27

La rotación debe poder reconstruirse históricamente por lote.

Los corners no son un tipo de lote independiente: son lotes de secano con relación espacial con un círculo de riego.

2. Empresas y participantes

El sistema debe permitir más de una empresa en el futuro.

Se utilizará el término Participante en lugar de “Socio” como categoría general.

Un participante puede intervenir:

en un solo campo;

en varios campos;

con acuerdos diferentes según campo, lote o campaña.

El participante principal o titular también es un participante, con un rol especial.

Los acuerdos no se deben modelar con una única fórmula universal.

3. Usuarios y permisos

El administrador puede ver, cargar y modificar toda la información.

El dueño de la empresa puede ver todos los campos y lotes, pero no modificar.

S.A.G. puede ver únicamente La Nazarena.

D.L.A. puede ver únicamente Montoya Cravero y Guma.

Los participantes de solo lectura pueden agregar comentarios, pero no modificar datos productivos ni económicos.

Los permisos deben configurarse por usuario y campo, no quedar fijos en código.

El dueño y los participantes pueden ver:

actividades realizadas;

aplicaciones;

costos por actividad;

costos acumulados;

gasto proyectado;

riego;

evolución de campaña;

rendimiento cuando corresponda.

No deben ver por defecto:

stock general;

compras detalladas;

acuerdos internos;

cuentas corrientes;

información comercial interna no necesaria.

4. WhatsApp

Cada usuario puede tener un número de WhatsApp asociado.

El bot debe identificar al usuario por número y aplicar los mismos permisos que en la web.

Puede saludar por nombre y según la hora:

“Buen día” antes de las 12;

“Buenas tardes” después de las 12.

S.A.G. puede ser identificado como Nico.

D.L.A. puede ser identificado como Nacho.

Un número no registrado no debe recibir ninguna respuesta.

El intento desde un número no registrado puede quedar registrado internamente.

La IA por WhatsApp debe priorizar consultas rápidas y operativas.

5. Actividades agronómicas

La actividad principal es lo que efectivamente se hizo en el lote.

Siembra con fertilización es una sola actividad de Siembra.

No existirá una actividad separada llamada “Fertilización incorporada en siembra”.

El fertilizante usado en la siembra debe:

quedar dentro de la actividad Siembra;

computar analíticamente como fertilización;

no duplicar costos.

Pulverización puede ser:

terrestre;

dron.

Fertilización puede ser:

voleo con voleadora;

dron.

Cebo puede ser:

voleadora;

dron.

Siembra al voleo puede ser:

voleadora;

dron.

La cantidad total usada es el dato original.

La dosis por ha se calcula como:

cantidad total / superficie efectivamente trabajada

Una actividad puede abarcar varios lotes o partes de lotes.

En ese caso, productos y costos se reparten proporcionalmente según las hectáreas efectivamente trabajadas.

6. Línea de tiempo

La vista principal del lote debe incluir una línea de tiempo simple y visual.

Cada actividad debe mostrarse de forma compacta y desplegable.

Debe priorizar:

fecha;

tipo de actividad;

superficie;

costo por ha;

resumen de insumos.

El detalle se muestra al abrir la actividad.

Principio visual:

Primero comprender → después profundizar.

7. Compras

Una compra se considera hecha cuando se cierra el negocio.

La compra puede conservar:

producto;

cantidad;

proveedor;

precio contado;

datos de financiación;

vencimiento;

moneda;

IVA;

ubicación inicial.

Normalmente una compra tendrá una sola fecha de vencimiento.

Si se conoce:

precio contado;

plazo;

tasa mensual o anual;

el sistema debe poder calcular el precio financiado.

8. Stock

El stock se visualiza principalmente por producto.

Internamente se conservan las compras individuales para poder valorizar correctamente.

Ubicaciones:

Proveedor;

Planta;

Campo.

Planta debe permitir sectores:

A1;

A2;

etc.

Los movimientos se registran hasta Campo.

Cuando un producto se aplica, siempre se descuenta del stock de Campo.

No se necesita una ubicación física “Aplicado”.

Todo ajuste de stock requiere motivo obligatorio.

Los remanentes viejos se cargan como Stock inicial.

Ese stock inicial se valoriza a precio de reposición y no se confunde con una compra real.

9. Costos y moneda

Todos los costos de gestión deben terminar expresados en USD.

Siempre se debe conservar:

valor original;

moneda original;

tipo de cambio utilizado;

fecha del tipo de cambio;

valor convertido a USD.

La referencia cambiaria será BNA según la regla definida para cada caso.

Para facturas de energía, se tomará el tipo de cambio del primer día hábil posterior a la fecha de emisión.

La referencia exacta compra/venta de dólar divisa debe quedar parametrizable hasta su cierre definitivo.

10. IVA

Se recuperan hasta 10,5 puntos porcentuales de IVA.

La parte no recuperable forma parte del costo.

El sistema debe poder mostrar:

contado sin IVA;

contado + IVA no recuperable;

financiado sin IVA;

financiado + IVA no recuperable.

IVA e interés financiero deben conservarse como componentes separados.

11. Valorización de insumos y cierre de campaña

Mientras una campaña está abierta, puede utilizarse precio promedio ponderado.

Cuando una campaña se cierra, sus costos quedan congelados.

Una compra posterior no debe modificar los costos históricos de una campaña cerrada.

Debe existir un snapshot económico al cierre.

Las campañas todavía abiertas pueden seguir actualizando sus ponderados.

12. Riego

Cada evento de riego guarda:

fecha;

lote;

superficie;

mm;

pozo.

Se permiten riegos parciales.

Los pozos tienen lotes habituales, pero no una relación rígida.

La Silvina

El pozo eléctrico riega:

C1;

C2;

C3 Bustamante;

C4 Efraín;

C5 Efraín.

Existe un pozo a combustible todavía no operativo.

Ese pozo queda en estado STANDBY.

El Rosario

Pozo 1 / bomba oeste:

habitual: C3, C4, C5;

eventual: C1, C2.

Pozo 2 / bomba este:

habitual: C1, C2;

eventual: C3, C4, C5.

13. Riego eléctrico

La factura eléctrica debe poder subirse directamente.

Debe conservarse la factura original.

El costo se distribuye según mm × ha.

Debe contemplarse el IVA no recuperable según la regla general.

Deben poder calcularse:

costo mensual;

costo por mm/ha;

costo por lote;

USD/ha;

costo ponderado;

costo total por ciclo;

historial de costos.

14. Riego a combustible

El combustible funciona como stock valorizado.

Cada compra de combustible se asigna al depósito asociado a un pozo.

Se utiliza:

consumo de referencia del motor;

relación horas/mm.

El combustible se consume respetando el orden de las compras.

Si queda combustible al final de un cultivo, pasa al siguiente manteniendo su valor.

Por ahora no se prioriza comparar consumo teórico vs real.

15. Cosecha

La cosecha debe registrar producción física.

Cada registro puede contener:

fecha;

campo/lote;

kg o tn;

patente de camión o número de silobolsa.

El sistema calcula:

producción acumulada;

rendimiento por lote;

rendimiento promedio.

Por ahora no se profundiza en humedad, destino o liquidación comercial por camión.

16. Presupuesto y resultados

El presupuesto se realiza al inicio de campaña.

El presupuesto queda como referencia y no debe dominar la pantalla principal.

El sistema construye el costo real acumulado.

Debe permitir analizar:

costo proyectado + rinde esperado;

costo real + rinde esperado;

costo proyectado + rinde real;

costo real + rinde real.

Debe poder variar el precio del cultivo para escenarios.

Debe poder calcular:

ingreso bruto;

margen bruto;

margen neto;

ROI;

rentabilidad;

rendimiento de indiferencia;

costo USD/ha;

costo USD/t.

17. Participantes, aportes y acuerdos

Los acuerdos pueden variar por campo, lote o campaña.

Pueden existir aportes diferentes por participante.

Los aportes excepcionales deben poder marcarse por campaña.

El sistema debe permitir compensaciones para que el resultado final respete el acuerdo.

Puede existir cuenta corriente por participante, pero no es una vista principal.

Los acuerdos complejos se diseñarán caso por caso; no deben simplificarse forzosamente.

18. Alquileres

Pueden expresarse en qq de soja.

Puede haber una o dos fechas de fijación.

Si hay dos fechas:

guardar ambas;

calcular ponderado.

Si una fecha es futura, el sistema debe poder actualizar el valor cuando llegue.

Puede haber casos especiales con fórmulas variables por rendimiento.

19. IA y persistencia

La IA puede consultar, calcular, comparar y analizar libremente.

La IA no puede modificar información persistente sin confirmación.

Toda escritura importante debe ofrecer:

Confirmar;

Corregir;

Cancelar.

La IA debe distinguir:

dato medido;

observación humana;

conclusión de IA.

20. Historial de cambios

Los datos críticos no se sobrescriben silenciosamente.

Debe conservarse:

valor anterior;

valor nuevo;

usuario;

fecha/hora;

motivo cuando corresponda.

21. Anulación

Los registros importantes no se borran físicamente.

Se anulan.

La anulación debe guardar:

usuario;

fecha;

motivo.

El registro anulado sale de la vista normal, pero permanece en auditoría.

22. Acciones sensibles

Deben requerir confirmación.

Ejemplos:

cierre de campaña;

anulación;

modificación de compra;

ajuste de stock;

cambio de costo consolidado;

reasignación de gasto;

cambio de acuerdo.

Las acciones especialmente sensibles requieren además motivo obligatorio.

23. Seguridad web

La web debe usar:

usuario;

contraseña fuerte;

segundo factor;

cierre automático tras 30 minutos sin actividad.

El segundo factor preferido es un código por WhatsApp al número registrado.

El código debe:

ser temporal;

servir una sola vez;

vencer rápidamente.

24. Backups

La base activa inicial propuesta es SQLite.

Debe existir backup automático diario.

Debe existir backup histórico quincenal.

Debe existir al menos una copia fuera del servidor principal.

Debe hacerse backup previo a:

migraciones;

importaciones masivas;

cambios estructurales;

cierres relevantes.

No se alerta por una falla aislada.

Si pasan 7 días sin un backup válido, se alerta al administrador.

En administración debe verse:
Último backup correcto: fecha/hora.

25. Notas y memoria agronómica

Cada lote puede tener notas permanentes.

Las notas pueden incluir:

texto;

fecha;

autor;

foto opcional;

recordatorio opcional.

Debe existir también una memoria agronómica general no ligada a un lote.

Tipos:

Observación;

Recomendación;

Aprendizaje.

La IA puede usar esa memoria para responder y ayudar a recordar experiencias anteriores.

Una nota puede generar un recordatorio contextual.

26. Dashboard e interfaz

Navegación principal:

Empresa → Campos → Lotes → Campaña/Cultivo → Línea de tiempo

El dashboard debe ser limpio y no saturarse de indicadores.

La pantalla de lote debe mostrar primero:

campaña/cultivo;

superficie;

fecha de siembra;

variedad/híbrido;

costo actual;

costo proyectado;

mm de riego.

Debajo debe estar la línea de tiempo.

Información secundaria:

análisis;

notas;

documentos;

historial;

auditoría;

presupuesto;

acuerdos.

Principio:
Lo frecuente visible; lo eventual accesible pero fuera del primer plano.

27. Futuro

La arquitectura debe quedar preparada para:

mapas de rendimiento;

mapas de margen neto;

análisis espacial;

porcentaje del lote por encima o debajo del rendimiento de indiferencia;

comportamiento histórico por variedad/híbrido.

Estas funciones no son prioridad de la primera etapa.

28. Desarrollo

No trabajar directamente sobre main.

Crear una rama nueva para la reestructuración v2.

Mantener backup del proyecto y de los datos antes de cambios estructurales.

La app actual no se descarta.

Antes de eliminar una función existente:

revisar para qué se usa;

decidir si se conserva, migra o transforma.

No eliminar datos útiles sin autorización.

La especificación v2 es la fuente principal de diseño.

Este archivo de decisiones tiene prioridad para reglas ya cerradas.

Regla final

Si una nueva implementación contradice una decisión de este archivo, no debe aplicarse automáticamente.

Debe:

detenerse;

señalar la contradicción;

pedir una nueva decisión;

actualizar este documento si la decisión cambia.
