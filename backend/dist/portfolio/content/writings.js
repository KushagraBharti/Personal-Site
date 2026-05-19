"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.portfolioWritings = void 0;
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const writingMarkdownDirectories = [
    (0, node_path_1.resolve)(process.cwd(), "src/portfolio/content/writings"),
    (0, node_path_1.resolve)(process.cwd(), "backend/src/portfolio/content/writings"),
    (0, node_path_1.resolve)(__dirname, "writings"),
    (0, node_path_1.resolve)(__dirname, "../../../src/portfolio/content/writings"),
];
const readWritingMarkdown = (fileName) => {
    const directory = writingMarkdownDirectories.find((candidate) => (0, node_fs_1.existsSync)((0, node_path_1.resolve)(candidate, fileName)));
    if (!directory) {
        throw new Error(`Missing portfolio writing markdown file: ${fileName}`);
    }
    return (0, node_fs_1.readFileSync)((0, node_path_1.resolve)(directory, fileName), "utf8").trim();
};
const portfolioWritingConfigs = [
    {
        slug: "lifelong-learning",
        order: 1,
        category: "value",
        title: "lifelong learning",
        summary: "Permanent epistemic hunger as armor against entropy, complacency, and slow competitive death.",
        markdownFile: "lifelong-learning.md",
    },
    {
        slug: "kinetic-agency",
        order: 2,
        category: "belief",
        title: "kinetic agency",
        summary: "Flexibility, tempo, and first-principles violence against brittle plans in a moving world.",
        markdownFile: "kinetic-agency.md",
    },
    {
        slug: "common-intelligence",
        order: 3,
        category: "prediction",
        title: "common intelligence",
        summary: "When cognition commoditizes, access becomes infrastructure, morality, and liberation technology.",
        markdownFile: "common-intelligence.md",
    },
    {
        slug: "taste",
        order: 4,
        category: "thought",
        title: "taste",
        summary: "The filmmaker's curse: noticing rhythm, absence, light, and the moral residue of every cut.",
        markdownFile: "taste.md",
    },
];
exports.portfolioWritings = portfolioWritingConfigs.map((_a) => {
    var { markdownFile } = _a, writing = __rest(_a, ["markdownFile"]);
    return (Object.assign(Object.assign({}, writing), { markdown: readWritingMarkdown(markdownFile) }));
});
