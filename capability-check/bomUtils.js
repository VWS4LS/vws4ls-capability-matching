const aasUtils = require('./aasUtils');
const aas = require('@aas-core-works/aas-core3.0-typescript');

const findLeaveNodes = (bomSubmodel) => {

    const entryNode = aasUtils.findChildByIdShort(bomSubmodel, "EntryNode");

    return findLeaveNodesRecursively(entryNode);
}

const findLeaveNodesRecursively = (parentNode) => {

    const children = aasUtils.filterChildren(parentNode, child => child instanceof aas.types.Entity);

    if (children.length === 0) {
        return [parentNode];
    } else {

        const leafNodes = [];

        for (const child of children) {
            leafNodes.push(...findLeaveNodesRecursively(child));
        }

        return leafNodes;
    }
}

module.exports = {
    findLeaveNodes: findLeaveNodes
}