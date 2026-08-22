-- Keep Guides as language-specific records while giving every translation family
-- a durable identity. Existing English IDs and slugs remain unchanged.
alter table public.guides
  add column translation_group_id uuid;

update public.guides
set translation_group_id = id
where translation_group_id is null;

alter table public.guides
  alter column translation_group_id set default gen_random_uuid(),
  alter column translation_group_id set not null;

create unique index guides_translation_group_language_key
  on public.guides (translation_group_id, language);

-- Spanish translations of the three transport Guides published at launch.
-- Facts, qualifications, source URLs and verification dates mirror the English
-- source records. Fixed translation-family IDs preserve that relationship, and
-- deterministic inserts keep the content reviewable without overwriting edits.
insert into public.guides (
  id, translation_group_id, title, slug, category, summary, body_markdown,
  language, cover_image_path, seo_title, seo_description, source_url,
  last_verified_at, publication_status, published_at, created_by
)
select
  'b27bccfa-42ee-436d-8b1f-05dac1c6923a'::uuid,
  'a27bccfa-42ee-436d-8b1f-05dac1c6923a'::uuid,
  'Cómo llegar de San Cristóbal de las Casas al Aeropuerto de Tuxtla Gutiérrez (TGZ)',
  'de-san-cristobal-de-las-casas-al-aeropuerto-de-tuxtla-gutierrez',
  'Transporte',
  'Hay transporte directo entre San Cristóbal de las Casas y el Aeropuerto Internacional Ángel Albino Corzo (TGZ), comúnmente llamado Aeropuerto de Tuxtla Gutiérrez. ADO vende actualmente la ruta en línea y los datos de reservación vigentes identifican a OCC como operador. El trayecto suele durar alrededor de 1 hora y 15 minutos, pero quienes van a tomar un vuelo deben dejar tiempo adicional para el tráfico y los procedimientos del aeropuerto.',
  $guide_1$
# Cómo llegar de San Cristóbal de las Casas al Aeropuerto de Tuxtla Gutiérrez (TGZ)

El aeropuerto principal para los vuelos desde la zona de San Cristóbal es el **Aeropuerto Internacional Ángel Albino Corzo (TGZ)**, comúnmente llamado **Aeropuerto de Tuxtla Gutiérrez**.

**No** necesitas viajar primero al centro de Tuxtla Gutiérrez.

ADO vende actualmente una ruta directa de San Cristóbal de las Casas al Aeropuerto Ángel Albino y los datos de reservación vigentes identifican a OCC como operador.

## Respuesta rápida

**Opción económica más práctica:** servicio directo de OCC/ADO

**Tarifa anunciada recientemente para la ruta al aeropuerto:** alrededor de MXN 300

**Duración habitual por carretera:** alrededor de 1 hora y 15 minutos

**Mejor opción para ir de puerta a puerta:** taxi o traslado privado

**Regla más importante:** revisa tu salida exacta antes del día del vuelo y deja un margen amplio.

Grupo Aeroportuario de Chiapas ha anunciado recientemente la ruta San Cristóbal ↔ aeropuerto en MXN 300. Las plataformas de terceros pueden mostrar precios distintos, así que revisa siempre la tarifa al reservar.

## Tomar el servicio directo de OCC/ADO

ADO tiene una ruta de reservación específica de **San Cristóbal de las Casas** al **Aeropuerto Ángel Albino**.

Los listados de transporte actuales identifican a OCC como operador y muestran un trayecto de aproximadamente **1 hora y 15 minutos**.

Suele ser la opción más sencilla si:

- viajas solo o en pareja;
- el horario de tu vuelo coincide con las salidas directas;
- puedes llegar fácilmente al punto de salida en San Cristóbal;
- no necesitas que te recojan en el hotel.

## Revisa el horario para la fecha real de tu vuelo

No planees un viaje al aeropuerto con el horario de un blog de viajes antiguo.

Las horas de salida pueden cambiar según la fecha y los sitios de reservación de terceros muestran actualmente varias conexiones durante el día, no un servicio continuo.

Busca en ADO:

**San Cristóbal de las Casas → Aeropuerto Ángel Albino**

para el día de tu vuelo.

Esto es especialmente importante para:

- vuelos temprano por la mañana;
- vuelos tarde por la noche;
- fines de semana y días festivos;
- días en los que las condiciones de la carretera puedan afectar el viaje.

## ¿Con cuánta anticipación debes salir de San Cristóbal?

El trayecto por carretera figura actualmente con una duración aproximada de **1 hora y 15 minutos**, pero no debes tratarla como todo el tiempo que necesitas antes del vuelo.

También debes considerar:

- el traslado al punto de salida en San Cristóbal;
- posibles retrasos por tráfico o carretera;
- llegar al aeropuerto antes del límite de documentación o abordaje de tu aerolínea;
- documentar equipaje;
- pasar seguridad.

