const aasUtils = require('./aasUtils');
const aas = require('@aas-core-works/aas-core3.0-typescript');

const checkAasOffersCapabilityAndFulfilsConstraints = (offeredCapabilitySubmodel, requiredCapabilityContainer) => {
    
    const requiredCapabilityValue = getCapabilitySemanticId(requiredCapabilityContainer);

    // Step 1: Check if the aas offers the required capability
    const offeredCapabilityContainer = findCapabilityContainer(offeredCapabilitySubmodel, requiredCapabilityValue);

    if (!offeredCapabilityContainer) {
        return false;
    }

    // Step 2: Check if all property constraints are fulfilled
    if (!checkPropertyConstraintsAreFulfilled(requiredCapabilityContainer, offeredCapabilityContainer)) {
        return false;
    }

    return true;
}

const isOfferedCapabilitiesSubmodel = (submodel) => {
    return submodel.idShort === "OfferedCapabilities";
}

const getOfferedCapabilitiesSubmodel = (submodels) => {
    return submodels.find(submodel => isOfferedCapabilitiesSubmodel(submodel));
}

const getCapabilitySemanticId = (capabilityContainer) => {
    const capability = aasUtils.findChildByType(capabilityContainer, aas.types.Capability);
    return aasUtils.getSemanticIdAsSingleKey(capability);
}

const hasCapabilitySemanticId = (capabilityContainer, semanticId) => {
    return getCapabilitySemanticId(capabilityContainer) === semanticId;
}

const findCapabilityContainer = (capabilitySubmodel, semanticId) => {
    const capabilitySet = aasUtils.findChildByIdShort(capabilitySubmodel, "CapabilitySet");
    return aasUtils.findChild(capabilitySet, (child) => hasCapabilitySemanticId(child, semanticId));
}

const checkPropertyConstraintsAreFulfilled = (requiredCapabilityContainer, offeredCapabilityContainer) => {
    
    const requiredCapabilityProperties = aasUtils.findChildByIdShort(requiredCapabilityContainer, "PropertySet");

    if (!requiredCapabilityProperties) {
        return true;
    }

    const offeredCapabilityRelationships = aasUtils.findChildByIdShort(offeredCapabilityContainer, "CapabilityRelationships");

    if (!offeredCapabilityRelationships) {
        return true;
    }

    const offeredCapabilityConstraints = aasUtils.filterChildren(offeredCapabilityRelationships, (child) => child.idShort.startsWith("ConstraintContainer"));

    if (offeredCapabilityConstraints.length == 0) {
        return true;
    }

    return aasUtils.getChildren(requiredCapabilityProperties).every(propertyContainer =>
        checkPropertyConstraintIsFulfilled(propertyContainer, offeredCapabilityConstraints));
}

const checkPropertyConstraintIsFulfilled = (propertyContainer, offeredCapabilityConstraints) => {
    const property = aasUtils.findChildByType(propertyContainer, aas.types.Property);
    const propertyName = property.idShort;
    const propertyValue = property.value;

    const propertyConstraint = findConstraintForProperty(propertyName, offeredCapabilityConstraints);

    if (!propertyConstraint) {
        return true;
    }

    return checkConstraint(propertyConstraint, propertyValue);
}

// this is kind of hacky as we only check for a constraint for the given property name but we do 
// not check if the constraint actually references the property
const findConstraintForProperty = (propertyName, offeredCapabilityConstraints) => {

    const constraintContainer = offeredCapabilityConstraints.find(constraintContainer => {
        const constraintRelationship = aasUtils.findChildByType(constraintContainer, aas.types.RelationshipElement);
        
        if (!constraintRelationship) {
            return false;
        }

        return aasUtils.getReferenceAsSingleKey(constraintRelationship.first) === propertyName;
    });

    if (!constraintContainer) {
        return null;
    }

    return aasUtils.findChildByIdShort(constraintContainer, "Constraint");
}

const checkConstraint = (constraint, value) => {
    if (constraint instanceof aas.types.Range) {
        
        const valueAsFloat = parseFloat(value);
        return parseFloat(constraint.min) <= valueAsFloat && parseFloat(constraint.max) >= valueAsFloat;

    } else if (constraint instanceof aas.types.SubmodelElementList) {

        const constraintValues = aasUtils.filterChildrenByType(constraint, aas.types.Property).map(property => property.value);
        return constraintValues.includes(value);

    } else {

        console.error(`Unsupported type of constraint encountered: ${constraint}`);
        return true;
    }
}

const getRequiredToolCondition = (offeredCapabilityContainer) => {

    const offeredCapabilityRelationships = aasUtils.findChildByIdShort(offeredCapabilityContainer, "CapabilityRelationships");

    if (!offeredCapabilityRelationships) {
        return null;
    }

    const offeredCapabilityConditionContainers = aasUtils.filterChildren(offeredCapabilityRelationships, (child) => child.idShort.startsWith("ConditionContainer"));

    if (offeredCapabilityConditionContainers.length == 0) {
        return null;
    }

    const requiresToolCondition = offeredCapabilityConditionContainers
        .map(conditionContainer => aasUtils.getElementByIdShortPath(conditionContainer, "RequiresToolCondition"))
        .find(condition => condition != null);

    if (!requiresToolCondition) {
        return null;
    }

    return requiresToolCondition.value;
}

const determineMountingPaths = (ressourceAas, aASes) => {
    var mountingPaths = [];

    var requiredSlotExtension = aasUtils.getExtensionValue(ressourceAas, "http://arena2036.de/requiredSlot/1/0");

    if (!requiredSlotExtension) {
        // aas/ressource does not need to be mounted anywhere
        mountingPaths.push([ressourceAas.id]);
        return mountingPaths;
    }

    for (var aas of aASes.filter(aas => aas.id !== ressourceAas.id)) {
        var offeredSlotExtension = aasUtils.getExtensionValue(aas, "http://arena2036.de/offeredSlot/1/0");

        if (!offeredSlotExtension || offeredSlotExtension !== requiredSlotExtension) {
            // aas/ressource does not provide a suitable slot
            continue;
        }

        for (var subPath of determineMountingPaths(aas, aASes)) {

            mountingPaths.push([ressourceAas.id, requiredSlotExtension, ...subPath]);
        }
    }

    return mountingPaths;
}

module.exports = {
    checkAasOffersCapabilityAndFulfilsConstraints: checkAasOffersCapabilityAndFulfilsConstraints,
    isOfferedCapabilitiesSubmodel: isOfferedCapabilitiesSubmodel,
    getOfferedCapabilitiesSubmodel: getOfferedCapabilitiesSubmodel,
    getCapabilitySemanticId: getCapabilitySemanticId,
    findCapabilityContainer: findCapabilityContainer,
    checkPropertyConstraintsAreFulfilled: checkPropertyConstraintsAreFulfilled,
    getRequiredToolCondition: getRequiredToolCondition,
    determineMountingPaths: determineMountingPaths
}