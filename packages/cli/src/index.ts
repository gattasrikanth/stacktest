#!/usr/bin/env node
import { handleArgs } from "./cli.js";

const result = handleArgs(process.argv.slice(2));
console.log(result.output);
process.exit(result.exitCode);