Calcula hacia atrás desde la hora de llegada al aeropuerto recomendada por tu aerolínea y después agrega el tiempo del transporte terrestre.

No elijas una conexión que llegue a TGZ poco antes de tu salida solo porque el horario técnicamente coincide.

## ¿De dónde sale el servicio en San Cristóbal?

ADO muestra el origen como **San Cristóbal de las Casas**, pero el transporte de la ciudad utiliza varias terminales y puntos de salida.

Por eso, usa el **punto de salida indicado en tu boleto** y no supongas que todos los vehículos al aeropuerto salen del mismo lugar.

Este es un detalle que SanCrisGo todavía planea verificar localmente para el servicio actual al aeropuerto.

Si tienes dudas, confirma el lugar antes del día del vuelo en vez de buscarlo con equipaje poco antes de la salida.

## ¿Cuánto cuesta?

Información reciente de Grupo Aeroportuario de Chiapas ha anunciado:

**San Cristóbal → Aeropuerto Ángel Albino Corzo: MXN 300**

Las plataformas de terceros muestran a veces precios distintos.

Toma MXN 300 como un **precio de referencia reciente**, no como una tarifa permanente garantizada.

## Taxi o traslado privado

Vale la pena considerar un taxi o traslado privado si:

- el horario directo no coincide con tu vuelo;
- varias personas pueden compartir el vehículo;
- tu vuelo sale muy temprano;
- llevas mucho equipaje;
- quieres que te recojan directamente en tu alojamiento.

Pregunta el **precio total al Aeropuerto Internacional Ángel Albino Corzo** antes de confirmar el viaje.

SanCrisGo todavía no publica una tarifa fija de taxi porque no hemos encontrado una tarifa oficial actual suficientemente confiable para el trayecto completo San Cristóbal–TGZ.

## No reserves por error un transporte que llegue solo a Tuxtla

Es un error fácil de cometer.

Tu destino es:

**Aeropuerto Internacional Ángel Albino Corzo (TGZ)**

no:

**la ciudad de Tuxtla Gutiérrez.**

El aeropuerto está fuera del centro de Tuxtla. Un autobús a la ciudad no completa tu viaje al aeropuerto.

Al buscar en ADO, usa **Aeropuerto Ángel Albino** como destino.

## ¿Qué pasa si pierdes el autobús?

ADO mantiene actualmente una política de **Pasajero Quedado** para pasajeros elegibles que llegan al punto de salida dentro de los 60 minutos posteriores a la hora impresa en su boleto.

Según las reglas actuales, los pasajeros elegibles pueden recibir un 50 % de descuento sobre la tarifa regular para el siguiente servicio disponible de la misma marca, origen y destino, sujeto a disponibilidad de asientos y otras condiciones.

Es información útil, pero **no es una buena estrategia para ir al aeropuerto**.

Si perder el siguiente servicio puede hacer que pierdas el vuelo, toma una salida anterior en lugar de depender de esta política.

ADO también permite ciertas modificaciones al boleto antes de la salida, según la forma y la tarifa con que se compró.

## Equipaje

La franquicia general de equipaje documentado de ADO depende actualmente de la clase de servicio. Los servicios Primera y Directo Económico permiten hasta **25 kg** de equipaje documentado sin costo adicional.

Las reglas de equipaje de mano son distintas; ADO permite actualmente hasta dos piezas de cabina que cumplan con las dimensiones publicadas por boleto.

Revisa tu boleto específico si llevas equipaje o equipo de tamaño inusual.

## Preguntas frecuentes

### ¿Hay un autobús directo de San Cristóbal al Aeropuerto de Tuxtla?

Sí. ADO vende actualmente una ruta directa San Cristóbal de las Casas → Aeropuerto Ángel Albino. Los listados vigentes identifican a OCC como operador.

### ¿Cuánto tarda el viaje de San Cristóbal a TGZ?

Los listados actuales calculan el trayecto directo en aproximadamente **1 hora y 15 minutos**, aunque el tráfico y las condiciones de la carretera pueden aumentarlo.

### ¿Cuánto cuesta el transporte al aeropuerto?

Información reciente del aeropuerto ha anunciado la ruta en **MXN 300**. Verifica la tarifa actual antes de viajar.

### ¿Necesito ir primero a Tuxtla?

No. Hay una ruta directa San Cristóbal → Aeropuerto Ángel Albino disponible mediante ADO.

### ¿Puedo reservar en línea?

Sí. La ruta está disponible actualmente en el sistema de reservación en línea de ADO.

### ¿Debo tomar el último transporte posible antes de mi vuelo?

Evítalo cuando sea práctico. El viaje por carretera puede durar más de lo previsto y la documentación y seguridad del aeropuerto requieren tiempo adicional.

## Guía relacionada

- [Del Aeropuerto de Tuxtla Gutiérrez (TGZ) a San Cristóbal de las Casas](/es/guias/del-aeropuerto-de-tuxtla-gutierrez-a-san-cristobal-de-las-casas)

