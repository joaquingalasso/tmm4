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
| CADUCIDAD | frena el tránsito un instante; la resistencia se afloja sola y nunca alcanza | lo apura: todo se acelera y lo que quedaba se deshace más rápido |
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

## Texto

Dentro de los nueve signos no hay ni una palabra: se entienden por sí mismos.
La palabra vive sólo en las superficies de navegación — el estado 0 (el nombre
sobre cada miniatura y los integrantes abajo), las pantallas cero, el menú, y el
nombre del destino durante la transición.

Ningún signo tiene textura de fondo: el fondo está vacío en los nueve.

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
