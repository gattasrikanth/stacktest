#!/usr/bin/env node
import { handleArgs } from "./cli.js";

const resultOrPromise = handleArgs(process.argv.slice(2));

Promise.resolve(resultOrPromise)
  .then((result) => {
    console.log(result.output);
    if ("keepAlive" in result && result.keepAlive) {
      return;
    }
    process.exit(result.exitCode);
  })
  .catch((err) => {
    console.error("Unhandled CLI execution error:", err);
    process.exit(1);
  });
