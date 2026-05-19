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
        slug: "epistemic-velocity",
        order: 1,
        category: "value",
        title: "epistemic velocity",
        summary: "Curiosity disciplined into pace; learning as the only durable hedge against decay.",
        markdownFile: "epistemic-velocity.md",
    },
    {
        slug: "adaptive-agency",
        order: 2,
        category: "belief",
        title: "adaptive agency",
        summary: "Fast revision, clear judgment, and the ability to move before consensus hardens.",
        markdownFile: "adaptive-agency.md",
    },
    {
        slug: "aesthetic-judgment",
        order: 3,
        category: "thought",
        title: "aesthetic judgment",
        summary: "Taste as compression: knowing what to remove, what to frame, and when to stop.",
        markdownFile: "aesthetic-judgment.md",
    },
    {
        slug: "ambient-agency",
        order: 4,
        category: "prediction",
        title: "ambient agency",
        summary: "Software will recede from destination into context, memory, and quiet execution.",
        markdownFile: "ambient-agency.md",
    },
];
exports.portfolioWritings = portfolioWritingConfigs.map((_a) => {
    var { markdownFile } = _a, writing = __rest(_a, ["markdownFile"]);
    return (Object.assign(Object.assign({}, writing), { markdown: readWritingMarkdown(markdownFile) }));
});
