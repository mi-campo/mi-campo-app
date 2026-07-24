# GLOSARIO — MI CAMPO

> Vocabulario específico del negocio que puede llevar a un malentendido caro (ej. mal cálculo de fertilización) si se interpreta mal. Se agrega un término solo cuando ya causó o podría causar confusión real — no es un diccionario completo de agronomía.

**Manchoneo:** aplicación (riego, pulverización, fertilización) que cubre 60% o menos de la superficie real del lote. El sistema lo detecta automático comparando lo cargado contra las hectáreas del lote — no hace falta marcarlo a mano.

**Zona 1 / Zona 2 (Fertilización):** las dos sub-áreas de fertilidad que el sistema detecta automáticamente dentro de un mismo lote cuando hay 2 muestras de suelo del mismo día. Zona 1 = mejor fertilidad (mayor MO/N-NO3), rendimiento relativo fijo en **1.03**. Zona 2 = peor fertilidad, rendimiento relativo fijo en **0.96**. Estos dos números son un dato de campo de Fran, no se calculan.

**Peralta / Peralta −8% (calibración):** las dos variantes de la fórmula Peralta-DISA de fertilización nitrogenada. "Peralta" usa el factor Nan original (3.7). "Peralta −8%" usa un factor calibrado con datos propios de campañas anteriores (3.404), que da una recomendación más conservadora. Solo corre para Trigo — Maíz todavía no tiene fórmula cargada.

**Rendimiento objetivo:** el único dato manual que hay que cargar en la calculadora de Fertilización — el resto (N-NO3, MO, pH) viene de los datos base ya guardados.

**Agua útil:** lectura de humedad de suelo a 2 metros de profundidad. Si hay varias lecturas con la misma fecha (varios puntos de muestreo), el sistema las promedia solo. Siempre usa la fecha más reciente disponible, no todo el historial.

**Ciclo activo / barbecho:** un lote tiene un "ciclo" abierto cuando tiene un cultivo sembrado (sin fecha de fin todavía). Si no tiene ningún ciclo abierto, está en "barbecho", y el sistema predice el próximo cultivo según la rotación: Garbanzo → Maíz 2da → Soja 1ra → Trigo → Soja 2da → repite.

**Hectáreas reales vs. hectáreas aplicables:** "reales" es el tamaño físico del lote (o lo efectivamente cubierto, en caso de manchoneo). "Aplicables" (usado en Recetas) es un número aparte, siempre un poco mayor, para no quedarse corto de insumo por la superposición de la máquina al aplicar.

**Ref.Lote (informes AgLab):** aclaración que trae el informe de laboratorio junto al código de lote (ej. "SOBREPOSICION") — se guarda como referencia en la etiqueta de la muestra, no cambia a qué lote real corresponde.
