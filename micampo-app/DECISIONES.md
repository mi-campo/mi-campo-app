# DECISIONES — MI CAMPO

> Una entrada corta (2-4 líneas) cada vez que alguien pregunta "¿por qué está hecho así?" y hay que investigar para responder. No se documenta lo obvio. Orden: más reciente arriba.

---

### JSON plano en vez de base de datos
Un solo usuario admin, bajo volumen de datos, sin necesidad de consultas concurrentes reales. La complejidad de un motor de base de datos no se justifica hoy. Revisar si el volumen o la cantidad de usuarios concurrentes crece mucho.

### Peralta-DISA Maíz: 7 modelos completos, no una versión simplificada
Se evaluó implementar solo 2-3 modelos (más simple, más fácil de auditar) en vez de los 7 del Excel original. Fran eligió los 7 completos porque el Excel de Guillermo Peralta ya está validado con años de uso — prioriza fidelidad al método conocido por sobre simplicidad de mantenimiento. Verificado número por número contra el Excel real antes de subir (6 de 7 exactos, el 7° —T0— a menos del 1% de diferencia, limitado por referencias rotas en el Excel original de Fran, no por el código).

### Antecesor "Garbanzo" con N extra = 20 en Maíz (igual que gramíneas)
El Excel de Fran lo tiene así, aunque es raro agronómicamente (las demás leguminosas están en 0). Se dejó tal cual está en el Excel, sin corregir por cuenta propia — Fran dijo que lo revisa más adelante si hace falta. Ver ESTADO.md, riesgos.

### Mercado: precios propios acumulados en vez de base de datos externa
Se evaluó conectar una fuente externa (Stooq para CBOT, descarga de MatbaRofex) para tener precios históricos reales. Se descartó por ahora: para el precio local (pizarra Rosario, el que más le importa a Fran) no hay ninguna fuente pública con API limpia, y agregar una fuente externa solo para CBOT es mantenimiento nuevo por una mejora parcial. En su lugar, el sistema guarda su propio historial día a día (recién arrancó, tarda semanas en ser útil).

### Peralta-DISA solo corre para Trigo
~~La fórmula de Maíz todavía no fue provista por Fran~~ → resuelto, ver entrada de arriba (7 modelos, verificados).

### Rendimiento relativo de zona fijo en 1.03 (Zona 1 Alta) y 0.96 (Zona 2 Baja)
Valores dados directamente por Fran en base a su experiencia de campaña, no calculados. Si cambia el criterio agronómico, hay que pedirle el nuevo valor, no inventarlo.

### Objetivo de riego por cultivo hardcodeado (no configurable desde una tabla)
Garbanzo 400mm, Trigo 550mm, Soja 120mm, Maíz 200mm. Se decidió así por simplicidad — son solo 4 valores fijos, no justifica una tabla de configuración editable. El usuario puede sobreescribir el valor por lote igual.

### Motor agronómico partido entre servidor (Riego) y navegador (Fertilización)
No fue una decisión deliberada de arquitectura — pasó orgánicamente porque cada funcionalidad se armó en el momento que hacía falta. Queda como deuda técnica conocida (ver ESTADO.md, riesgos), no urgente de unificar mientras no haga falta correr la calculadora de fertilización desde WhatsApp.
