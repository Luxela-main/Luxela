"use strict";
exports.__esModule = true;
var react_1 = require("react");
var Navbar_1 = require("./Navbar");
var image_1 = require("next/image");
var link_1 = require("next/link");
function Header() {
    return (react_1["default"].createElement(react_1["default"].Fragment, null,
        react_1["default"].createElement(Navbar_1["default"], null),
        react_1["default"].createElement("header", { className: "bg-[url('/images/hero-bg-1440x1066.png')] bg-cover bg-center bg-no-repeat h-screen 2xl:h-[1024px] mx-auto w-full relative" },
            react_1["default"].createElement("div", { className: "absolute top-0 left-0 2xl:left-1/2 transform -translate-x-1/2 bg-[url('/images/Glare-1321x760.png')] h-[760px] w-[1321px] pointer-events-none" }),
            react_1["default"].createElement("div", { className: "absolute inset-0 bg-[#0E0E0E] opacity-35 z-5" }),
            react_1["default"].createElement(image_1["default"], { src: '/images/Light-852x785.svg', width: 852, height: 785, alt: "light effect", className: "z-10 absolute top-0 right-0 " }),
            react_1["default"].createElement(image_1["default"], { src: '/images/Bgs-120x60.svg', width: 120, height: 60, alt: "chevron down", className: "z-10 absolute bottom-30 left-1/2 transform -translate-x-1/2" }),
            react_1["default"].createElement("div", { className: "relative flex flex-col pt-20 items-center justify-center" },
                react_1["default"].createElement("div", { className: "relative w-[194px] !h-12" },
                    react_1["default"].createElement("div", { className: "rounded-full h-full bg-gradient-to-r from-[#6F42C1] via-[#9675D2] to-[#B8A3E1] p-0.5" },
                        react_1["default"].createElement("div", { className: " rounded-full h-full  text-sm font-medium bg-[#1C1111] flex items-center justify-center" },
                            react_1["default"].createElement("span", { className: 'bg-gradient-to-r h-full flex items-center from-[#F8DFFC] to-[#FEC5F3] text-center font-[400] leading-[100%] text-transparent bg-clip-text' }, "Pay With Crypto")))),
                react_1["default"].createElement("div", { className: 'text-center max-w-[793px] mt-6' },
                    react_1["default"].createElement("h1", { className: "text-white lg:text-[3rem] font-bold leading-[120%] tracking-[6%] " },
                        "Authentic Fashion, ",
                        react_1["default"].createElement("span", { className: 'text-[#8451E1]' }, "Global Reach"),
                        ", ",
                        react_1["default"].createElement("br", null),
                        "A New Era of E-commerce"),
                    react_1["default"].createElement("p", { className: 'text-[#BFBFBF] my-5' }, "An e-commerce platform where you can buy and sell authentic fashion products easily. Pay with local currencies or digital assets, and experience seamless, affordable fashion like never before."),
                    react_1["default"].createElement("div", { className: 'grid sm:grid-cols-2 gap-5 w-full h-12 max-w-[338px] mx-auto' },
                        react_1["default"].createElement(link_1["default"], { href: '#', className: "!cursor-pointer rounded-md text-white bg-gradient-to-b from-[#9872DD] via-#8451E1] to-[#5C2EAF] p-0.5" },
                            react_1["default"].createElement("div", { className: 'rounded-md w-full h-full flex items-center justify-center ' },
                                react_1["default"].createElement("span", null, "Shop Now"))),
                        react_1["default"].createElement(link_1["default"], { href: '#', className: "!cursor-pointer rounded-md text-white bg-gradient-to-b from-[#9872DD] via-#8451E1] to-[#5C2EAF] p-0.5" },
                            react_1["default"].createElement("div", { className: 'rounded-md w-full h-full bg-[#0E0E0E] flex items-center justify-center ' },
                                react_1["default"].createElement("span", null, "Sell Now"))))),
                react_1["default"].createElement("div", { className: "z-10 mt-10 w-full max-w-[1611px] mx-auto h-full min-h-[700px] relative overflow-x-hidden" },
                    react_1["default"].createElement("div", { className: 'rounded-[16px] border-[0.75px] border-[#8451E1] -left-[93px] absolute w-[300px] h-[375px]' },
                        react_1["default"].createElement(image_1["default"], { src: "/images/hero/1st.png", width: 300, height: 375, alt: "Image of cloth", className: "rounded-[16px] w-full h-full" })),
                    react_1["default"].createElement("div", { className: 'rounded-[16px] border-[0.75px] border-[#8451E1] absolute top-[72px] left-[234px] w-[300px] h-[375px]' },
                        react_1["default"].createElement(image_1["default"], { src: "/images/hero/2nd.jpg", width: 300, height: 375, alt: "Image of cloth", className: "rounded-[16px] w-full h-full" })),
                    react_1["default"].createElement("div", { className: 'rounded-[16px] border-[0.75px] border-[#8451E1] absolute top-[173px] left-[555px] w-[300px] h-[375px]' },
                        react_1["default"].createElement(image_1["default"], { src: "/images/hero/3rd.png", width: 300, height: 375, alt: "Image of cloth", className: "rounded-[16px] w-full h-full" })),
                    react_1["default"].createElement("div", { className: 'rounded-[16px] border-[0.75px] border-[#8451E1] absolute top-[72px] left-[880px] w-[300px] h-[375px]' },
                        react_1["default"].createElement(image_1["default"], { src: "/images/hero/4th.png", width: 300, height: 375, alt: "Image of cloth", className: "rounded-[16px] w-full h-full" })),
                    react_1["default"].createElement("div", { className: 'rounded-[16px] border-[0.75px] border-[#8451E1] -right-[145px] absolute w-[300px] h-[375px]' },
                        react_1["default"].createElement(image_1["default"], { src: "/images/hero/5th.png", width: 300, height: 375, alt: "Image of cloth", className: "rounded-[16px] w-full h-full" })))))));
}
exports["default"] = Header;
