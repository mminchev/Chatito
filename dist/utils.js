"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shuffle = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
};
exports.validateAndPushToStack = (entity, entitiesStack) => {
    let numberOfSlotsInStack = 0;
    const found = entitiesStack.find((et) => {
        if (et.type === 'SlotDefinition') {
            numberOfSlotsInStack++;
        }
        return et.key === entity.key && et.type === entity.type;
    });
    if (found) {
        const last = entitiesStack.pop() || found;
        throw new Error(`Invalid nesting of entity: '${entity.key}' inside entity '${last.key}'. Infinite loop prevented.`);
    }
    if (numberOfSlotsInStack !== 0 && entity.type === 'SlotDefinition') {
        const last = entitiesStack.pop() || entity;
        throw new Error(`Invalid nesting of slot: '${entity.key}' inside '${last.key}'. An slot can't reference other slot.`);
    }
    entitiesStack.push(entity);
    return entitiesStack;
};
exports.maxSentencesForSentence = (entities, stack) => (sentence) => {
    const sr = sentence.reduce((accumulator, t) => {
        let acc = accumulator;
        if (t.type === 'Slot' || t.type === 'Alias') {
            const def = entities[t.type];
            const innerEntityKey = t.variation ? `${t.value}#${t.variation}` : t.value;
            if (!def[innerEntityKey]) {
                if (t.type === 'Alias') {
                    def[innerEntityKey] = {
                        inner: [[{ value: innerEntityKey, type: 'Text' }]],
                        key: t.value,
                        type: 'AliasDefinition'
                    };
                }
                else {
                    throw new Error(`${t.type} not defined: ${innerEntityKey}`);
                }
            }
            const s = stack ? stack.slice(0) : [];
            let innerEntityVariations = exports.maxSentencesForEntity(def[innerEntityKey], entities, s);
            if (t.opt) {
                innerEntityVariations++;
            }
            acc = acc * innerEntityVariations;
        }
        return acc;
    }, 1);
    return sr;
};
exports.maxSentencesForEntity = (ed, entities, stack = []) => {
    exports.validateAndPushToStack(ed, stack);
    return ed.inner.map(exports.maxSentencesForSentence(entities, stack)).reduce((acc, val) => acc + val);
};
const isObject = (item) => item && typeof item === 'object' && !Array.isArray(item) && item !== null;
const isArray = (item) => {
    if (typeof Array.isArray === 'undefined') {
        return Object.prototype.toString.call(item) === '[object Array]';
    }
    else {
        return Array.isArray(item);
    }
};
exports.mergeDeep = (target, source) => {
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            if (isArray(source[key])) {
                if (target[key] === undefined) {
                    target[key] = [];
                }
                target[key] = target[key].concat(source[key]);
            }
            else if (isObject(source[key])) {
                if (!target[key]) {
                    Object.assign(target, { [key]: {} });
                }
                exports.mergeDeep(target[key], source[key]);
            }
            else {
                Object.assign(target, { [key]: source[key] });
            }
        });
    }
    return target;
};
