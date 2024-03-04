const aas = require('@aas-core-works/aas-core3.0-typescript');

const getElementByIdShortPath = (parent, idShortPath) => {
    if (!parent || !idShortPath) {
        return null;
    }

    const idShortPathSegments = idShortPath.split("/");
    const nextIdShort = idShortPathSegments[0];

    const child = findChildByIdShort(parent, nextIdShort);

    if (!child) {
        return null;
    }

    if (idShortPathSegments.length === 1) {
        return child;
    }

    return getElementByIdShortPath(child, idShortPathSegments.splice(1, idShortPathSegments.length).join("/"));
}

const findChildByIdShort = (parent, idShort) => {
    return findChild(parent, element => element.idShort === idShort);
}

const findChildByType = (parent, type) => {
    return findChild(parent, child => child instanceof type);
}

const filterChildrenByType = (parent, type) => {
    return filterChildren(parent, child => child instanceof type);
}

const findChild = (parent, predicate) => {
    return getChildren(parent).find(predicate);
}

const filterChildren = (parent, predicate) => {
    return getChildren(parent).filter(predicate);
}

const getChildren = (parent) => {
    if (parent instanceof aas.types.Submodel) {
        return parent.submodelElements || [];
    } else if (parent instanceof aas.types.SubmodelElementCollection || parent instanceof aas.types.SubmodelElementList) {
        return parent.value || []
    } else if (parent instanceof aas.types.Entity) {
        return parent.statements || [];
    } else {
        return [];
    }
}

const getSemanticIdAsSingleKey = (element) => {
    if (!element.semanticId) {
        return null;
    }

    return getReferenceAsSingleKey(element.semanticId);
}

const getSupplementarySemanticIdsAsSingleKeys = (element) => {
    if (!element.supplementalSemanticIds) {
        return null;
    }

    return element.supplementalSemanticIds.map(id => getReferenceAsSingleKey(id));
}

const getReferenceAsSingleKey = (reference) => {
    const keys = reference.keys;
    return keys[keys.length - 1].value;
}

const getExtensionValue = (element, extensionSemanticId) => {
    if (!element.extensions) {
        return null;
    }

    const extension = element.extensions.find(extension => getSemanticIdAsSingleKey(extension) === extensionSemanticId);

    if (!extension) {
        return null;
    }

    return extension.value;
}

const hasExtensionValue = (element, extensionSemanticId, extensionValue) => {

    return getExtensionValue(element, extensionSemanticId) === extensionValue;
}

module.exports = {
    getElementByIdShortPath: getElementByIdShortPath,
    findChildByIdShort: findChildByIdShort,
    findChildByType: findChildByType,
    filterChildrenByType: filterChildrenByType,
    findChild: findChild,
    filterChildren: filterChildren,
    getChildren: getChildren,
    getSemanticIdAsSingleKey: getSemanticIdAsSingleKey,
    getSupplementarySemanticIdsAsSingleKeys: getSupplementarySemanticIdsAsSingleKeys,
    getReferenceAsSingleKey: getReferenceAsSingleKey,
    getExtensionValue: getExtensionValue,
    hasExtensionValue: hasExtensionValue
}