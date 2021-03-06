#!/usr/bin/env node

/*
 * A PlainScript Compiler
 *
 * This is a command line application that compiles a PlainScript program from
 * a file. Synopsis:
 *
 * ./plainscript.js -a <filename>
 *     writes out the AST and stops
 *
 * ./plainscript.js -i <filename>
 *     writes the decorated AST then stops
 *
 * ./plainscript.js <filename>
 *     compiles the PlainScript program to JavaScript, writing the generated
 *     JavaScript code to standard output.
 *
 * ./plainscript.js -o <filename>
 *     optimizes the intermediate code before generating target JavaScript.
 *
 * Output of the AST and decorated AST uses the object inspection functionality
 * built into Node.js.
 */

const fs = require('fs');
const util = require('util');
const yargs = require('yargs');
const parse = require('./syntax/parser');
require('./backend/javascript-generator');

// If compiling from a string, return the AST, IR, or compiled code as a string.
function compile(sourceCode, { astOnly, frontEndOnly, shouldOptimize }) {
  let program = parse(sourceCode);
  if (astOnly) {
    return util.inspect(program, { depth: null });
  }
  program.analyze();
  if (shouldOptimize) {
    program = program.optimize();
  }
  if (frontEndOnly) {
    return util.inspect(program, { depth: null });
  }
  return program.gen();
}

// If compiling from a file, write to standard output.
function compileFile(filename, options) {
  fs.readFile(filename, 'utf-8', (error, sourceCode) => {
    if (error) {
      console.error(error);
      return;
    }
    console.log(compile(sourceCode, options));
  });
}

// If running as a script, input is a file name on the command line.
if (require.main === module) {
  const { argv } = yargs.usage('$0 [-a] [-o] [-i] filename')
    .boolean(['a', 'o', 'i'])
    .describe('a', 'show abstract syntax tree after parsing then stop')
    .describe('o', 'do optimizations')
    .describe('i', 'generate and show the decorated abstract syntax tree then stop')
    .demand(1);
  compileFile(argv._[0], { astOnly: argv.a, frontEndOnly: argv.i, shouldOptimize: argv.o });
}
