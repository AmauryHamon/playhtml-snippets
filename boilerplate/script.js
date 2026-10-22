// Load the playhtml library.
import { playhtml } from "https://unpkg.com/playhtml";

// Start playhtml. This connects the page so everyone shares the same data,
// sets up built-in elements like the can-toggle lamp, and turns on
// live cursors so you can see other visitors' mice.
//
// playhtml remembers who you are in this browser, so normally every tab you
// open counts as the SAME person. While testing on localhost, we give each
// tab its own made-up identity instead, so each tab counts as a separate
// person (with its own cursor color). On the real site this is skipped.
const isLocalhost =
	location.hostname === "localhost" || location.hostname === "127.0.0.1";

let tabIdentity = undefined;
if (isLocalhost) {
	tabIdentity = {
		publicKey: crypto.randomUUID(), // a random id, new for every tab
		playerStyle: {
			// a random color like "#3fa2c1"
			colorPalette: [
				"#" + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0"),
			],
		},
	};
}

playhtml.init({ cursors: { enabled: true }, playerIdentity: tabIdentity });


// Find the lamp button in index.html.
const lamp = document.getElementById("my-lamp");

// Every time the lamp is clicked, add 1 to the shared count.
lamp.addEventListener("click", function () {
	// We pass setData a function that changes the data in place.
	// This adds 1 to whatever the shared count is right now,
	// so two people clicking at the same moment both get counted.
	counter.setData(function (data) {
		data.count = data.count + 1;
	});

	// Note:
	// setData doesn't change the count immediately, so this logs the OLD value.
	// The new value shows up in update() above a moment later.
	// console.log(counter.getData());
});

// =======================
// Random BG on Lamp Click
// =======================

// Make the page itself (<body id="page">) a shared element that stores
// the background color, so everyone sees the same color.
const page = playhtml.register("page", {
    // No color yet ("" means "use the normal background").
    defaultData: { color: "" },

    // Runs whenever the color changes, for everyone.
    update: function (info) {
        info.element.style.backgroundColor = info.data.color;
    },
});

// When the lamp is clicked, pick a random color and share it.
lamp.addEventListener("click", function () {
    // a random color like "#3fa2c1"
    const randomColor =
        "#" + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0");

    // setData lives on the handle that register() gave us (page),
    // not on playhtml itself.
    page.setData(function (data) {
        data.color = randomColor;
    });
});





// Make #counter a shared element. Everyone who visits sees the same number.
// it persists after a page refresh.
// "counter" is the id of <div id="counter"> in index.html.
// register() gives back a "handle" we can use later to change the data.
const counter = playhtml.register("counter", {
	// What the data looks like the very first time.
	// It must be an object like { count: 0 }, not just the number 0.
	defaultData: { count: 0 },

	// Runs whenever the count changes, for everyone.
	// info.element is the <div id="counter">, and info.data is the current data.
	// Whatever the data is, this function decides what shows on the page.
	update: function (info) {
		// console.log(info.data); // shows the NEW count each time it changes
		info.element.textContent =
			"lamp clicked " + info.data.count + " times";
	},
});

// ===================
// New Visitor Message
// ===================

function newVisitor() {
    // #new-visitor is a box that holds the messages.
    // Each visitor gets their OWN new message inside it, so if several people
    // arrive together, the messages stack on top of each other.
    const newVisitorDiv = document.getElementById("new-visitor");
    const message = document.createElement("div");
    message.textContent = "A new visitor has joined!";
    message.style.transition = "opacity 1s";
    newVisitorDiv.appendChild(message);

    // fade out the message after 3 seconds...
    setTimeout(() => {
            message.style.opacity = "0";
    }, 3000);
    // ...then remove it once the 1 second fade is done
    setTimeout(() => {
            message.remove();
    }, 4000);
}

// How many people were on the page last time we checked.
// It starts as null, meaning "we haven't checked yet".
let lastUserCount = null;

// playhtml calls this function whenever someone joins or leaves the page.
// users is a list of everyone currently here (including you).
playhtml.users.onChange(function (users) {
	// If there are more people than last time, someone just joined.
	// We skip the very first check, so you don't get the message for yourself.
	// If 2 people arrive in the same moment, the count jumps by 2,
	// so we show one message per new person.
	if (lastUserCount !== null && users.length > lastUserCount) {
		const newPeople = users.length - lastUserCount;
		for (let i = 0; i < newPeople; i++) {
			newVisitor();
		}
	}
	lastUserCount = users.length;
});

// ===================
// Visitor Counter
// ===================

// Show how many people are on the page right now, in the top right corner.
// playhtml calls this whenever someone joins or leaves (it also runs once
// right away, so the number shows up as soon as the page loads).
const liveCount = document.getElementById("live-count");
playhtml.users.onChange(function (users) {
	liveCount.textContent = users.length + " live";
});


// =======================
// Wheel of Fortune Labels
// =======================

// Make every wheel label editable by everyone.
// We loop over all elements with class "wheel-label" and share each one.
const labels = document.querySelectorAll(".wheel-label");
labels.forEach(function (label) {
	const labelHandle = playhtml.register(label, {
		// Start with whatever text is written in index.html.
		defaultData: { text: label.textContent },

		// Show the shared text. We skip this while YOU are typing in it,
		// so your cursor doesn't jump around mid-word.
		update: function (info) {
			if (document.activeElement !== info.element) {
				info.element.textContent = info.data.text;
			}
            // if empty show default text
            if (info.data.text.trim() === "") {
                info.element.textContent = "Edit me!";
            }
		},
	});

	// When you click away (or press Enter), save the text for everyone.
	label.addEventListener("blur", function () {
		labelHandle.setData(function (data) {
			data.text = label.textContent;
		});
	});
	label.addEventListener("keydown", function (event) {
		if (event.key === "Enter") {
			event.preventDefault(); // don't add a new line
			label.blur(); // click away, which saves (see above)
		}
	});

	// Pressing on a label normally starts spinning the wheel (can-spin).
	// Stop that, so clicking a label lets you edit it instead.
	// Drag on the colored area between labels to spin.
	label.addEventListener("mousedown", function (event) {
		event.stopPropagation();
	});
	label.addEventListener("touchstart", function (event) {
		event.stopPropagation();
	});
});
