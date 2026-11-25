import { RuleTester } from "eslint";
import plugin from "./index.js";

const tester = new RuleTester({ languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } } });

tester.run("prefer-components", plugin.rules["prefer-components"], {
  valid: ["<Button>Save</Button>", '<input type="hidden" name="id" />', { code: "<a href='/x'>x</a>", options: [{ allow: ["a"] }] }],
  invalid: [
    { code: "<button>Save</button>", errors: [{ messageId: "replace" }] },
    { code: '<input type="email" />', errors: [{ messageId: "replace" }] },
    { code: "<dialog open />", errors: [{ messageId: "replace" }] },
  ],
});

tester.run("no-internal-imports", plugin.rules["no-internal-imports"], {
  valid: ['import { Button } from "@squonkstack/ui/button";', 'import { Button } from "@squonkstack/ui";'],
  invalid: [
    { code: 'import x from "@squonkstack/ui/dist/components/x.mjs";', errors: [{ messageId: "internal" }] },
    { code: 'import { Button } from "react-aria-components";', errors: [{ messageId: "underlying" }] },
  ],
});

tester.run("no-color-literals", plugin.rules["no-color-literals"], {
  valid: ['<div style={{ color: "var(--squonk-roles-color-text)" }} />', '<div className="#fff" />'],
  invalid: [
    { code: '<div style={{ color: "#ff0000" }} />', errors: [{ messageId: "literal" }] },
    { code: "<div style={{ background: `rgb(0 0 0)` }} />", errors: [{ messageId: "literal" }] },
  ],
});
