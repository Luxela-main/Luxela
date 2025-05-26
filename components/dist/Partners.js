"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
var image_1 = require("next/image");
var react_1 = require("react");
var partners = [
    { name: 'Solana', image: '/images/solana-foundation-432x71.svg' },
    { name: 'Solana', image: '/images/solana-sol-logo-horizontal 1-283x70.svg' },
    { name: 'Solana', image: '/images/superteam.svg' },
];
function Partners() {
    return (react_1["default"].createElement("section", { id: "#partner", className: 'container mx-auto relative  w-full overflow-hidden' },
        react_1["default"].createElement("div", { className: "mt-[150px] lg:mt-[400px] 2xl:mt-20 py-20" },
            react_1["default"].createElement("div", { className: "mx-auto " },
                react_1["default"].createElement("h2", { className: "text-[#F9F9F9] text-center text-2xl md:text-[2rem] font-bold -tracking-[3%] mb-16" }, "Our Trusted Partners"),
                react_1["default"].createElement("div", { className: "flex items-center space-x-9" }, __spreadArrays(partners, partners).map(function (partner, index) { return (react_1["default"].createElement("div", { key: index, className: "flex items-center justify-center h-[71px]" },
                    react_1["default"].createElement(image_1["default"], { width: 432, height: 71, src: partner.image, alt: partner.name, className: "h-full" }))); }))))));
}
exports["default"] = Partners;
