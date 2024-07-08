const aasRestAPI = require('./aasRestAPI');
const capabilityMatching = require('./capabilityMatching');
const aasUtils = require('./aasUtils');
const bomUtils = require('./bomUtils');

const aas = require('@aas-core-works/aas-core3.0-typescript');

const CAPABILTY_NOT_FULFILLED_BY_MACHINE = 'CAPABILTY_NOT_FULFILLED_BY_MACHINE';
const CAPABILTY_FULFILLED_BY_MACHINE = 'CAPABILTY_FULFILLED_BY_MACHINE';
const NO_SUITABLE_TOOL_MOUNTED = 'NO_SUITABLE_TOOL_MOUNTED';
const NO_SUITABLE_TOOL_EXISTS = 'NO_SUITABLE_TOOL_EXISTS';
const NO_MOUNTING_PATH_FOR_SUITABLE_TOOL_FOUND = 'NO_MOUNTING_PATH_FOR_SUITABLE_TOOL_FOUND';
const SUITABLE_TOOL_MOUNTED = 'SUITABLE_TOOL_MOUNTED';
const SUITABLE_TOOL_NEEDS_TO_BE_MOUNTED = 'SUITABLE_TOOL_NEEDS_TO_BE_MOUNTED';
const INTERNAL_ERROR = 'INTERNAL_ERROR';

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
 * @param {boolean} instanceCheck whether the capability check shall take into account only the currently mounted tools (true) or all tools that can theoretically be mounted (false); 
 *  default is 'false'
 * @param {string} username an optional username that will be included when fetching data from the endpoint(s); username/password will be included directly in the fetch urls; it 
 *  is assumed that username and passwords for all endpoints are identical
 * @param {string} password an optional password that will be included when fetching data from the endpoint(s); username/password will be included directly in the fetch urls; it 
 *  is assumed that username and passwords for all endpoints are identical
 * @returns A result object (or an array of result objects in case multiple required capabilities where queried) describing the result(s) of the capability check. 
 */
const executeCapabilityCheck = async (endpoint, requiredCapabiltySubmodelId, requiredCapabilityContainerIdShortPath, machineAasId, instanceCheck = null, username = null, password = null) => {

    aasRestAPI.setUsername(username);
    aasRestAPI.setPassword(password);

    if (typeof (requiredCapabilityContainerIdShortPath) === 'string') {
        return executeSingleCapabilityCheck(endpoint, requiredCapabiltySubmodelId, requiredCapabilityContainerIdShortPath, machineAasId, instanceCheck);
    } else {
        return Promise.all(requiredCapabilityContainerIdShortPath.map(path => {
            return executeSingleCapabilityCheck(endpoint, requiredCapabiltySubmodelId, path, machineAasId, instanceCheck);
        }));
    }
}

