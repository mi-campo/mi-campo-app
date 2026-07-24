# DECISIONES — MI CAMPO

> Una entrada corta (2-4 líneas) cada vez que alguien pregunta "¿por qué está hecho así?" y hay que investigar para responder. No se documenta lo obvio. Orden: más reciente arriba.

---

### JSON plano en vez de base de datos
Un solo usuario admin, bajo volumen de datos, sin necesidad de consultas concurrentes reales. La complejidad de un motor de base de datos no se justifica hoy. Revisar si el volumen o la cantidad de usuarios concurrentes crece mucho.

### Peralta-DISA solo corre para Trigo
La fórmula de Maíz todavía no fue provista por Fran. El sistema lo declara explícitamente en vez de inventar un resultado. Pendiente cargar cuando esté la fórmula.

### Rendimiento relativo de zona fijo en 1.03 (Zona 1 Alta) y 0.96 (Zona 2 Baja)
Valores dados directamente por Fran en base a su experiencia de campaña, no calculados. Si cambia el criterio agronómico, hay que pedirle el nuevo valor, no inventarlo.

### Objetivo de riego por cultivo hardcodeado (no configurable desde una tabla)
Garbanzo 400mm, Trigo 550mm, Soja 120mm, Maíz 200mm. Se decidió así por simplicidad — son solo 4 valores fijos, no justifica una tabla de configuración editable. El usuario puede sobreescribir el valor por lote igual.

### Motor agronómico partido entre servidor (Riego) y navegador (Fertilización)
No fue una decisión deliberada de arquitectura — pasó orgánicamente porque cada funcionalidad se armó en el momento que hacía falta. Queda como deuda técnica conocida (ver ESTADO.md, riesgos), no urgente de unificar mientras no haga falta correr la calculadora de fertilización desde WhatsApp.