## Fuentes

- [ADO — de San Cristóbal al Aeropuerto Ángel Albino](https://www.ado.com.mx/viajes/terminal-san-cristobal-a-terminal-aeropuerto-angel-albino)
- [ADO — página oficial alternativa de la ruta](https://www.ado.com.mx/viajes/ciudad-san-cristobal-de-las-casas-chis-a-terminal-aeropuerto-angel-albino-)
- [ADO HOLA — equipaje documentado](https://hola.ado.com.mx/hc/es/articles/360038945792-Equipaje-Documentado)
- [ADO HOLA — modificación o transferencia de boletos](https://hola.ado.com.mx/hc/es/articles/12798253720987-Modificaci%C3%B3n-Transferencia-de-Boletos)
- [ADO HOLA — condiciones de compra anticipada](https://hola.ado.com.mx/hc/es/articles/31985351684891-T%C3%A9rminos-y-Condiciones-de-Compra-Anticipada)
- [ADO HOLA — reglas de cancelación](https://hola.ado.com.mx/hc/es/articles/360060895312-Cancelaci%C3%B3n-de-boletos)
- [Busbud — panorama actual de la ruta](https://www.busbud.com/es-mx/autobus-san-cristobal-de-las-casas-angel-albino-corzo-international-tgz-airport/i/9fyphj-9fvy5pr)

**Última verificación:** 13 de agosto de 2026.
$guide_1$,
  'es', null,
  'De San Cristóbal al Aeropuerto de Tuxtla (TGZ): autobús y traslado',
  'Cómo viajar de San Cristóbal de las Casas al Aeropuerto de Tuxtla Gutiérrez (TGZ), con servicio directo OCC/ADO, duración y consejos prácticos para el día del vuelo.',
  'https://www.ado.com.mx/viajes/terminal-san-cristobal-a-terminal-aeropuerto-angel-albino',
  '2026-08-13 00:00:00+00'::timestamptz, 'published', now(), null
on conflict (id) do nothing;

insert into public.guides (
  id, translation_group_id, title, slug, category, summary, body_markdown,
  language, cover_image_path, seo_title, seo_description, source_url,
  last_verified_at, publication_status, published_at, created_by
)
select
  'e47e1250-688b-4aa1-adbf-c0826e7f82b5'::uuid,
  'd47e1250-688b-4aa1-adbf-c0826e7f82b5'::uuid,
  'Cómo llegar del Aeropuerto de Tuxtla Gutiérrez (TGZ) a San Cristóbal de las Casas',
  'del-aeropuerto-de-tuxtla-gutierrez-a-san-cristobal-de-las-casas',
  'Transporte',
  'El Aeropuerto Internacional Ángel Albino Corzo (TGZ), comúnmente llamado Aeropuerto de Tuxtla Gutiérrez, es el que normalmente utilizan quienes vuelan a San Cristóbal de las Casas. Se puede reservar un servicio directo a San Cristóbal mediante ADO y los listados actuales identifican a OCC como operador. Información oficial reciente del aeropuerto ha anunciado la ruta en MXN 300 por persona, aunque las tarifas y horas de salida pueden cambiar.',
  $guide_2$
# Cómo llegar del Aeropuerto de Tuxtla Gutiérrez (TGZ) a San Cristóbal de las Casas

Si vuelas a San Cristóbal de las Casas, tu vuelo normalmente llegará al **Aeropuerto Internacional Ángel Albino Corzo (TGZ)**, comúnmente llamado **Aeropuerto de Tuxtla Gutiérrez**.

El aeropuerto no está en San Cristóbal. Después de aterrizar todavía necesitas transporte terrestre para llegar a la ciudad.

Para la mayoría de quienes viajan solos, la opción económica más sencilla es el **servicio directo de OCC/ADO del aeropuerto a San Cristóbal**. Un taxi o traslado privado es más cómodo si quieres ir de puerta a puerta, viajas en grupo o llegas cuando el servicio directo ya no coincide con tu horario. ADO vende actualmente la ruta aeropuerto–San Cristóbal directamente en su sistema de reservación.

## Respuesta rápida

**Mejor opción para la mayoría de quienes viajan solos:** servicio directo de OCC/ADO

**Tarifa anunciada recientemente:** MXN 300 por persona

**Duración habitual:** alrededor de 1 hora y 15 minutos a 1 hora y 30 minutos

**Mejor para grupos o viajes de puerta a puerta:** taxi o traslado privado

**Importante:** revisa la hora de salida actual antes de tu vuelo, especialmente si aterrizas por la noche.

Información reciente publicada por Grupo Aeroportuario de Chiapas indica **MXN 300** para la conexión aeropuerto–San Cristóbal. Los datos actuales de reservación de terceros también identifican a OCC como operador, aunque los precios de las plataformas pueden ser distintos de la tarifa anunciada por el aeropuerto.

Los precios y horarios pueden cambiar. Las cifras anteriores se revisaron por última vez en agosto de 2026.

## Tomar el servicio directo de OCC/ADO

ADO ofrece actualmente reservación en línea desde el **Aeropuerto Ángel Albino** directamente a **San Cristóbal de las Casas**.

Suele ser la opción más fácil si:

- viajas solo o en pareja;
- no necesitas un vehículo privado;
- tu vuelo llega mientras todavía hay servicios directos;
- no te importa continuar por separado desde el punto de llegada en San Cristóbal hasta tu alojamiento.

Los listados actuales identifican a **OCC** como operador. No esperes necesariamente un autobús interurbano grande: viajeros recientes también han descrito camionetas o vehículos tipo Sprinter en los servicios del aeropuerto.

### ¿Cuánto cuesta?

Grupo Aeroportuario de Chiapas ha anunciado recientemente:

**Aeropuerto ↔ San Cristóbal de las Casas: MXN 300**

Una persona que usó el servicio en abril de 2026 también informó haber pagado MXN 300 en el aeropuerto.

Tómalo como una **tarifa verificada recientemente, no como un precio permanente**. Las agencias en línea pueden mostrar otra cantidad porque las tarifas, los canales de reservación o las comisiones pueden variar.

### ¿Conviene reservar con anticipación?

Puedes buscar y comprar la ruta en línea mediante ADO usando **Aeropuerto Ángel Albino** como origen y **San Cristóbal de las Casas** como destino.

Reservar con anticipación es especialmente útil si:

- tu vuelo llega más tarde durante el día;
- viajas en un periodo de mucha demanda;
- quieres saber antes de llegar si una salida directa coincide con tu vuelo.

Si prefieres comprar después de aterrizar, testimonios recientes describen mostradores de boletos de transporte en la zona de llegadas. Una persona que llegó en abril de 2026 compró ahí un boleto impreso y pagó con tarjeta. Es una observación de primera mano, no una garantía de que todos los mostradores o métodos de pago estén siempre disponibles.

Es sensato llevar algunos pesos mexicanos como respaldo.

## Qué hacer después de aterrizar en TGZ

El proceso es relativamente sencillo:

1. Recoge tu equipaje.
2. Entra a la zona de llegadas.
3. Busca los mostradores de transporte terrestre o boletos de autobús.
4. Pregunta por el **servicio directo a San Cristóbal de las Casas**.
5. Confirma el precio, la hora de salida y el punto donde te dejarán antes de pagar.
6. Sigue las indicaciones del personal para llegar al vehículo.

Una pregunta útil es:

**¿Dónde sale el transporte directo a San Cristóbal de las Casas?**

No te preocupes si en línea aparecen palabras distintas como *autobús*, *shuttle*, *Sprinter*, *van* o *colectivo*. Lo importante es confirmar el destino, operador, hora de salida y punto donde te dejarán.

## ¿Cuánto dura el viaje?

Los datos actuales de reservación calculan el trayecto directo de OCC en aproximadamente **1 hora y 15 minutos**, mientras que las experiencias recientes se acercan a 1¼–1½ horas.

El tráfico y las condiciones de la carretera pueden alargarlo, así que no planees otra conexión con horario estricto justo después de la hora prevista de llegada.

## ¿Qué hay de un taxi o traslado privado?

Un taxi o traslado privado reservado de antemano es la opción más sencilla para ir de puerta a puerta.

Puede tener más sentido si:

- varias personas compartirán el costo;
- llevas mucho equipaje;
- viajas con niños;
- llegas después del servicio directo;
- quieres ir directamente a tu hotel o departamento.

El transporte privado es considerablemente más caro que el servicio compartido del aeropuerto, así que **confirma la tarifa total antes de aceptar el viaje**.

No publicamos aquí un precio fijo de taxi porque las tarifas actuales dependen del proveedor y del servicio disponible, y no hemos encontrado una tabla oficial vigente y confiable para la ruta completa TGZ–San Cristóbal.

## ¿Conviene ir primero a Tuxtla Gutiérrez para ahorrar?

Normalmente, no confundas dos rutas distintas:

**Aeropuerto de Tuxtla Gutiérrez → San Cristóbal**

y

**ciudad de Tuxtla Gutiérrez → San Cristóbal.**

El transporte local desde la ciudad de Tuxtla puede ser mucho más barato, pero el aeropuerto está fuera del centro. Llegar primero a la ciudad añade otro tramo.

Si solo quieres llegar a San Cristóbal después de aterrizar, compara el **costo total y el tiempo total**, no únicamente el boleto más barato Tuxtla–San Cristóbal.

Una guía separada de SanCrisGo cubrirá la ruta desde la ciudad de Tuxtla Gutiérrez.

## ¿Qué pasa si tu vuelo llega tarde?

No dependas de un horario copiado de un blog de viajes antiguo.

Las salidas cambian y el servicio nocturno puede ser limitado.

Antes de volar:

1. busca **Aeropuerto Ángel Albino → San Cristóbal de las Casas** en ADO para tu fecha real;
2. compara la salida con la hora programada de aterrizaje;
3. deja tiempo para recoger el equipaje;
4. considera un taxi o traslado privado como alternativa si no hay una salida directa adecuada.

Si ya compraste un boleto de ADO y pierdes la salida, pregunta en el mostrador por las reglas vigentes para modificarlo.

ADO tiene actualmente una política de **Pasajero Quedado** según la cual pasajeros elegibles que llegan hasta 60 minutos después de la salida programada pueden recibir un 50 % de descuento sobre la tarifa regular para el siguiente viaje disponible de la misma marca, origen y destino. Aplican condiciones, así que no supongas que un retraso del vuelo garantiza automáticamente el beneficio.

## Equipaje

La política general vigente de ADO permite hasta **25 kg de equipaje documentado** sin costo adicional en los servicios Primera y Directo Económico, con límites mayores en algunas clases premium. El equipaje de mano tiene límites separados.

Como el vehículo y la clase pueden variar, revisa la franquicia de tu boleto si llevas equipaje sobredimensionado, varias maletas grandes, equipo deportivo o algo inusual.

## Al llegar a San Cristóbal

El transporte te lleva a San Cristóbal, pero quizá no directamente a tu alojamiento.

Antes de salir del aeropuerto, confirma:

**“¿Dónde me deja en San Cristóbal?”**

Al llegar quizá necesites un trayecto corto en taxi u otra conexión local hasta tu hotel, hostal o departamento.

Este es el detalle que muchas guías de transporte olvidan: llegar a San Cristóbal no siempre significa llegar a tu puerta.

Una futura guía de SanCrisGo cubrirá los traslados a pie, en taxi y en colectivo dentro de San Cristóbal.

## Preguntas frecuentes

### ¿San Cristóbal de las Casas tiene aeropuerto?

San Cristóbal no tiene actualmente un aeropuerto comercial con vuelos regulares de pasajeros. Se utiliza normalmente el **Aeropuerto Internacional Ángel Albino Corzo (TGZ)**, conocido comúnmente como Aeropuerto de Tuxtla Gutiérrez.

El aeropuerto se encuentra en el municipio de Chiapa de Corzo, aunque sirve a Tuxtla Gutiérrez y viajeros y sistemas de reservación suelen llamarlo aeropuerto de Tuxtla. Información del Gobierno de Chiapas confirma su ubicación y nombre oficiales.

### ¿Puedo comprar en línea el boleto a San Cristóbal?

Sí. ADO tiene actualmente una ruta de reservación específica del Aeropuerto Ángel Albino a San Cristóbal de las Casas.

### ¿Puedo pagar con tarjeta en el aeropuerto?

Un pasajero reciente informó haber pagado correctamente con tarjeta de débito en el mostrador del aeropuerto en abril de 2026.

No hemos confirmado de manera independiente que todos los mostradores y todas las tarjetas extranjeras se acepten siempre, así que es sensato llevar pesos como respaldo.

### ¿Cuánto cuesta el transporte del aeropuerto?

El aeropuerto ha anunciado recientemente la ruta a San Cristóbal en **MXN 300 por persona**. Revísalo de nuevo para tu fecha porque los precios pueden cambiar.

### ¿Cuánto tarda?

Entre **1 hora y 15 minutos y 1 hora y 30 minutos** es un margen razonable para planear en condiciones normales. Los listados actuales de OCC muestran aproximadamente 1 hora y 15 minutos.

### ¿Necesito pasar por Tuxtla Gutiérrez?

No. ADO vende actualmente una ruta directa del Aeropuerto Ángel Albino a San Cristóbal de las Casas.

## Guía relacionada

- [De San Cristóbal de las Casas al Aeropuerto de Tuxtla Gutiérrez (TGZ)](/es/guias/de-san-cristobal-de-las-casas-al-aeropuerto-de-tuxtla-gutierrez)

## Fuentes

- [ADO — del Aeropuerto Ángel Albino a San Cristóbal](https://www.ado.com.mx/viajes/terminal-aeropuerto-angel-albino-a-ciudad-san-cristobal-de-las-casas-chis)
- [Gobierno de Chiapas — información del aeropuerto](https://chiapas.gob.mx/funcionarios/estatal/ejecutivo/sociedad-operadora-aeropuerto)
- [ADO HOLA — equipaje documentado](https://hola.ado.com.mx/hc/es/articles/360038945792-Equipaje-Documentado)
- [ADO HOLA — modificación o transferencia de boletos](https://hola.ado.com.mx/hc/es/articles/12798253720987-Modificaci%C3%B3n-Transferencia-de-Boletos)
- [ADO HOLA — sección de movimientos de boletos](https://hola.ado.com.mx/hc/es/sections/360007806051-MOVIMIENTO-DE-BOLETOS)
- [Grupo Aeroportuario de Chiapas](https://www.facebook.com/Grupoaeroportuariochiapas/)
- [Busbud — panorama actual de la ruta](https://www.busbud.com/es-mx/autobus-san-cristobal-de-las-casas-angel-albino-corzo-international-tgz-airport/i/9fyphj-9fvy5pr)
- [Reddit — testimonio de primera mano de abril de 2026](https://www.reddit.com/r/Chiapas/comments/1sclkly/my_experience_travelling_from_tuxtla_gutierrez/)

**Última verificación:** 13 de agosto de 2026.
$guide_2$,
  'es', null,
  'Del Aeropuerto de Tuxtla a San Cristóbal: autobús, transporte y taxi',
  'Cómo llegar del Aeropuerto de Tuxtla Gutiérrez (TGZ) a San Cristóbal de las Casas en servicio directo OCC, taxi o traslado privado, con consejos prácticos actuales.',
  'https://www.ado.com.mx/viajes/terminal-aeropuerto-angel-albino-a-ciudad-san-cristobal-de-las-casas-chis',
  '2026-08-13 00:00:00+00'::timestamptz, 'published', now(), null
on conflict (id) do nothing;

insert into public.guides (
  id, translation_group_id, title, slug, category, summary, body_markdown,
  language, cover_image_path, seo_title, seo_description, source_url,
  last_verified_at, publication_status, published_at, created_by
)
select
  '6316c952-f2bd-46be-93f5-f3eaae49da9e'::uuid,
  '5316c952-f2bd-46be-93f5-f3eaae49da9e'::uuid,
  'Cómo llegar de Tuxtla Gutiérrez a San Cristóbal de las Casas',
  'de-tuxtla-gutierrez-a-san-cristobal-de-las-casas',
  'Transporte',
  'Viajar de la ciudad de Tuxtla Gutiérrez a San Cristóbal de las Casas es sencillo. ADO vende actualmente la ruta en línea, con servicios de operadores como OCC y otras marcas del grupo ADO. La terminal principal para muchas salidas es la terminal ADO/OCC junto a Plaza Las Américas. Los listados vigentes de agosto de 2026 muestran tarifas aproximadas de MXN 64–95 y trayectos de alrededor de 1 hora y 10 minutos a 1 hora y 20 minutos, según el servicio.',
  $guide_3$
# Cómo llegar de Tuxtla Gutiérrez a San Cristóbal de las Casas

Si ya estás en la **ciudad de Tuxtla Gutiérrez**, llegar a San Cristóbal de las Casas es mucho más barato y sencillo que viajar desde el Aeropuerto de Tuxtla Gutiérrez.

La opción más sencilla para la mayoría es un autobús interurbano desde la **terminal ADO/OCC cerca de Plaza Las Américas**.

ADO vende actualmente en línea la ruta Tuxtla Gutiérrez → San Cristóbal de las Casas y los listados vigentes muestran servicios frecuentes durante el día.

## Respuesta rápida

**Mejor opción para la mayoría:** autobús del grupo ADO/OCC

**Punto principal de salida:** terminal ADO/OCC de Plaza Las Américas

**Tarifas observadas actualmente:** aproximadamente MXN 64–95

**Duración habitual:** aproximadamente 1 hora y 10 minutos a 1 hora y 20 minutos

**Llegada:** zona de la terminal de autobuses de San Cristóbal de las Casas

El precio y la hora exactos dependen del servicio, así que revisa tu boleto en vez de confiar en un horario fijo.

**Última verificación: 13 de agosto de 2026.**

## Importante: la ciudad de Tuxtla y el Aeropuerto de Tuxtla no son el mismo viaje

Esta diferencia causa mucha confusión en línea.

Hay dos trayectos distintos:

**ciudad de Tuxtla Gutiérrez → San Cristóbal de las Casas**

y

**Aeropuerto Internacional Ángel Albino Corzo (TGZ) → San Cristóbal de las Casas**

El aeropuerto está fuera del centro de Tuxtla, por lo que el transporte desde ahí cuesta considerablemente más.

Si acabas de aterrizar en TGZ y quieres ir directamente a San Cristóbal, por lo general **no** necesitas entrar primero a Tuxtla.

Consulta la guía separada de SanCrisGo:

[Del Aeropuerto de Tuxtla Gutiérrez (TGZ) a San Cristóbal de las Casas](/es/guias/del-aeropuerto-de-tuxtla-gutierrez-a-san-cristobal-de-las-casas)

## Tomar el autobús desde Tuxtla

ADO tiene una página específica de reservación para:

**Terminal Tuxtla Gutiérrez → Terminal San Cristóbal de las Casas.**

Los listados vigentes de agosto de 2026 muestran servicios de varias marcas de la red ADO, entre ellas:

- OCC
- ADO
- ADO GL
- ADO Conecta
- Cristóbal Colón

No todas las salidas tienen el mismo precio o tipo de vehículo. Para este trayecto corto, normalmente conviene comparar:

**hora de salida → terminal de salida → precio → duración**

en vez de elegir únicamente por la marca.

## ¿De dónde salen los autobuses en Tuxtla?

La terminal más importante para visitantes es la **terminal ADO/OCC cerca de Plaza Las Américas**.

ADO ubica su terminal de Tuxtla Gutiérrez en 5 Norte Poniente, cerca del bulevar y la zona de Plaza Las Américas.

Los datos actuales de reservación dan esta ubicación para la terminal Plaza Las Américas:

**5a. Norte Poniente 2650, esquina Boulevard Antonio Pariente Algarín, Tuxtla Gutiérrez.**

Muchas salidas actuales a San Cristóbal mostradas para agosto de 2026 parten de esta terminal.

### ¿Hay otras terminales?

Sí.

Información local identifica dos puntos importantes para salir a San Cristóbal:

- la **terminal OCC/ADO de Plaza Las Américas**;
- la **Central Camionera del Sur**.

Las bases actuales de transporte también muestran otras paradas de Tuxtla, incluida la terminal Cristóbal Colón.

Para un visitante, la regla práctica es sencilla:

> **Ve a la terminal impresa en tu boleto.**

No supongas que todos los vehículos Tuxtla → San Cristóbal salen de Plaza Las Américas.

## ¿Cuánto cuesta el autobús?

Los datos de Busbud revisados el 13 de agosto de 2026 muestran precios aproximados de **MXN 67 a MXN 95** para fechas próximas, con algunas salidas específicas en aproximadamente MXN 64–90.

Son panoramas actuales de reservación, no tarifas permanentes.

Por eso SanCrisGo recomienda revisar el precio para tu fecha real en lugar de confiar en una cifra fija de un artículo antiguo.

## ¿Cuánto dura el viaje?

Los datos actuales muestran aproximadamente **1 hora y 9 minutos a 1 hora y 20 minutos** para muchos servicios entre la terminal Plaza Las Américas y San Cristóbal.

El tráfico y las condiciones de la carretera pueden aumentarlo.

Para planear de manera sencilla, calcula alrededor de:

**1¼ horas**

más el tiempo necesario para llegar y esperar en la terminal.

## ¿Con qué frecuencia salen los autobuses?

Es una ruta de alta frecuencia.

Los datos de reservación de agosto de 2026 muestran numerosas salidas durante el día, incluidas opciones por la mañana temprano, durante el día y por la noche.

No reproducimos aquí un horario completo porque las salidas cambian.

Para consultar el horario actual, busca:

**Tuxtla Gutiérrez → San Cristóbal de las Casas**

en ADO u otro servicio de reservación en vivo.

## ¿Necesitas reservar con anticipación?

Por lo general es más sencillo que una ruta de larga distancia porque hay muchas salidas diarias.

Aun así, reservar con anticipación puede ser útil si:

- necesitas llegar a San Cristóbal a una hora específica;
- viajas en un fin de semana o día festivo de mucha demanda;
- quieres saber exactamente qué terminal de Tuxtla debes usar;
- prefieres no esperar al siguiente servicio disponible.

ADO permite actualmente buscar y comprar la ruta en línea.

## ¿Qué hay de los colectivos o camionetas compartidas?

También operan camionetas compartidas y colectivos entre Tuxtla y San Cristóbal.

Una guía de una universidad local describe autobuses, taxis y *combis/Sprinters* como formas establecidas de viajar entre ambas ciudades.

Información local de enero de 2025 reportó una tarifa de **MXN 70** en una ruta de colectivo San Cristóbal–Tuxtla.

Sin embargo, **todavía no hemos verificado de manera independiente la tarifa vigente en agosto de 2026, el punto exacto de abordaje en Tuxtla ni los datos del operador de esos colectivos**.

Por eso, SanCrisGo recomienda actualmente la terminal ADO/OCC como la opción más sencilla para quien visita por primera vez.

Actualizaremos esta guía cuando se haya verificado localmente el servicio actual de colectivos.

## Taxi de Tuxtla a San Cristóbal

Un taxi es otra opción posible, pero para una persona normalmente costará bastante más que el autobús o colectivo.

Puede tener más sentido si:

- varias personas pueden dividir el costo;
- quieres ir de puerta a puerta;
- llevas mucho equipaje;
- tu punto de partida en Tuxtla está lejos de la terminal.

Todavía no publicamos un precio fijo de taxi Tuxtla → San Cristóbal porque no hemos verificado una tarifa oficial actual ni una cifra consistentemente confiable para toda la ruta interurbana.

Acuerda el precio total antes de iniciar el viaje.

## ¿Dónde llegas en San Cristóbal?

Los listados actuales muestran el punto de llegada en la zona de la terminal principal de autobuses, en:

**Avenida Insurgentes 66, Santa Lucía, San Cristóbal de las Casas.**

Está al sur del centro histórico.

Para llegar a tu alojamiento quizá todavía necesites:

- un trayecto corto en taxi;
- caminar;
- otra conexión local.

Antes de salir de Tuxtla, revisa dónde termina tu servicio específico.

## ¿Qué pasa si llegas a Tuxtla en un autobús de larga distancia?

Si otro autobús te deja en la **terminal ADO/OCC de Plaza Las Américas**, continuar a San Cristóbal puede ser especialmente sencillo porque muchas salidas actuales utilizan el mismo centro de transporte.

Revisa la siguiente salida disponible en lugar de abandonar automáticamente la terminal.

Puede ser útil para quienes llegan a Tuxtla desde otras partes de México.

## Preguntas frecuentes

### ¿Cuánto cuesta un autobús de Tuxtla a San Cristóbal?

Los listados en línea de agosto de 2026 muestran aproximadamente **MXN 64–95**, según el servicio y el canal de reservación.

### ¿Cuánto tarda el viaje de Tuxtla a San Cristóbal?

La mayoría de los listados actuales están entre **1 hora y 10 minutos y 1 hora y 20 minutos**.

### ¿Qué terminal de autobuses debo usar en Tuxtla?

Muchos servicios salen de la **terminal ADO/OCC junto a Plaza Las Américas**, pero otras terminales también cubren la ruta. Revisa siempre el punto de salida impreso en tu boleto.

### ¿Puedo comprar el boleto en línea?

Sí. ADO tiene actualmente una ruta oficial de reservación Tuxtla Gutiérrez → San Cristóbal de las Casas.

### ¿Hay colectivos de Tuxtla a San Cristóbal?

Sí, fuentes locales documentan transporte compartido por carretera entre ambas ciudades, pero SanCrisGo todavía no ha verificado suficientemente el operador actual, el punto exacto de abordaje y la tarifa de agosto de 2026 como para publicar instrucciones detalladas.

### ¿El Aeropuerto de Tuxtla Gutiérrez está en el centro de la ciudad?

No. El Aeropuerto Internacional Ángel Albino Corzo es un origen distinto fuera del centro de Tuxtla. Si estás en el aeropuerto, usa la guía específica aeropuerto → San Cristóbal en lugar de esta.

## Guías relacionadas

- [Del Aeropuerto de Tuxtla Gutiérrez (TGZ) a San Cristóbal de las Casas](/es/guias/del-aeropuerto-de-tuxtla-gutierrez-a-san-cristobal-de-las-casas)
- [De San Cristóbal de las Casas al Aeropuerto de Tuxtla Gutiérrez (TGZ)](/es/guias/de-san-cristobal-de-las-casas-al-aeropuerto-de-tuxtla-gutierrez)

## Fuentes

### Primarias u oficiales

- [ADO — de Tuxtla Gutiérrez a San Cristóbal de las Casas](https://www.ado.com.mx/viajes/terminal-tuxtla-gutierrez-a-terminal-san-cristobal-de-las-casas)
- [ADO — información de la terminal de Tuxtla Gutiérrez](https://contenido.ado.com.mx/terminales/tuxtla-gutierrez)
- [Secretaría de Movilidad y Transporte de Chiapas](https://smyt.chiapas.gob.mx/)

### Locales

- [El Heraldo de Chiapas — terminales de salida de Tuxtla](https://oem.com.mx/elheraldodechiapas/local/donde-salen-los-autobuses-que-van-a-san-cristobal-de-las-casas-en-tuxtla-gutierrez-24552136)
- [El Heraldo de Chiapas — tarifas de colectivos de enero de 2025](https://oem.com.mx/elheraldodechiapas/local/transportistas-suben-el-pasaje-en-la-ruta-san-cristobal-tuxtla-gutierrez-21188664)
- [UNACH — opciones de transporte](https://sari.unach.mx/ampei2022/es/terrestre.html)

### Panorama actual del transporte

- [Busbud — listados actuales de la ruta](https://www.busbud.com/es-mx/autobus-tuxtla-gutierrez-san-cristobal-de-las-casas/r/9fvz34-9fyphj)

**Última verificación:** 13 de agosto de 2026.
$guide_3$,
  'es', null,
  'De Tuxtla Gutiérrez a San Cristóbal: guía de autobús y transporte',
  'Cómo viajar de la ciudad de Tuxtla Gutiérrez a San Cristóbal de las Casas en autobús, con terminales, tarifas actuales, duración y la diferencia entre ciudad y aeropuerto.',
  'https://www.ado.com.mx/viajes/terminal-tuxtla-gutierrez-a-terminal-san-cristobal-de-las-casas',
  '2026-08-13 00:00:00+00'::timestamptz, 'published', now(), null
on conflict (id) do nothing;
