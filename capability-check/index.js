const aasRestAPI = require('./aasRestAPI');
const capabilityMatching = require('./capabilityMatching');
const aasUtils = require('./aasUtils');
const bomUtils = require('./bomUtils');

const aas = require('@aas-core-works/aas-core3.0-typescript');

/**
 * Executes a capabilty check, i.e. checks if the ressource/machine specified by {@link machineAasId} can offer the capability/ies specified by the
 * combination of {@link requiredCapabiltySubmodelId} and {@link requiredCapabilityContainerIdShortPath}.
 * 
 * @param {string | object} endpoint either a string representing the endpoint of an AAS server providing access to all relevant AASes and submodels or an object with two
 *  members 'aasRegistryEndpoint' and 'submodelRegistryEndpoint' describing the registry endpoints used to find the servers hosting the relevant AASes and submodels
 * @param {string} requiredCapabiltySubmodelId id of the AAS submodel defining the required capability (this is expected to be available at the AAS server, see above)
 * @param {string | string[]} requiredCapabilityContainerIdShortPath idShort path/s pointing to the required capability/ies to check; this is expected
 *  to be within the required capability submodel identified via {@link requiredCapabiltySubmodelId}
 * @param {string} machineAasId the id of the AAS representing the machine to check for the required capability
 *  (this is expected to be available at the AAS server, see above)
 * @returns A result object (or an array of result objects in case multiple required capabilities where queried) describing the result(s) of the capability check. 
 */
const executeCapabilityCheck = async (endpoint, requiredCapabiltySubmodelId, requiredCapabilityContainerIdShortPath, machineAasId) => {
    
    if (typeof (requiredCapabilityContainerIdShortPath) === 'string') {
        return executeSingleCapabilityCheck(endpoint, requiredCapabiltySubmodelId, requiredCapabilityContainerIdShortPath, machineAasId);
    } else {
        return Promise.all(requiredCapabilityContainerIdShortPath.map(path => {
            return executeSingleCapabilityCheck(endpoint, requiredCapabiltySubmodelId, path, machineAasId);
        }));
    }
}

