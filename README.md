# TP2 — Sistema de signos de representación geométrica, cinética y reactiva

Taller de Diseño Multimedial 4 · Facultad de Artes · UNLP · 2026

**Integrantes (orden alfabético):** Iván Saldaña · Joaquín Galasso · Mathilda Esteban · Mauro Scaffidi · Zoe Ullua

---

## El sistema

Nueve signos sobre una línea, repartidos en tres subsistemas. Cada subsistema
usa una sola figura y hace variar una sola propiedad; la línea es el estadío
que los atraviesa a los tres.

| Subsistema | Figura | Variable | La línea es | Signos |
|---|---|---|---|---|
| **EL TIEMPO** | cuadrado | opacidad | la línea del tiempo (izq. → der.) | memoria · herencia · caducidad |
| **EL VÍNCULO** | círculo | color | la línea del vínculo (une) | identidad · empatía · colaboración |
| **EL DEVENIR** | triángulo | grosor de línea | el camino que se dibuja al andar | incertidumbre · ansiedad · expectativa |

## Interacción: sólo dos gestos, en los nueve signos

- **PULSAR** — opera el signo: inscribe, transmite, larga al tránsito, afirma,
  envía, suma, da un paso, intenta, sube.
- **MANTENER PULSADO** — anima y resalta la cualidad que el signo describe.
  No agrega contenido: hace visible de qué está hecho el signo.

No hay ningún tercer gesto. Deslizar y el menú son navegación, nunca interacción.

| Signo | Pulsar | Mantener resalta |
|---|---|---|
| MEMORIA | inscribe un cuadrado en la línea | una cabeza lectora relee: cada marca recupera su opacidad original y tiende un hilo al eje |
| HERENCIA | la generación viva cede su opacidad y engendra la siguiente (no avanza sola) | todos los antepasados apagados reaparecen con el gris exacto que transmitieron |
| CADUCIDAD | **lo apura**: cada pulso es un empujón hacia el corte y se come un poco más de línea. El empujón se afloja solo, pero lo gastado no vuelve | **lo frena**: retener es un gesto sostenido, y mientras el dedo está puesto el tránsito casi se detiene y la línea entera se recupera. Casi: nunca del todo, y al soltar vuelve a andar |
| IDENTIDAD | suma un anillo de color | los anillos dejan de vagar, se alinean en una sola diana y laten juntos |
| EMPATÍA | **dar y recibir**: te acercás un paso y en el mismo gesto le pasás algo de tu color y te llevás algo del suyo. Los dos cambian a la par, y la línea que los une se enciende con lo que acaba de pasar por ella | **te ponés en su lugar**: tu círculo deja el suyo, viaja hasta él y en el camino toma su tamaño y su color, hasta quedar al lado, idéntico |
| COLABORACIÓN | suma un diverso al círculo común, donde anda por su cuenta | **se ponen de acuerdo**: cada uno vuelve a su puesto en la trama y cambia su ritmo propio por el de todos. La nube dispersa se cierra en una sola figura que gira entera, en un mismo sentido y a un mismo paso |
| INCERTIDUMBRE | da un paso: el devenir elige por vos | se abre el abanico completo de lo que podría pasar; al soltar se borra: mirar no decide nada |
| ANSIEDAD | hay que acertarle **encima**: se escapa y deja un eco. Al lado no pasa nada | se desmadra: los ecos se multiplican, todo tiembla y la escena se cierra encima |
| EXPECTATIVA | lo real salta hacia lo anticipado… que vuelve a correrse | la anticipación corre sola hacia adelante; al soltar se desploma y lo real quedó donde estaba |

En ansiedad, el que escapa no huye en línea recta desde el dedo —así terminaba
acorralado en una esquina y parecía un error—: entre varias salidas elige la que
más lo aleja y más aire le deja, y siempre le queda a dónde seguir escapando.

En empatía lo compartido no queda solo: **si dejás de pulsar, el color
compartido se va soltando y tu lugar se corre de vuelta a donde estaba.** Lo que
no se sostiene se pierde. Lo único que no se va es el paso de color que te queda
de haber estado en su lugar.

### La regla de trazo

Hay **una sola línea discontinua en todo el sistema**, siempre el mismo patrón
(`Dash.marca`). Lo que la regla distingue es otra cosa:

| | |
|---|---|
| **línea continua** | el sujeto: lo que está siendo ahora |
| **línea discontinua** | todo lo que el sujeto deja: el camino andado, los ecos de cada intento, las proyecciones de lo que todavía no es |

En el tercer subsistema esto es literal: el caminante, el triángulo que se
escapa y lo real van en línea continua; su camino, sus ecos y sus anticipaciones
van en marca. Lo que diferencia una marca de otra es el **grosor** y la
opacidad: cuanto más fina y más apagada, menos real.

## Sonido

El sonido se genera, no se reproduce: no hay archivos ni librerías de audio,
hay osciladores (`js/core/audio.js`). Y sigue la misma partición que la imagen —
cada subsistema tiene su materia sonora, igual que tiene su figura y su variable:

