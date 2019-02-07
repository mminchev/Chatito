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
const utils = require("./utils");
const chatito = require('../parser/chatito');
const chatitoFormatPostProcess = (data) => {
    const arr = data.reduce((accumulator, next, i, arrShadow) => {
        if (accumulator.length) {
            const lastWord = accumulator[accumulator.length - 1];
            if (lastWord.type === next.type && lastWord.type === 'Text') {
                accumulator[accumulator.length - 1] = {
                    type: lastWord.type,
                    value: (lastWord.value + next.value).replace(/\s+/g, ' ')
                };
            }
            else {
                accumulator.push(next);
            }
        }
        else if (next.value.trim()) {
            accumulator.push(next);
        }
        if (i === arrShadow.length - 1) {
            if (!accumulator[accumulator.length - 1].value.trim()) {
                accumulator.pop();
            }
            if (accumulator.length) {
                accumulator[accumulator.length - 1] = Object.assign({}, accumulator[accumulator.length - 1], {
                    value: accumulator[accumulator.length - 1].value.replace(/\s+$/g, '')
                });
            }
        }
        return accumulator;
    }, []);
    if (arr.length) {
        arr[0] = Object.assign({}, arr[0], {
            value: arr[0].value.replace(/^\s+/, '')
        });
    }
    return arr;
};
const getVariationsFromEntity = (ed, entities, optional, cache) => __awaiter(this, void 0, void 0, function* () {
    const variationKey = ed.variation ? `#${ed.variation}` : '';
    const cacheKey = `${ed.type}-${ed.key}${variationKey}`;
    let cacheStats = cache.get(cacheKey);
    if (!cacheStats) {
        const counts = [];
        const totalCounts = [];
        const maxCounts = [];
        for (const c of ed.inner) {
            counts.push(new Map());
            totalCounts.push(0);
            let mxc = utils.maxSentencesForSentence(entities)(c);
            if (optional) {
                mxc++;
            }
            maxCounts.push(mxc);
        }
        const currentEntityCache = {
            counts,
            maxCounts,
            optional,
            optionalCounts: 0,
            totalCounts
        };
        cache.set(cacheKey, currentEntityCache);
        cacheStats = cache.get(cacheKey);
    }
    let max = utils.maxSentencesForEntity(ed, entities);
    if (optional) {
        max++;
    }
    const totalAccumulated = cacheStats.totalCounts.reduce((p, n) => p + n) + cacheStats.optionalCounts;
    if (totalAccumulated === max) {
        cacheStats.totalCounts = new Array(cacheStats.totalCounts.length).fill(0);
        cacheStats.optionalCounts = 0;
    }
    const allCounts = cacheStats.maxCounts.map((c, i) => {
        return cacheStats.totalCounts[i] / cacheStats.maxCounts[i];
    });
    let min = Math.min.apply(Math, allCounts);
    if (cacheStats.optional && cacheStats.optionalCounts / max < min / max) {
        min = min / max;
    }
    const counterIndexes = [];
    allCounts.forEach((c, i) => {
        if (c <= min || !c) {
            counterIndexes.push(i);
        }
    });
    if (cacheStats.optional && cacheStats.optionalCounts <= min / max) {
        counterIndexes.push(-1);
    }
    utils.shuffle(counterIndexes);
    const sentenceIndex = counterIndexes[0];
    if (sentenceIndex === -1) {
        cacheStats.optionalCounts++;
        return [];
    }
    cacheStats.totalCounts[sentenceIndex]++;
    const sentence = ed.inner[sentenceIndex];
    let accumulator = [];
    const slotSynonyms = ed.type === 'SlotDefinition' && sentence.length === 1 && sentence[0].type === 'Alias';
    for (const t of sentence) {
        const slotsInSentenceKeys = new Set([]);
        if (t.type === 'Slot' || t.type === 'Alias') {
            const def = entities[t.type];
            const innerEntityKey = t.variation ? `${t.value}#${t.variation}` : t.value;
            const currentCache = slotsInSentenceKeys.has(innerEntityKey) ? cacheStats.counts[sentenceIndex] : new Map();
            slotsInSentenceKeys.add(innerEntityKey);
            const sentenceVariation = yield getVariationsFromEntity(def[innerEntityKey], entities, !!t.opt, currentCache);
            if (sentenceVariation.length) {
                const returnSentenceTokens = chatitoFormatPostProcess(sentenceVariation);
                for (const returnToken of returnSentenceTokens) {
                    if (slotSynonyms) {
                        returnToken.synonym = t.value;
                    }
                    if (t.type === 'Slot') {
                        if (def[innerEntityKey].args) {
                            returnToken.args = def[innerEntityKey].args;
                        }
                        returnToken.value = returnToken.value.trim();
                        returnToken.type = t.type;
                        returnToken.slot = t.value;
                    }
                    accumulator = accumulator.concat(returnToken);
                }
            }
        }
        else {
            accumulator = accumulator.concat(t);
        }
    }
    return accumulator;
});
exports.astFromString = (str) => chatito.parse(str);
exports.datasetFromString = (str, writterFn) => {
    const ast = exports.astFromString(str);
    return exports.datasetFromAST(ast, writterFn);
};
exports.datasetFromAST = (ast, writterFn) => __awaiter(this, void 0, void 0, function* () {
    const operatorDefinitions = { Intent: {}, Slot: {}, Alias: {} };
    if (!ast || !ast.length) {
        return;
    }
    ast.forEach(od => {
        let entity;
        if (od.type === 'IntentDefinition') {
            entity = operatorDefinitions.Intent;
        }
        else if (od.type === 'SlotDefinition') {
            entity = operatorDefinitions.Slot;
        }
        else if (od.type === 'AliasDefinition') {
            entity = operatorDefinitions.Alias;
        }
        else if (od.type === 'Comment') {
            return;
        }
        else {
            throw new Error(`Unknown definition definition for ${od.type}`);
        }
        const odKey = od.variation ? `${od.key}#${od.variation}` : od.key;
        if (entity[odKey]) {
            throw new Error(`Duplicate definition for ${od.type} '${odKey}'`);
        }
        entity[odKey] = od;
    });
    const intentKeys = Object.keys(operatorDefinitions.Intent);
    if (!intentKeys || !intentKeys.length) {
        throw new Error('No actions found');
    }
    for (const intentKey of intentKeys) {
        const maxPossibleCombinations = utils.maxSentencesForEntity(operatorDefinitions.Intent[intentKey], operatorDefinitions);
        let maxIntentExamples = maxPossibleCombinations;
        const entityArgs = operatorDefinitions.Intent[intentKey].args;
        let trainingN = maxIntentExamples;
        let testingN = 0;
        let generatedTrainingExamplesCount = 0;
        if (entityArgs) {
            if (entityArgs.training) {
                trainingN = parseInt(entityArgs.training, 10);
                if (trainingN < 1) {
                    throw new Error(`The 'training' argument for ${intentKey} must be higher than 0.`);
                }
                if (entityArgs.testing) {
                    testingN = parseInt(entityArgs.testing, 10);
                    if (testingN < 1) {
                        throw new Error(`The 'testing' argument for ${intentKey} must be higher than 0.`);
                    }
                }
            }
            const intentMax = trainingN + testingN;
            if (intentMax > maxIntentExamples) {
                throw new Error(`Can't generate ${intentMax} examples. Max possible examples is ${maxIntentExamples}`);
            }
            else if (intentMax < maxIntentExamples) {
                maxIntentExamples = intentMax;
            }
        }
        const maxEx = maxIntentExamples;
        const globalCache = new Map();
        const collitionsCache = {};
        let duplicatesCounter = 0;
        while (maxIntentExamples) {
            const intentSentence = yield getVariationsFromEntity(operatorDefinitions.Intent[intentKey], operatorDefinitions, false, globalCache);
            const utterance = chatitoFormatPostProcess(intentSentence);
            const utteranceString = utterance.reduce((p, n) => p + n.value, '');
            if (!collitionsCache[utteranceString]) {
                collitionsCache[utteranceString] = true;
                writterFn(utterance, intentKey, generatedTrainingExamplesCount < trainingN);
                maxIntentExamples--;
                generatedTrainingExamplesCount++;
            }
            else {
                duplicatesCounter++;
                const maxDupes = maxPossibleCombinations * maxPossibleCombinations;
                const maxDupesLimit = Math.floor(maxPossibleCombinations / 2);
                if (duplicatesCounter > (maxPossibleCombinations > 10000 ? maxDupesLimit : maxDupes)) {
                    let m = `Too many duplicates while generating dataset! Looks like we have probably reached `;
                    m += `the maximun ammount of possible unique generated examples. `;
                    m += `The generator has stopped at ${maxEx - maxIntentExamples} examples for intent ${intentKey}.`;
                    console.warn(m);
                    maxIntentExamples = 0;
                }
            }
        }
    }
});