const executeSingleCapabilityCheck = async (endpoint, requiredCapabiltySubmodelId, requiredCapabilityContainerIdShortPath, machineAasId) => {

    const resultObject = {
        endpoint: endpoint,
        requiredCapabiltySubmodelId: requiredCapabiltySubmodelId,
        requiredCapabilityContainerIdShortPath: requiredCapabilityContainerIdShortPath,
        machineAasId: machineAasId
    };

    if (typeof (endpoint) === 'string') {
        var getShells = (predicate) => aasRestAPI.serverBasedApi.getShells.apply(null, [endpoint, predicate]);
        var getShell = (aasId) => aasRestAPI.serverBasedApi.getShell.apply(null, [endpoint, aasId]);
        var getSubmodel = (submodelId) => aasRestAPI.serverBasedApi.getSubmodel.apply(null, [endpoint, submodelId]);
        var getFirstSubmodel = (aasId, predicate) => aasRestAPI.serverBasedApi.getFirstSubmodel.apply(null, [endpoint, aasId, predicate]);
    } else {
        var aasRegistryEndpoint = endpoint.aasRegistryEndpoint;
        var submodelRegistryEndpoint = endpoint.submodelRegistryEndpoint;

        var getShells = (predicate) => aasRestAPI.registryBasedApi.getShellsViaRegistry.apply(null, [aasRegistryEndpoint, predicate]);
        var getShell = (aasId) => aasRestAPI.registryBasedApi.getShellViaRegistry.apply(null, [aasRegistryEndpoint, aasId]);
        var getSubmodel = (submodelId) => aasRestAPI.registryBasedApi.getSubmodelViaRegistry.apply(null, [submodelRegistryEndpoint, submodelId]);
        var getFirstSubmodel = (aasId, predicate) => aasRestAPI.registryBasedApi.getFirstSubmodelViaRegistry.apply(null, [aasRegistryEndpoint, submodelRegistryEndpoint, aasId, predicate]);
    }

    try {
        const requiredCapabiltySubmodel = await getSubmodel(requiredCapabiltySubmodelId);
        const requiredCapabilityContainer = aasUtils.getElementByIdShortPath(requiredCapabiltySubmodel, requiredCapabilityContainerIdShortPath);
        const requiredCapabilityValue = capabilityMatching.getCapabilitySemanticId(requiredCapabilityContainer);

        const machineAas = await getShell(machineAasId);
        const isInstance = machineAas.assetInformation.assetKind === aas.types.AssetKind.Instance;

        resultObject.typeOfCheck = isInstance ? "Instance" : "Type";

        const offeredCapabilitySubmodel = await getFirstSubmodel(machineAasId, (submodel) => submodel.idShort === "OfferedCapabilities");
        const offeredCapabilityContainer = capabilityMatching.findCapabilityContainer(offeredCapabilitySubmodel, requiredCapabilityValue);

        // Step 1: Check if the machine provides the capability and fulfills all constraints
        if (!capabilityMatching.checkAasOffersCapabilityAndFulfilsConstraints(offeredCapabilitySubmodel, requiredCapabilityContainer)) {
            resultObject.success = false;
            resultObject.reason = "Failed Capability Check";
            resultObject.message = `AAS with id "${machineAasId}" does not offer the required capability "${requiredCapabilityValue}" or does not fulfill all constraints"!`;
            return resultObject;
        }

        // Step 2: Check if the machine requires a tool to provide the capability
        const requiredToolCondition = capabilityMatching.getRequiredToolCondition(offeredCapabilityContainer);

        if (!requiredToolCondition) {
            resultObject.success = true;
            resultObject.message = `AAS with id "${machineAasId}" offers the required capability "${requiredCapabilityValue}" and fulfills all constraints"!`;
            return resultObject;
        }

        // Step 3a: If the machine requires a tool, find all AASes representing such a tool
        const aASes = await getShells();
        const toolAASes = aASes.filter((shell) => aasUtils.hasExtensionValue(shell, "http://arena2036.de/toolType/1/0", requiredToolCondition));

        // Step 3b: Depending on if we look at a type or at an instance, select either all tools or only the currently mounted ones
        let toolAASesToBeConsidered = [];

        if (isInstance) {
            const bomSubmodel = await getFirstSubmodel(machineAasId, (submodel) => submodel.idShort === "HierarchicalStructures");

            if (!bomSubmodel) {
                resultObject.success = false;
                resultObject.reason = "Failed Capability Check";
                resultObject.message = `AAS with id "${machineAasId}" offers the required capability but needs a tool to fulfill it. However, no BOM submodel was found to derive mounted tools!`;
                return resultObject;
            }
            var leafNodeGlobalAssetIds = bomUtils.findLeaveNodes(bomSubmodel).map(node => node.globalAssetId);

            toolAASesToBeConsidered = [...toolAASes.filter(toolAAS => leafNodeGlobalAssetIds.includes(toolAAS.assetInformation.globalAssetId))]

        } else {
            toolAASesToBeConsidered = toolAASes.filter(toolAAS => toolAAS.assetInformation.assetKind === aas.types.AssetKind.Type);
        }

        // Step 3c: Check if the selected tools provide the capability and fulfill all constraints
        var aASesOfSuitableTools = []
        for (var shell of toolAASesToBeConsidered) {
            const toolOfferedCapabilitySubmodel = await getFirstSubmodel(shell.id, capabilityMatching.isOfferedCapabilitiesSubmodel);

            if (!toolOfferedCapabilitySubmodel) {
                continue;
            }

            if (capabilityMatching.checkAasOffersCapabilityAndFulfilsConstraints(toolOfferedCapabilitySubmodel, requiredCapabilityContainer)) {
                aASesOfSuitableTools.push(shell);
            }
        }

        if (aASesOfSuitableTools.length === 0) {
            resultObject.success = false;
            resultObject.reason = "Failed Capability Check";
            resultObject.message = `No required tool of type "${requiredToolCondition}" found that fulfills all constraints"!`;
            return resultObject;
        }

        resultObject.suitableTools = aASesOfSuitableTools.map(aas => aas.id);

        // Step 4: Find the tools that can be mounted in the machine (if we are in instance mode)
        const mountingPathsByTool = {};
        if (!isInstance) {
            for (var toolAAS of aASesOfSuitableTools) {
                const mountingPaths = capabilityMatching.determineMountingPaths(toolAAS, aASes);

                const mountingPathsLeadingToMachine = mountingPaths.filter(path => path[path.length - 1] === machineAasId);

                mountingPathsByTool[toolAAS.id] = mountingPathsLeadingToMachine;
            }

            if (Object.keys(mountingPathsByTool).length === 0) {
                resultObject.success = false;
                resultObject.reason = "Failed Capability Check";
                resultObject.message = `No option to mount a required tool of type "${requiredToolCondition}" into the machine represented by the AAS with id "${machineAasId}" found"!`;
                return resultObject;
            }

            resultObject.success = true;
            resultObject.message = `AAS with id "${machineAasId}" offers the required capability "${requiredCapabilityValue}" and fulfills all constraints"! However, a suitable tool needs to be mounted.`;
            resultObject.mountingPathsByTool = mountingPathsByTool;
            return resultObject;

        } else {

            resultObject.success = true;
            resultObject.message = `AAS with id "${machineAasId}" offers the required capability "${requiredCapabilityValue}" and fulfills all constraints"! However, a suitable tool needs to be mounted.`;
            resultObject.mountingPathsByTool = mountingPathsByTool;
            return resultObject;
        }

    } catch (error) {

        resultObject.success = false;
        resultObject.reason = "Internal Error";
        resultObject.message = error.message;
        resultObject.error = error;

        return resultObject;
    }

}

module.exports = {
    executeCapabilityCheck: executeCapabilityCheck
};

//executeCapabilityCheck("http://localhost:5001", "www.tier1.com/ids/sm/2135_1132_8032_2655", "CapabilitySet/CapabilityContainer01", "www.komaxgroup.com/ids/aas/4420_0010_1010_9339");