const executeSingleCapabilityCheck = async (endpoint, requiredCapabiltySubmodelId, requiredCapabilityContainerIdShortPath, machineAasId, instanceCheck) => {

    const resultObject = {
        endpoint: endpoint,
        requiredCapabiltySubmodelId: requiredCapabiltySubmodelId,
        requiredCapabilityContainerIdShortPath: requiredCapabilityContainerIdShortPath,
        machineAasId: machineAasId
    };

    if (typeof (endpoint) === 'string') {
        var getShells = (predicate) => aasRestAPI.serverBasedApi.getShellsViaServer.apply(null, [endpoint, predicate]);
        var getShell = (aasId) => aasRestAPI.serverBasedApi.getShellViaServer.apply(null, [endpoint, aasId]);
        var getSubmodel = (submodelId) => aasRestAPI.serverBasedApi.getSubmodelViaServer.apply(null, [endpoint, submodelId]);
        var getFirstSubmodel = (aasId, predicate) => aasRestAPI.serverBasedApi.getFirstSubmodelFromServer.apply(null, [endpoint, aasId, predicate]);
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
        let isInstance = machineAas.assetInformation.assetKind === aas.types.AssetKind.Instance;
        let onlyRegardMountedTools = typeof (instanceCheck) === 'boolean' ? instanceCheck : false;

        resultObject.assetKind = machineAas.assetInformation.assetKind === aas.types.AssetKind.Instance ? 'instance' : 'type';
        resultObject.onlyRegardMountedTools = onlyRegardMountedTools;

        const offeredCapabilitySubmodel = await getFirstSubmodel(machineAasId, (submodel) => submodel.idShort === "OfferedCapabilities");
        const offeredCapabilityContainer = capabilityMatching.findCapabilityContainer(offeredCapabilitySubmodel, requiredCapabilityValue);

        // Step 1: Check if the machine provides the capability and fulfills all constraints
        if (!capabilityMatching.checkAasOffersCapabilityAndFulfilsConstraints(offeredCapabilitySubmodel, requiredCapabilityContainer)) {
            resultObject.success = false;
            resultObject.resultCode = CAPABILTY_NOT_FULFILLED_BY_MACHINE;
            resultObject.reason = "Failed Capability Check";
            resultObject.message = `AAS with id "${machineAasId}" does not offer the required capability "${requiredCapabilityValue}" or does not fulfill all constraints"!`;
            return resultObject;
        }

        // Step 2: Check if the machine requires a tool to provide the capability
        const requiredToolCondition = capabilityMatching.getRequiredToolCondition(offeredCapabilityContainer);

        resultObject.requiredToolType = requiredToolCondition;

        if (!requiredToolCondition) {
            resultObject.success = true;
            resultObject.resultCode = CAPABILTY_FULFILLED_BY_MACHINE;
            resultObject.message = `AAS with id "${machineAasId}" offers the required capability "${requiredCapabilityValue}" and fulfills all constraints"!`;
            resultObject.toolRequired = false;
            return resultObject;
        }

        resultObject.toolRequired = true;

        // Step 3a: If the machine requires a tool, find all AASes representing such a tool
        const aASes = (await getShells()).filter(aas => aas.assetInformation.assetKind === machineAas.assetInformation.assetKind);
        const toolAASes = aASes.filter((shell) => aasUtils.hasExtensionValue(shell, "http://arena2036.de/toolType/1/0", requiredToolCondition));

        // Step 3b: Depending on if we look at a type or at an instance, select either all tools or only the currently mounted ones
        const bomSubmodel = await getFirstSubmodel(machineAasId, (submodel) => submodel.idShort === "HierarchicalStructures");

        const mountedToolAssetIds = bomSubmodel ? bomUtils.findLeaveNodes(bomSubmodel).map(node => node.globalAssetId) : [];
        const mountedTools = mountedToolAssetIds.map(toolAssetId => toolAASes.find(aas => aas.assetInformation.globalAssetId === toolAssetId));

        resultObject.mountedTools = mountedTools.map(toolAas => toolAas.id);

        let toolAASesToBeConsidered = [];
        if (onlyRegardMountedTools) {
            toolAASesToBeConsidered = [...toolAASes.filter(toolAAS => mountedToolAssetIds.includes(toolAAS.assetInformation.globalAssetId))]
        } else {
            if (isInstance) {
                toolAASesToBeConsidered = toolAASes.filter(toolAAS => toolAAS.assetInformation.assetKind === aas.types.AssetKind.Instance);

            } else {
                toolAASesToBeConsidered = toolAASes.filter(toolAAS => toolAAS.assetInformation.assetKind === aas.types.AssetKind.Type);
            }
        }

        if (onlyRegardMountedTools && toolAASesToBeConsidered.length === 0) {
            resultObject.success = false;
            resultObject.resultCode = NO_SUITABLE_TOOL_MOUNTED;
            resultObject.reason = "Failed Capability Check";
            resultObject.message = `AAS with id "${machineAasId}" offers the required capability but needs a tool to fulfill it. However, no BOM submodel was found to derive mounted tools!`;
            return resultObject;
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

        resultObject.suitableMountedTools = aASesOfSuitableTools.filter(tool => resultObject.mountedTools.includes(tool.id)).map(tool => tool.id);

        if (aASesOfSuitableTools.length === 0) {
            resultObject.success = false;
            resultObject.resultCode = NO_SUITABLE_TOOL_EXISTS;
            resultObject.reason = "Failed Capability Check";
            resultObject.message = `No required tool of type "${requiredToolCondition}" found that fulfills all constraints"!`;
            return resultObject;
        }

        resultObject.suitableTools = aASesOfSuitableTools.map(aas => aas.id);

        // Step 4: Find the suitable tools that can be mounted in the machine
        const mountingPathsByTool = {};

        for (var toolAAS of aASesOfSuitableTools) {
            const mountingPaths = capabilityMatching.determineMountingPaths(toolAAS, aASes);

            const mountingPathsLeadingToMachine = mountingPaths.filter(path => path[path.length - 1] === machineAasId);

            mountingPathsByTool[toolAAS.id] = mountingPathsLeadingToMachine;
        }

        if (Object.values(mountingPathsByTool).flatMap(array => array).filter(path => path.length > 1).length === 0) {
            resultObject.success = false;
            resultObject.resultCode = NO_MOUNTING_PATH_FOR_SUITABLE_TOOL_FOUND;
            resultObject.reason = "Failed Capability Check";
            resultObject.message = `No option to mount a required tool of type "${requiredToolCondition}" into the machine represented by the AAS with id "${machineAasId}" found"!`;
            return resultObject;
        }

        if (mountedTools.filter(tool => aASesOfSuitableTools.includes(tool)).length > 0) {
            resultObject.success = true;
            resultObject.resultCode = SUITABLE_TOOL_MOUNTED;
            resultObject.message = `AAS with id "${machineAasId}" offers the required capability "${requiredCapabilityValue}" and fulfills all constraints"! A suitable tool is already mounted.`;
            resultObject.mountingPathsByTool = mountingPathsByTool;
            return resultObject;
        } else {
            resultObject.success = true;
            resultObject.resultCode = SUITABLE_TOOL_NEEDS_TO_BE_MOUNTED;
            resultObject.message = `AAS with id "${machineAasId}" offers the required capability "${requiredCapabilityValue}" and fulfills all constraints"! However, a suitable tool needs to be mounted.`;
            resultObject.mountingPathsByTool = mountingPathsByTool;
            return resultObject;
        }


    } catch (error) {

        resultObject.success = false;
        resultObject.resultCode = INTERNAL_ERROR;
        resultObject.reason = "Internal Error";
        resultObject.message = error.message;
        resultObject.error = error;

        return resultObject;
    }

}

module.exports = {
    executeCapabilityCheck: executeCapabilityCheck
};

/*
executeCapabilityCheck(
    {
        "aasRegistryEndpoint": "https://tractus-x-07.arena2036.de:8082",
        "submodelRegistryEndpoint": "https://tractus-x-07.arena2036.de:8083"
    },
    "https://www.arena2036.de/sm/7084_8002_2042_5688",
    "CapabilitySet/CapabilityContainer01",
    "http://smart.komaxgroup.com/aas/03bb64b3-2563-4f22-a475-b3732bad1e16",
    null,
    "arena2036",
    "<password>"
).then(result => console.log(result));
*/
