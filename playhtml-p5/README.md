# playhtml + p5

A starter for combining [playhtml](https://playhtml.fun) with [p5.js](https://p5js.org). Click the canvas to leave a dot, and everyone on the page sees it.

playhtml holds the shared data, and p5 draws it every frame:

```
you click  ->  setData() adds a dot  ->  playhtml sends it to everyone
draw()     ->  reads the dots         ->  paints them on the canvas
```

## Pros

- **Each tool covers what the other lacks.** p5 handles drawing, animation and input but has no networking or saving. playhtml handles real-time sync and saving but has no drawing tools.
- **You can add sharing to an existing sketch** without writing a server or a database.
- **Live cursors and the visitor list work over the canvas**, so you get the feeling of other people being there for free.
- **The two rarely get in each other's way.** playhtml works on page elements and p5 works inside its canvas.

## Cons and things to watch for

### `can-*` attributes don't work on canvas shapes

The `can-*` attributes only work on page elements. A circle drawn with `circle()` isn't an element, so it can't take `can-move` or `can-toggle`.

- For shared dragging inside the sketch, store the positions in shared data and handle the dragging in p5 yourself.
- Or put normal HTML elements on top of the canvas and give those the `can-*` attributes.

### Shared data has to be plain values

Use numbers, strings, lists and objects only. You can't store a `p5.Vector`, a `p5.Color`, a `p5.Image` or the canvas pixels.

| Instead of           | Save        |
| -------------------- | ----------- |
| `createVector(x, y)` | `{ x, y }`  |
| `color(255, 0, 0)`   | `"#ff0000"` |

Images are too heavy to keep in shared data.

### Don't call `setData` every frame

Calling it from `draw()` or `mouseDragged()` sends data and saves it about 60 times a second, for everyone. That floods the network and makes the saved data huge.

- Save on discrete events like a click or a mouse release.
- For live, throwaway info such as "where my brush is right now", use playhtml's presence features, which aren't saved, rather than saved data.

### Late visitors only see what's in the data

A common p5 trick is to skip `background()` so drawings pile up on the canvas. That works on your screen, but someone who arrives later sees nothing, because the pixels themselves were never shared. Anything that should stay has to be redrawn from data, like the dots in this starter.

### Randomness and timing differ on each screen

`random()`, `noise()` and `frameCount` give different results on every computer, so animations won't match between people. To keep them in sync:

- Save the random results, or a shared seed for `randomSeed()` / `noiseSeed()`, in the data.
- Base animation on a shared time, such as `Date.now()` compared to a start time you saved, instead of `frameCount`.

### p5's global mode needs a workaround in modules

playhtml is loaded with `import`, so the script runs as a module, and p5 can't find your `setup()` and `draw()` there. That's why `script.js` puts them on `window`:

```js
window.setup = function () { /* ... */ };
window.draw = function () { /* ... */ };
```

The alternative is p5's instance mode (`new p5(s => { s.setup = ... })`), which is cleaner but changes how you write sketches (`s.circle`, `s.mouseX`, and so on).

### p5's mouse functions listen to the whole page

`mousePressed` also fires when you click buttons or other playhtml elements on top of the canvas. That's why `script.js` checks `event.target`. You can also put the listener on the canvas only with `canvas.mousePressed(...)`.

### Shared data grows if nothing limits it

Every saved stroke stays forever unless you remove it, which is what `MAX_DOTS` does in `script.js`. Long strokes made of many points add up fast, so keep only every few points.

### Updates take a moment to arrive

Other people's changes come in a fraction of a second later. That's fine for drawing together but not good enough for fast games where timing matters.

## What doesn't work together

- playhtml's ready-made `can-*` behaviours don't apply to anything drawn on the canvas.
- p5 features that keep their state in pixels or in p5 objects don't carry over to other people. That covers piled-up drawings, `p5.Image` and `p5.Graphics` buffers, `saveCanvas` and vectors.

Everything else works, as long as the shared part is stored as plain data and p5 draws from it.
