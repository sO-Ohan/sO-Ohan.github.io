# Basics of Robotics — BRACU RoboU
35 slides, white theme, built for a projector. Everything runs offline in Chrome.

## Run the deck
```
xdg-open ~/robotics-lecture/index.html
```
Press **F** for full screen. Nothing to install.

## The warm-up survey (slide 3)
Hosted on Claude, so it works over mobile data and needs nothing running on your laptop.

    https://claude.ai/code/artifact/faab7a33-15e6-4666-809f-e66d1ffb0b53

The QR on slide 3 points at it. Students answer five questions on their phones and every
answer lands in the same shared page.

**Before class, open that link and share it from the page's share menu with edit access.**
The page is private until you do, and answers only save for viewers who can write. A viewer
who cannot write sees a banner on the page saying so, rather than failing silently.

To show results on the projector, press **Open live results** on slide 3. It opens the vote
page in a second window; press **Show the results screen** there. On a wide screen the
results lay out in two columns with a big count. The deck cannot embed that view inside a
slide because Claude only allows the page to frame itself.

Two of the five questions have a right answer, marked on the results screen once answers
come in. Most people pick the wrong one on both, which is the point.

Slide 3 also has a tap-to-count poll for hands in the air, in case the vote does not happen.

If the venue has no internet at all, `python3 voteserver.py` serves the same five questions
off your laptop over local wifi and prints its own QR. The deck does not read from it, so
you would show results from the browser tab it prints.

## Keys
| Key | Does |
|---|---|
| `→` `space` / `←` | next / previous |
| `O` | all slides, click to jump |
| `F` | full screen |
| `S` | short version, skips the two optional slides |
| `B` | blank the screen |
| click left / right quarter | previous / next |

The clock in the bottom left starts when you click it.

## The coding slides (18 to 24)
Seven exercises on a real Arduino interpreter that runs in the browser.

- **Editor**, left, dressed as the real IDE: title bar, board selector, Verify / Upload /
  Stop, file tabs, a line-number gutter and a Ln/Col status bar. Type real Arduino C++ and
  hover any word for a plain-English explanation. **Verify** compiles without running,
  **Upload** runs it on the simulated board.
- **Serial monitor**, bottom left. Output, warnings and errors with line numbers. Type into
  it to send characters to the running sketch.
- **The bench**, top right: a drawn Arduino UNO wired to a breadboard with real jumper
  wires. Only the parts an exercise uses are shown. LEDs light, the knob drags, the button
  presses, the servo turns, the buzzer makes real sound.
- **Wiring**, under the bench. Every connection and why it exists.

What the interpreter supports: `setup`/`loop`, variables, arrays, `if`/`else`, `for`,
`while`, functions you define, `pinMode`, `digitalWrite`, `digitalRead`, `analogRead`,
`analogWrite`, `delay`, `millis`, `map`, `constrain`, `tone`/`noTone`, the whole `Serial`
family, and `Servo` with `attach`/`write`/`read`. It reports missing semicolons and missing
commas with a line number, which is the point.

Click once anywhere before slide 19 so Chrome allows the buzzer audio.

## Slide order
1–4 welcome, instructor, warm-up, plan
5–8 what a robot is made of: sense, act, the loop
9–13 the brain: MCU vs CPU vs SBC, inside the chip, what 16 MHz means, the board family, why Arduino
14–16 the UNO: every part, the pin map, power
17–24 writing code: the workbench tour then seven exercises
25–28 signals: digital and analog, logic levels, PWM, other signal shapes
29–31 motors: why a driver, the H-bridge, four motor types
32–34 chips talking: why buses exist, UART/I2C/SPI/1-Wire/RS-485/CAN, which to pick
35 recap and homework

Slides 16 and 28 are marked optional and are what `S` skips.

## Files
| File | What it is |
|---|---|
| `index.html` | slide markup |
| `style.css` | the design system |
| `deck.js` | navigation, chapter colour, background, clock |
| `uno.js` | the Arduino UNO drawing, with pin coordinates for wiring |
| `sim.js` | the Arduino interpreter and the hardware model |
| `workbench.js` / `workbench.css` | editor, console, bench, the seven exercises |
| `modules.js` | every other interactive slide |
| `vote.html` | the survey page, published to Claude |
| `voteserver.py` | offline fallback survey, only if there is no internet |
| `assets/` | logos, portraits, QR codes |

`?nofx` in the URL freezes the animation loops, which is only useful for screenshots.
