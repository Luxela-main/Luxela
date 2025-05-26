"use strict";
exports.__esModule = true;
var react_1 = require("react");
var link_1 = require("next/link");
var lucide_react_1 = require("lucide-react");
var image_1 = require("next/image");
var navItems = [
    { name: 'About Us', route: "#about" },
    { name: 'Featured Brands', route: "#brands" },
    { name: 'How To?', route: "#how-to" },
];
function Navbar() {
    var _a = react_1.useState(false), sticky = _a[0], setSticky = _a[1];
    react_1.useEffect(function () {
        var handleScroll = function () {
            if (window.scrollY > 10) {
                setSticky(true);
            }
            else {
                setSticky(false);
            }
        };
        window.addEventListener('scroll', handleScroll);
        return function () {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);
    var _b = react_1.useState(false), mobileMenuOpen = _b[0], setMobileMenuOpen = _b[1];
    return (react_1["default"].createElement("nav", { className: "z-50 transition-all duration-300 text-white " + (sticky ? 'sticky top-0 left-0 right-0 bg-[#0A0A0A]/80 backdrop-blur-md' : 'relative bg-transparent') },
        react_1["default"].createElement(image_1["default"], { src: '/images/Light-852x785.svg', width: 852, height: 785, alt: "light effect", className: "z-10 absolute top-0 right-0 " }),
        react_1["default"].createElement("div", { className: "container mx-auto px-10 py-4 flex justify-between items-center" },
            react_1["default"].createElement("ul", { className: "flex items-center space-x-9" }, navItems.map(function (item) { return (react_1["default"].createElement("li", { key: item.name + item.route },
                react_1["default"].createElement(link_1["default"], { href: item.route, className: "text-sm hover:text-purple-500 transition" }, item.name))); })),
            react_1["default"].createElement(link_1["default"], { href: "/", className: "flex items-center w-[200px] h-[32px]" },
                react_1["default"].createElement(image_1["default"], { src: "/images/Luxela-white-logo-200x32.svg", width: 200, height: 32, className: 'w-full h-full', alt: 'Luexal logo.' })),
            react_1["default"].createElement("div", { className: "flex items-center space-x-2" },
                react_1["default"].createElement(link_1["default"], { href: "/login", className: "h-[42px] flex items-center  text-sm hover:text-purple-500 transition-all duration-300 ease-in-out px-6" }, "Sell"),
                react_1["default"].createElement(link_1["default"], { href: "#", className: "h-[42px]  flex items-center space-x-2 border border-[#FFFFFF66]/40 hover:border-purple-500 transition-all duration-300 ease-in-out text-white rounded-[4px] px-6" },
                    "Shop now ",
                    react_1["default"].createElement(lucide_react_1.ShoppingCart, { className: "ml-2 h-4 w-4" }))),
            react_1["default"].createElement("button", { className: "md:hidden text-white", onClick: function () { return setMobileMenuOpen(true); } },
                react_1["default"].createElement(lucide_react_1.Menu, { className: "h-6 w-6" })))));
}
exports["default"] = Navbar;
