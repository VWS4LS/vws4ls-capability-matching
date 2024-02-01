const fetch = require('node-fetch');
const aas = require('@aas-core-works/aas-core3.0-typescript');

const getShells = async (aasServerEndpoint, predicate = () => true) => {

    const getShellsUrl = aasServerEndpoint + "/shells";

    return fetch(getShellsUrl).then(response => response.json())
        .then(data => data.result)
        .then(shells => shells.map(json => aas.jsonization.assetAdministrationShellFromJsonable(json).value))
        .then(shells => shells.filter(predicate));
};

const getShell = async (aasServerEndpoint, aasId) => {

    const getShellUrl = aasServerEndpoint + "/shells/" + encodeBase64Url(aasId);

    return getShellViaUrl(getShellUrl);
}

const getShellViaUrl = async (getShellUrl) => {

    return fetch(getShellUrl).then(response => response.json())
        .then(json => aas.jsonization.assetAdministrationShellFromJsonable(json).value);
}

const getShellDescriptor = async (aasRegistryEndpoint, aasId) => {

    const getShellDescriptorUrl = aasRegistryEndpoint + "/shell-descriptors/" + encodeBase64Url(aasId);

    return fetch(getShellDescriptorUrl).then(response => response.json());
}

const getShellViaRegistry = async (aasRegistryEndpoint, aasId) => {

    return getShellDescriptor(aasRegistryEndpoint, aasId)
        .then(descriptor => descriptor.endpoints[0].protocolInformation.href)
        .then(aasServerEndpoint => getShellViaUrl(aasServerEndpoint));
}

const getShellDescriptors = async (aasRegistryEndpoint) => {

    const getShellDescriptorUrl = aasRegistryEndpoint + "/shell-descriptors";

    return fetch(getShellDescriptorUrl).then(response => response.json())
        .then(data => data.result);
}

const getShellsViaRegistry = async (aasRegistryEndpoint, predicate = () => true) => {

    const shellEndpoints = await getShellDescriptors(aasRegistryEndpoint)
        .then(descriptors => descriptors.map(descriptor => descriptor.endpoints[0].protocolInformation.href));

    return Promise.all(shellEndpoints.map(shellEndpoint => getShellViaUrl(shellEndpoint))).then(shells => shells.filter(predicate));
}

const getSubmodelRefs = async (aasServerEndpoint, aasId) => {

    const getSubmodelRefsUrl = aasServerEndpoint + "/shells/" +
        encodeBase64Url(aasId) + "/submodel-refs";

    return fetch(getSubmodelRefsUrl).then(response => response.json()).then(data => data.result);
}

const getSubmodels = async (aasServerEndpoint, aasId, predicate = () => true) => {

    const submodelRefs = await getSubmodelRefs(aasServerEndpoint, aasId);

    return Promise.all(submodelRefs.map(submodelRef => getSubmodelByRef(aasServerEndpoint, submodelRef))).then(submodels => submodels.filter(predicate));
}

const getFirstSubmodel = async (submodelServerEndpoint, aasId, predicate = () => true) => {
    return getSubmodels(submodelServerEndpoint, aasId).then(submodels => submodels.find(predicate));
}

const getSubmodelByRef = async (submodelServerEndpoint, submodelRef) => {

    var submodelId = submodelRef.keys[0].value;

    return getSubmodel(submodelServerEndpoint, submodelId);
}

const getSubmodel = async (submodelServerEndpoint, submodelId) => {

    let getSubmodelUrl = submodelServerEndpoint + "/submodels/" +
        encodeBase64Url(submodelId);

    return fetch(getSubmodelUrl).then(response => response.json()).then(json => aas.jsonization.submodelFromJsonable(json).value);
}

const getSubmodelDescriptor = async (submodelRegistryEndpoint, submodelId) => {

    const getSubmodelDescriptorUrl = submodelRegistryEndpoint + "/submodel-descriptors/" + encodeBase64Url(submodelId);

    return fetch(getSubmodelDescriptorUrl).then(response => response.json());
}

const getSubmodelViaRegistry = async (submodelRegistryEndpoint, submodelId) => {

    return getSubmodelDescriptor(submodelRegistryEndpoint, submodelId)
        .then(descriptor => descriptor.endpoint.protocolInformation.href)
        .then(submodelServerEndpoint => getSubmodel(submodelServerEndpoint, submodelId));
}

const getSubmodelsViaRegistry = async (aasRegistryEndpoint, submodelRegistryEndpoint, aasId, predicate = () => true) => {

    const aas = await getShellViaRegistry(aasRegistryEndpoint, aasId);
    var submodelIds = aas.submodels.map(smRef => smRef.keys[0].value);
    
    return Promise.all(submodelIds.map(submodelId => getSubmodelViaRegistry(submodelRegistryEndpoint, submodelId))).then(submodels => submodels.filter(predicate));
}

const getFirstSubmodelViaRegistry = async (aasRegistryEndpoint, submodelRegistryEndpoint, aasId, predicate = () => true) => {
    return getSubmodelsViaRegistry(aasRegistryEndpoint, submodelRegistryEndpoint, aasId).then(submodels => submodels.find(predicate));
}

const encodeBase64Url = (string) => {
    return Buffer.from(string).toString('base64').replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

module.exports = {
    serverBasedApi: {
        getShells: getShells,
        getShell: getShell,
        getSubmodels: getSubmodels,
        getFirstSubmodel: getFirstSubmodel,
        getSubmodel: getSubmodel
    },
    registryBasedApi: {
        getShellsViaRegistry: getShellsViaRegistry,
        getShellViaRegistry: getShellViaRegistry,
        getSubmodelsViaRegistry: getSubmodelsViaRegistry,
        getFirstSubmodelViaRegistry: getFirstSubmodelViaRegistry,
        getSubmodelViaRegistry: getSubmodelViaRegistry
    }
}