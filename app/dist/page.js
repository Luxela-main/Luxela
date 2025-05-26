"use client";
"use strict";
exports.__esModule = true;
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
var Button_1 = require("@/components/ui/Button");
var Footer_1 = require("@/components/Footer");
var Header_1 = require("@/components/Header");
var Partners_1 = require("@/components/Partners");
var About_1 = require("@/components/About");
var Feature_1 = require("@/components/Feature");
var Brand_1 = require("@/components/Brand");
var GettingStarted_1 = require("@/components/GettingStarted");
function LandingPage() {
    return (React.createElement("main", null,
        React.createElement(Header_1["default"], null),
        React.createElement(Partners_1["default"], null),
        React.createElement(About_1["default"], null),
        React.createElement(Feature_1["default"], null),
        React.createElement(Brand_1["default"], null),
        React.createElement(GettingStarted_1["default"], null),
        React.createElement("section", { id: "how-to", className: "py-20 px-4 bg-[#0D0D0D]" },
            React.createElement("div", { className: "container mx-auto max-w-3xl" },
                React.createElement("h2", { className: "text-2xl md:text-3xl font-bold mb-12 text-center" }, "Frequently Asked Questions"),
                React.createElement("div", { className: "space-y-4" },
                    React.createElement(FaqItem, { question: "How does Luxela verify product authenticity?", answer: "Our team of experts reviews each item before it's listed. We use a combination of physical inspection, digital verification, and seller history to ensure all products are authentic." }),
                    React.createElement(FaqItem, { question: "Can I sell my own designer items on Luxela?", answer: "Yes! You can apply to become a seller on Luxela. We'll guide you through the verification process to ensure a smooth onboarding experience." }),
                    React.createElement(FaqItem, { question: "What payment methods are accepted?", answer: "We accept major credit cards, PayPal, and select cryptocurrencies including Bitcoin, Ethereum, and USDT." }),
                    React.createElement(FaqItem, { question: "How long does shipping take?", answer: "Shipping times vary depending on your location and the seller's location. Typically, domestic orders arrive within 3-5 business days, while international orders may take 7-14 business days." }),
                    React.createElement(FaqItem, { question: "What is your return policy?", answer: "We offer a 14-day return policy for most items. Items must be returned in their original condition with tags attached. Some limited edition or custom items may be final sale." }),
                    React.createElement(FaqItem, { question: "How do I contact customer support?", answer: "You can reach our customer support team via email at support@luxela.com or through the chat feature in your account. We're available 24/7 to assist you." })))),
        React.createElement("section", { className: "py-20 px-4" },
            React.createElement("div", { className: "container mx-auto max-w-4xl text-center" },
                React.createElement("h2", { className: "text-2xl md:text-3xl font-bold mb-4" }, "Embrace the Future of Fashion"),
                React.createElement("p", { className: "text-gray-400 mb-8 max-w-2xl mx-auto" }, "Join thousands of fashion enthusiasts already experiencing the next generation of online shopping."),
                React.createElement(Button_1.Button, { className: "bg-purple-600 hover:bg-purple-700 text-white rounded-full px-8 py-6 text-lg" }, "Get started now"))),
        React.createElement(Footer_1["default"], null)));
}
exports["default"] = LandingPage;
function FaqItem(_a) {
    var question = _a.question, answer = _a.answer;
    var _b = react_1.useState(false), isOpen = _b[0], setIsOpen = _b[1];
    return (React.createElement("div", { className: "border-b border-gray-800 pb-4" },
        React.createElement("button", { className: "flex justify-between items-center w-full text-left py-4", onClick: function () { return setIsOpen(!isOpen); } },
            React.createElement("h3", { className: "font-medium" }, question),
            React.createElement(lucide_react_1.ChevronDown, { className: "h-5 w-5 transition-transform " + (isOpen ? "rotate-180" : "") })),
        isOpen && (React.createElement("div", { className: "pb-4 text-gray-400" },
            React.createElement("p", null, answer)))));
}
