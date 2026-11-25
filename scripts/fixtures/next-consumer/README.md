# App Router consumer acceptance fixture

The page and layout Server Components deliberately have no local `use client` directive. They exercise the published root and component subpaths, the library-owned provider/client boundaries, and the published CSS entry.

Copy `app/` into an isolated Next App Router TypeScript application using React versions supported by the library. Install the tarball produced by `npm pack` from this repository in that application, then run its production Next build and load `/`. Verify the three controls and their labels render, styles load, and the browser console contains no hydration errors. Do not resolve the library through its source directory or an alias: that would bypass the packed output under test.

The library's styles are static CSS from the published entry, so no style registry is needed. Verify a JavaScript-disabled first paint as well as hydrated controls.

This is an opt-in framework fixture. The repository's packed-consumer gate automatically checks native ESM/CommonJS loading, server rendering, declaration imports, published CSS/license metadata and client directive preservation without installing Next. A Next build/browser run remains a separate acceptance check; simply having this fixture is not evidence that it passed.
