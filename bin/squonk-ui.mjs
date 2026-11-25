#!/usr/bin/env node
// `npx @squonkstack/ui`: sets up @squonkstack/ui in an app. The logic is in setup.mjs.
import { main } from "./setup.mjs";

process.exitCode = await main();
