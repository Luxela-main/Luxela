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
    var _b = react_1.useState(false), mobileMenuOpen = _b[0], setMobileMenuOpen = _b[1];
    react_1.useEffect(function () {
        var handleScroll = function () {
            setSticky(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return function () { return window.removeEventListener('scroll', handleScroll); };
    }, []);
    return (react_1["default"].createElement("nav", { className: "z-50 transition-all duration-300 text-white " + (sticky ? 'sticky top-0 left-0 right-0 bg-[#0A0A0A]/80 backdrop-blur-md' : 'relative bg-transparent') },
        react_1["default"].createElement(image_1["default"], { src: '/images/Light-852x785.svg', width: 852, height: 785, alt: "light effect", className: "-z-1 absolute top-0 right-0 " }),
        react_1["default"].createElement("div", { className: "container z-10 mx-auto px-2 md:px-10 py-4 flex justify-between items-center" },
            react_1["default"].createElement("ul", { className: "hidden md:flex items-center space-x-9" }, navItems.map(function (item) { return (react_1["default"].createElement("li", { key: item.name + item.route },
                react_1["default"].createElement(link_1["default"], { href: item.route, className: "text-xs lg:text-sm hover:text-purple-500 transition" }, item.name))); })),
            react_1["default"].createElement("button", { className: "cursor-pointer md:hidden text-white", onClick: function () { return setMobileMenuOpen(true); } },
                react_1["default"].createElement(lucide_react_1.Menu, { className: "h-6 w-6" })),
            react_1["default"].createElement(link_1["default"], { href: "/", className: "flex items-center w-[132px] md:w-[200px] h-[32px]" },
                react_1["default"].createElement(image_1["default"], { src: "/images/Luxela-white-logo-200x32.svg", width: 200, height: 32, className: 'w-full h-full', alt: 'Luxela logo' })),
            react_1["default"].createElement("div", { className: "flex items-center space-x-2" },
                react_1["default"].createElement(link_1["default"], { href: "/login", className: "h-[42px] flex items-center text-sm hover:text-purple-500 transition px-6" }, "Sell"),
                react_1["default"].createElement(link_1["default"], { href: "#", className: "h-[42px] flex items-center space-x-2 border border-[#FFFFFF66]/40 hover:border-purple-500 transition text-white rounded-[4px] px-6" },
                    react_1["default"].createElement("span", { className: 'hidden md:block' }, "Shop now"),
                    react_1["default"].createElement(lucide_react_1.ShoppingCart, { className: "h-4 w-4" })))),
        mobileMenuOpen && react_1["default"].createElement(MobileNav, { setMobileMenuOpen: setMobileMenuOpen })));
}
exports["default"] = Navbar;
var MobileNav = function (_a) {
    var setMobileMenuOpen = _a.setMobileMenuOpen;
    return (react_1["default"].createElement("div", { className: "md:hidden flex flex-col fixed top-0 w-screen h-screen bg-[#0E0E0E] z-40 px-6 py-4" },
        react_1["default"].createElement(image_1["default"], { src: '/images/Light-852x785.svg', width: 852, height: 785, alt: "light effect", className: "-z-1 absolute top-0 right-0 " }),
        react_1["default"].createElement("div", { className: "flex items-center mt-5 w-full" },
            react_1["default"].createElement(link_1["default"], { href: "/", className: "w-[132px] h-[21px] mx-auto " },
                react_1["default"].createElement(image_1["default"], { src: "/images/Luxela-white-logo-200x32.svg", width: 132, height: 32, className: "w-full h-full", alt: "Luxela logo" })),
            react_1["default"].createElement("button", { className: "size-9 text-white ml-auto cursor-pointer", onClick: function () { return setMobileMenuOpen(false); } },
                react_1["default"].createElement(lucide_react_1.X, { className: "size-6" }))),
        react_1["default"].createElement("ul", { className: "mt-10 flex flex-col space-y-6 text-sm" }, navItems.map(function (item) { return (react_1["default"].createElement("li", { key: item.name + item.route },
            react_1["default"].createElement(link_1["default"], { href: item.route, onClick: function () { return setMobileMenuOpen(false); }, className: "flex items-center hover:text-purple-500 transition text-[1.5rem]" },
                react_1["default"].createElement("span", null, item.name),
                " ",
                react_1["default"].createElement(lucide_react_1.ChevronRight, { className: 'ml-auto hover:text-[#8451E1] mr-10' })))); })),
        react_1["default"].createElement(link_1["default"], { href: "#", className: "mt-auto h-[42px] flex items-center justify-center space-x-2 bg-purple-500 transition text-white rounded-[10px] px-6" },
            react_1["default"].createElement("span", { className: '' }, "Shop now"),
            react_1["default"].createElement(lucide_react_1.ShoppingCart, { className: "ml-2 h-4 w-4" }))));
};