| Subsistema | Materia sonora | Qué dice |
|---|---|---|
| **EL TIEMPO** | pulsos secos y graves | la **opacidad es el volumen**: lo que se ve más apagado suena más bajo |
| **EL VÍNCULO** | notas sostenidas y cálidas | el **color es la altura**: el tono de cada círculo es su nota |
| **EL DEVENIR** | trazo fino y claro | la **línea continua es un tono continuo**; lo discontinuo, sonido interrumpido |

Todo cae en una escala pentatónica: cualquier cosa que arme quien toca suena
junta, no hay manera de desafinar el sistema.

Algunos ejemplos de qué se oye:

- En **memoria**, cada marca tiene su nota según su distancia al eje, y mantener
  es escuchar la cabeza lectora tocarlas de nuevo, en orden, más bajo cuanto más
  viejas.
- En **herencia**, cada generación es un acorde: una nota por descendiente, y la
  nota de cada uno es su gris. Al mutar el gris, muta la nota.
- En **empatía**, como el color es la altura, todo el signo se oye solo:
  compartir acerca las dos notas y ponerse en su lugar las lleva al **unísono**.
  Medido: 659 y 330 Hz al entrar, 587 y 370 compartiendo, 370 y 370 estando en
  su lugar.
- En **colaboración**, en reposo cada uno suena cuando le toca a él y se oye un
  goteo disperso; al ponerse de acuerdo entran todos en un mismo pulso.
- En **ansiedad**, el temblor del trazo es el vibrato de la nota, y los ecos
  acumulados son un fondo que se espesa y se desafina.

Los navegadores no dejan sonar sin un gesto: el primer contacto con la pantalla
abre el audio. Se puede apagar desde el menú, al pie del mapa.

## Navegación

Siempre igual, en todo el sistema. Nunca entra sola a un signo ni salta al estado 0.

- **Flechas laterales** (al borde, a media altura): **lo único que cambia de
  signo**. Recorren los nueve como una sola línea: el tercer signo de un
  subsistema lleva al primero del siguiente. Después del noveno viene el
  **cierre** si se habitaron los nueve; si no, se vuelve al primero.
- **Menú** (hamburguesa, arriba a la izquierda): ir a cualquier estado.
- **↓** salir un nivel: signo → cero del subsistema → estado 0.
- **↑** entrar (sólo desde un cero, a la estación enfocada).

**Deslizar de costado nunca cambia de signo.** Dentro de un signo no hace nada:
la pantalla es del signo y del dedo. La única excepción es la pantalla cero, que
es un carrusel: ahí el deslizamiento horizontal mueve el foco entre sus tres
estaciones, sin entrar a ninguna.

Deslizar exige recorrido largo, velocidad y eje dominante claro; si el gesto es
ambiguo no hace nada. Mientras se mantiene pulsado, el dedo puede moverse cuanto
quiera sin que el sistema navegue.

### El cierre

Se llega sólo pasando el noveno signo con los nueve ya recorridos. Los nueve
vuelven como en la grilla del estado 0, cada familia se reconoce y colapsa en un
solo signo, los tres se acuestan sobre la línea y la línea se contrae a un
punto. Pulsar el punto vuelve a empezar. No dice nada: se ve.

## La portada y las dos decisiones

Al cargar hay una portada con la línea, los tres signos que la atraviesan y dos
interruptores. Son signos, no palabras, porque tienen que servir justamente
cuando la palabra está apagada:

| | |
|---|---|
| ondas que salen | **sonido** sí o no |
| tres renglones | **texto** sí o no |

**Por defecto el sistema arranca sin texto y con sonido.** Las dos decisiones se
recuerdan de una visita a la otra, y se pueden cambiar en cualquier momento
desde el pie del menú. Tocar en cualquier otro lado de la portada entra.

## Texto

Dentro de los nueve signos no hay ni una palabra: se entienden por sí mismos.
Ningún signo tiene textura de fondo: el fondo está vacío en los nueve.

Con el texto **apagado** —el estado por defecto— no queda una letra en ningún
lado, y todo lo que hacía la palabra lo hace un signo:

- el **estado 0** es la grilla de nueve miniaturas vivas, sin rótulos;
- cada **pantalla cero** encabeza con el signo de su subsistema (□, ○, △) en
  lugar de su nombre;
- las **transiciones** muestran sólo la línea, sin el nombre del destino;
- y el **menú se vuelve un mapa**: arriba la línea (el estado 0) y debajo una
  fila por subsistema, con su signo al frente y sus tres signos vivos al lado.
  Los trece destinos se tocan igual que antes, sin leer nada.

Con el texto **encendido** vuelven los nombres, las glosas, el título, la
cátedra y los integrantes, y el menú vuelve a ser la lista del sistema.

## Estructura

```
index.html
css/style.css
js/lib/p5.min.js
js/core/    utils · palette · config · input · transitions · ui · sceneManager · previews
js/scenes/  scene · home · zeros · sub1 · sub2 · sub3 · cierre
js/main.js
```

`config.js` define el sistema de forma declarativa (subsistemas, signos,
integrantes). `previews.js` dibuja las miniaturas cinéticas que se ven en la
grilla del estado 0 y en las pantallas cero: son fieles al signo real.

## Correr el proyecto

Hace falta un servidor local (p5 carga los scripts por HTTP):

```bash
python -m http.server 5178
```

Y abrir `http://localhost:5178`.
