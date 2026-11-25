#!/usr/bin/env node
// `npx @squonk/ui`: sets up @squonk/ui in an app. The logic is in setup.mjs.
import { main } from "./setup.mjs";

process.exitCode = await main();
