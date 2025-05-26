"use strict";
exports.__esModule = true;
var image_1 = require("next/image");
var link_1 = require("next/link");
var react_1 = require("react");
var brands = [
    {
        title: 'BAZ.NG',
        description: "We do not exist as a singular element. Our genetic make up is a stepping stone to our individuality, but even then, our genetic make up is not a singular entity. As we grow, we learn and unlearn, we experience and we forget, we take and we give back. There's more variation in our individuality per day.",
        image: '/images/baz-500x402.png',
        cta: 'Shop Now'
    },
    {
        title: 'HONORAH',
        description: 'HONORAH- creates timeless pieces that elevate everyday moments and empower self-expression, Rooted in elegance and simplicity, as you Style Forward.',
        image: '/images/baz-500x402.png',
        cta: 'Shop Now'
    }
];
function Brand() {
    return (react_1["default"].createElement("section", { id: "brands", className: 'py-20 px-4' },
        react_1["default"].createElement("main", { className: 'max-w-6xl mx-auto' },
            react_1["default"].createElement("div", { className: 'text-center max-w-[1041px] mx-auto' },
                react_1["default"].createElement("h2", { className: 'text-[#F9F9F9] leading-[120%] text-[2rem] -tracking-[3%] font-bold' }, "Featured Brands on Luxela")),
            react_1["default"].createElement("div", { className: "flex space-x-6 overflow-x-hidden w-full mt-12" }, brands.map(function (brand, index) { return (react_1["default"].createElement("div", { key: brand.description, className: (index === 0 ? 'min-w-[80%] lg:min-w-[1010px]' : 'w-full lg:min-w-[500px]') + " min-h-[617px] p-6 bg-gradient-to-t from-[#141414] to-[#2c2b2b] rounded-[20px] py-3 lg:py-24 px-6 flex flex-col lg:flex-row items-center space-x-6 border-[0.75px] border-[#8451E1] " + (index === brands.length - 1 ? 'mr-[250px]' : '') },
                react_1["default"].createElement("div", { className: "lg:w-[500px]" },
                    react_1["default"].createElement("h3", { className: 'text-lg lg:text-[2rem] font-semibold text-[#F9F9F9]' }, brand.title),
                    react_1["default"].createElement("p", { className: 'text-sm lg:text-lg text-[#BFBFBF] my-9' }, brand.description),
                    react_1["default"].createElement(link_1["default"], { href: "#", className: "hidden lg:inline-flex items-center justify-center mt-6 h-[42px] bg-gradient-to-r from-[#9872DD] via-[#8451E1] to-[#5C2EAF] transition text-white rounded-[6px] px-6" }, "Shop now")),
                react_1["default"].createElement(image_1["default"], { src: brand.image, width: 500, height: 402, alt: "Photo of " + brand.title, className: 'my-9 lg:my-0' }),
                react_1["default"].createElement(link_1["default"], { href: "#", className: "lg:hidden w-full flex items-center justify-center mt-6 h-[42px] bg-gradient-to-r from-[#9872DD] via-[#8451E1] to-[#5C2EAF] transition text-white rounded-[6px] px-6" }, "Shop now"))); })))));
}
exports["default"] = Brand;
