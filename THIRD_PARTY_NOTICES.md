# Third-party notices

`@squonkstack/ui` depends on, and adapts small amounts of styling from, the
open-source projects below. Runtime dependencies are listed in
`package.json`; their licences ship with them in `node_modules`.

## Styles adapted from Ark UI

The following rules were adapted from Ark UI's example CSS modules and
rewritten against this library's `--squonk-*` tokens. No other source was copied.

| Our file | Adapted from | What |
| --- | --- | --- |
| `src/components/functional/dropdown-menu/dropdown-menu.module.css`, `src/components/functional/select/select.module.css`, `src/components/functional/modal/modal.module.css`, `src/components/functional/select/searchable-select.module.css`, `src/components/functional/popover/popover.module.css`, `src/components/functional/tooltip/tooltip.module.css` | `chakra-ui/ark` `.storybook/modules/{menu,select,dialog}.module.css` | The scale-and-fade open/close keyframes (separate names for opening and closing, scaling from the trigger), now keyed off React Aria's `data-entering`/`data-exiting` |

- Repository: https://github.com/chakra-ui/ark
- Commit: `0820e29ecff9dcace6af6aab5d30ee61e9fb4015`
- Licence: MIT

```
MIT License

Copyright (c) 2024 Chakra Systems Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Icons

`src/components/functional-primitive/icon/icon.tsx` wraps a curated set of
glyphs from the `react-icons` package (a runtime dependency). Only the packs
imported there ship in the bundle; `icon-sources.test.ts` keeps new imports
to packs with permissive licences.

| Source | Used for | Licence |
| --- | --- | --- |
| [react-icons](https://github.com/react-icons/react-icons) | The React wrappers (`react-icons/*`) | MIT, © 2018 kamijin_fanta |
| [Lucide](https://lucide.dev/license) (`react-icons/lu`) | Every UI icon | ISC, © 2022 Lucide Contributors; icons derived from Feather are MIT, © 2013-2022 Cole Bemis |
| [Simple Icons](https://github.com/simple-icons/simple-icons) (`react-icons/si`) | Brand icons (`GitHubIcon`) | CC0 1.0. The brands themselves are trademarks of their owners; follow each brand's usage guidelines |

```
ISC License (Lucide)

Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of
Feather (MIT). All other copyright (c) for Lucide are held by Lucide
Contributors 2022.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```

The react-icons MIT licence text matches the Ark UI text above, with the
copyright line `Copyright 2018 kamijin_fanta <kamijin@live.jp>`.

## Documentation guidance

The UX pattern pages under `src/design-system/ux-patterns/` paraphrase guidance
from these sources and credit each one at the foot of the page that uses it. No
text was copied verbatim.

- W3C WAI-ARIA Authoring Practices Guide, © W3C, under the W3C Software and
  Document License: https://www.w3.org/WAI/ARIA/apg/
- Ark UI (MIT), Park UI (MIT, © 2025 cschroeter) and Chakra UI v3 (MIT, © 2019
  Chakra Systems Inc.) documentation
- React Aria and React Spectrum documentation and blog, © Adobe
