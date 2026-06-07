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
        slug: "perpetual-learning",
        order: 1,
        category: "value",
        title: "perpetual learning",
        summary: "Learning as the discipline of staying corrigible before comfort, fluency, and success become inertia.",
        markdownFile: "perpetual-learning.md",
    },
    {
        slug: "kinetic-agency",
        order: 2,
        category: "belief",
        title: "kinetic agency",
        summary: "Turning abundant intelligence into motion through fast feedback, real shipping, and active adaptation.",
        markdownFile: "kinetic-agency.md",
    },
    {
        slug: "discernment",
        order: 3,
        category: "thought",
        title: "discernment",
        summary: "Taste as selection: the software and cinematic grammar of what to remove, automate, and make invisible.",
        markdownFile: "discernment.md",
    },
    {
        slug: "predictions",
        order: 4,
        category: "prediction",
        title: "predictions",
        summary: "Notes on agents as cognitive infrastructure, democratized capability, and freedom as the next luxury.",
        markdownFile: "predictions.md",
    },
];
exports.portfolioWritings = portfolioWritingConfigs.map((_a) => {
    var { markdownFile } = _a, writing = __rest(_a, ["markdownFile"]);
    return (Object.assign(Object.assign({}, writing), { markdown: readWritingMarkdown(markdownFile) }));
});
