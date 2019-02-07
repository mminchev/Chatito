#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const rasa = require("./adapters/rasa");
const snips = require("./adapters/snips");
const web = require("./adapters/web");
const utils = require("./utils");
const argv = require('minimist')(process.argv.slice(2));
const adapters = { default: web, rasa, snips };
const workingDirectory = process.cwd();
const getFileWithPath = (filename) => path.resolve(workingDirectory, filename);
const chatitoFilesFromDir = (startPath, cb) => __awaiter(this, void 0, void 0, function* () {
    if (!fs.existsSync(startPath)) {
        console.error(`Invalid directory: ${startPath}`);
        process.exit(1);
    }
    const files = fs.readdirSync(startPath);
    for (const file of files) {
        const filename = path.join(startPath, file);
        const stat = fs.lstatSync(filename);
        if (stat.isDirectory()) {
            yield chatitoFilesFromDir(filename, cb);
        }
        else if (/\.chatito$/.test(filename)) {
            yield cb(filename);
        }
    }
});
const adapterAccumulator = (format, formatOptions) => {
    const trainingDataset = {};
    const testingDataset = {};
    const adapterHandler = adapters[format];
    if (!adapterHandler) {
        throw new Error(`Invalid adapter: ${format}`);
    }
    return {
        write: (fullFilenamePath) => __awaiter(this, void 0, void 0, function* () {
            console.log(`Processing file: ${fullFilenamePath}`);
            const dsl = fs.readFileSync(fullFilenamePath, 'utf8');
            const { training, testing } = yield adapterHandler.adapter(dsl, formatOptions);
            utils.mergeDeep(trainingDataset, training);
            utils.mergeDeep(testingDataset, testing);
        }),
        save: (outputPath) => {
            if (!fs.existsSync(outputPath)) {
                fs.mkdirSync(outputPath);
            }
            const trainingJsonFileName = argv.trainingFileName || `${format}_dataset_training.json`;
            const trainingJsonFilePath = path.resolve(outputPath, trainingJsonFileName);
            fs.writeFileSync(trainingJsonFilePath, JSON.stringify(trainingDataset));
            console.log(`Saved training dataset: ${trainingJsonFilePath}`);
            if (Object.keys(testingDataset).length) {
                const testingFileName = argv.testingFileName || `${format}_dataset_testing.json`;
                const testingJsonFilePath = path.resolve(outputPath, testingFileName);
                fs.writeFileSync(testingJsonFilePath, JSON.stringify(testingDataset));
                console.log(`Saved testing dataset: ${testingJsonFilePath}`);
            }
        }
    };
};
(() => __awaiter(this, void 0, void 0, function* () {
    if (!argv._ || !argv._.length) {
        console.error('Invalid chatito file.');
        process.exit(1);
    }
    const configFile = argv._[0];
    const format = (argv.format || 'default').toLowerCase();
    if (['default', 'rasa', 'snips'].indexOf(format) === -1) {
        console.error(`Invalid format argument: ${format}`);
        process.exit(1);
    }
    const outputPath = argv.outputPath || process.cwd();
    try {
        let formatOptions = null;
        if (argv.formatOptions) {
            formatOptions = JSON.parse(fs.readFileSync(path.resolve(argv.formatOptions), 'utf8'));
        }
        const dslFilePath = getFileWithPath(configFile);
        const isDirectory = fs.existsSync(dslFilePath) && fs.lstatSync(dslFilePath).isDirectory();
        const accumulator = adapterAccumulator(format, formatOptions);
        if (isDirectory) {
            yield chatitoFilesFromDir(dslFilePath, accumulator.write);
        }
        else {
            yield accumulator.write(dslFilePath);
        }
        accumulator.save(outputPath);
    }
    catch (e) {
        if (e && e.message && e.location) {
            console.log('==== CHATITO SYNTAX ERROR ====');
            console.log('    ', e.message);
            console.log(`     Line: ${e.location.start.line}, Column: ${e.location.start.column}`);
            console.log('==============================');
        }
        else {
            console.error(e && e.stack ? e.stack : e);
        }
        console.log('FULL ERROR REPORT:');
        console.error(e);
        process.exit(1);
    }
}))();
