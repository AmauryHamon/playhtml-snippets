// Load the playhtml library. (p5 is loaded in index.html.)
import { playhtml } from "https://unpkg.com/playhtml";

// While testing on localhost, give each tab its own identity so each tab
// counts as a separate person. On the real site this is skipped.
// (Same trick as in the boilerplate folder.)
const isLocalhost =
	location.hostname === "localhost" || location.hostname === "127.0.0.1";

let tabIdentity = undefined;
if (isLocalhost) {
	tabIdentity = {
		publicKey: crypto.randomUUID(),
		playerStyle: {
			colorPalette: [
				"#" + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0"),
			],
		},
	};
}

playhtml.init({ cursors: { enabled: true }, playerIdentity: tabIdentity });

// =======================
// The idea
// =======================
//
// playhtml holds the SHARED data (what everyone sees).
// p5 just DRAWS that data, 60 times a second.
//
//   you click  ->  setData() adds a dot  ->  playhtml sends it to everyone
//   draw()     ->  reads the dots         ->  paints them on the canvas
//
// So p5 never keeps its own copy of the drawing. It always draws
// whatever playhtml says the data is right now.

// The most recent shared data. update() below keeps this fresh.
let shared = { dots: [] };

// Keep the list from growing forever (old dots get dropped).
const MAX_DOTS = 500;

// My color, so my dots look different from other people's.
const myColor =
	"#" + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0");

// Make #sketch a shared element that stores the list of dots.
const sketch = playhtml.register("sketch", {
	// Must be an object, not just an empty list.
	defaultData: { dots: [] },

	// Runs whenever anyone changes the dots (and once at the start).
	// We don't touch the page here; we just save the data for draw() to use.
	update: function (info) {
		shared = info.data;
	},
});

// =======================
// p5 sketch
// =======================

// We're inside a module (type="module"), so p5 can't find setup() and draw()
// on its own. Putting them on "window" lets p5 find them.

window.setup = function () {
	const canvas = createCanvas(windowWidth, windowHeight);
	canvas.parent("sketch"); // put the canvas inside <div id="sketch">
	noStroke();
};

window.draw = function () {
	background(245);

	// Draw every shared dot. Positions are saved as 0–1 (a fraction of the
	// screen) so they land in the same spot on any screen size.
	for (const dot of shared.dots) {
		fill(dot.color);
		circle(dot.x * width, dot.y * height, 20);
	}
};

window.mousePressed = function (event) {
	// Ignore clicks on buttons (like "clear"), only count clicks on the canvas.
	if (event && event.target.tagName !== "CANVAS") return;

	// Add a dot for everyone. Changing the data in place (push) means
	// two people clicking at the same moment both get their dot.
	sketch.setData(function (data) {
		data.dots.push({ x: mouseX / width, y: mouseY / height, color: myColor });
		if (data.dots.length > MAX_DOTS) {
			data.dots.splice(0, data.dots.length - MAX_DOTS);
		}
	});
};

window.windowResized = function () {
	resizeCanvas(windowWidth, windowHeight);
};

// =======================
// Clear button
// =======================

document.getElementById("clear").addEventListener("click", function () {
	sketch.setData(function (data) {
		data.dots.splice(0, data.dots.length); // empty the list for everyone
	});
});

// ===================
// Visitor Counter
// ===================

const liveCount = document.getElementById("live-count");
playhtml.users.onChange(function (users) {
	liveCount.textContent = users.length + " live";
});
