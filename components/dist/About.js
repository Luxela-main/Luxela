"use strict";
exports.__esModule = true;
var image_1 = require("next/image");
var react_1 = require("react");
function About() {
    return (react_1["default"].createElement("section", { id: "about", className: 'py-20 px-4' },
        react_1["default"].createElement("div", { className: 'container max-w-6xl mx-auto' },
            react_1["default"].createElement("div", { className: 'text-center max-w-[1041px] mx-auto' },
                react_1["default"].createElement("h2", { className: 'text-[#F9F9F9] leading-[120%] text-[2rem] -trackin-[3%] font-bold' }, "About Luxela"),
                react_1["default"].createElement("p", { className: 'text-sm md:text-lg text-[#BFBFBF] mt-5 mb-16' }, "Luxela is a fashion marketplace where buyers connect directly with designers and shop exclusive collections. Enjoy seamless payments with fiat or digital assets, low fees, and a secure, community-driven experience. We empower small creators with global access and offer a trusted space for discovering authentic style.\u00A0")),
            react_1["default"].createElement("div", { className: "max-w-[1240px] mx-auto" },
                react_1["default"].createElement(image_1["default"], { src: "/images/about-1240x802.png", width: 1240, height: 802, alt: "Luxela." })))));
}
exports["default"] = About;
