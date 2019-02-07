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
const gen = require("../main");
const utils = require("../utils");
function adapter(dsl, formatOptions) {
    return __awaiter(this, void 0, void 0, function* () {
        const training = {};
        const testing = {};
        if (formatOptions) {
            utils.mergeDeep(training, formatOptions);
        }
        const utteranceWriter = (utterance, intentKey, isTrainingExample) => {
            const dataset = isTrainingExample ? training : testing;
            if (!dataset[intentKey]) {
                dataset[intentKey] = [];
            }
            dataset[intentKey].push(utterance);
        };
        yield gen.datasetFromString(dsl, utteranceWriter);
        return { training, testing };
    });
}
exports.adapter = adapter;
