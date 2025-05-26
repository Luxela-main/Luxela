"use strict";
exports.__esModule = true;
exports.metadata = void 0;
var google_1 = require("next/font/google");
require("./globals.css");
var spaceGrotesk = google_1.Space_Grotesk({ subsets: ["latin"] });
exports.metadata = {
    title: "LUXELA",
    description: "E-commerce platform for authentic fashion"
};
function RootLayout(_a) {
    var children = _a.children;
    return (React.createElement("html", { lang: "en", className: "scroll-smooth" },
        React.createElement("body", { className: spaceGrotesk.className }, children)));
}
exports["default"] = RootLayout;
