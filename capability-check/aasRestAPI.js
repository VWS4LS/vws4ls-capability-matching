const fetch = require('node-fetch');
const aas = require('@aas-core-works/aas-core3.0-typescript');

const getShellsViaServer = async (aasServerEndpoint, predicate = () => true) => {

    const getShellsUrl = aasServerEndpoint + "/shells";

    return fetch(getShellsUrl).then(response => response.json())
        .then(data => data.result)
        .then(shells => shells.map(json => aas.jsonization.assetAdministrationShellFromJsonable(json).value))
        .then(shells => shells.filter(predicate));
};

const getShellViaServer = async (aasServerEndpoint, aasId) => {

    const getShellUrl = aasServerEndpoint + "/shells/" + encodeBase64Url(aasId);

    return getShell(getShellUrl);
}

const getShell = async (getShellUrl) => {

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
        .then(aasServerEndpoint => getShell(aasServerEndpoint));
}

const getShellDescriptors = async (aasRegistryEndpoint) => {

    const getShellDescriptorUrl = aasRegistryEndpoint + "/shell-descriptors";

    return fetch(getShellDescriptorUrl).then(response => response.json())
        .then(data => data.result);
}

const getShellsViaRegistry = async (aasRegistryEndpoint, predicate = () => true) => {

    const shellEndpoints = await getShellDescriptors(aasRegistryEndpoint)
        .then(descriptors => descriptors.map(descriptor => descriptor.endpoints[0].protocolInformation.href));

    return Promise.all(shellEndpoints.map(shellEndpoint => getShell(shellEndpoint))).then(shells => shells.filter(predicate));
}

const getSubmodelRefs = async (aasServerEndpoint, aasId) => {

    const getSubmodelRefsUrl = aasServerEndpoint + "/shells/" +
        encodeBase64Url(aasId) + "/submodel-refs";

    return fetch(getSubmodelRefsUrl).then(response => response.json()).then(data => data.result);
}

const getSubmodelsViaServer = async (aasServerEndpoint, aasId, predicate = () => true) => {

    const submodelRefs = await getSubmodelRefs(aasServerEndpoint, aasId);

    return Promise.all(submodelRefs.map(submodelRef => getSubmodelByRefViaServer(aasServerEndpoint, submodelRef))).then(submodels => submodels.filter(predicate));
}

const getFirstSubmodelFromServer = async (submodelServerEndpoint, aasId, predicate = () => true) => {
    return getSubmodelsViaServer(submodelServerEndpoint, aasId).then(submodels => submodels.find(predicate));
}

const getSubmodelByRefViaServer = async (submodelServerEndpoint, submodelRef) => {

    var submodelId = submodelRef.keys[0].value;

    return getSubmodelViaServer(submodelServerEndpoint, submodelId);
}

const getSubmodelViaServer = async (submodelServerEndpoint, submodelId) => {

    let getSubmodelUrl = submodelServerEndpoint + "/submodels/" +
        encodeBase64Url(submodelId);

    return getSubmodel(getSubmodelUrl);
}

const getSubmodel = async (getSubmodelUrl) => {
    return fetch(getSubmodelUrl).then(response => response.json()).then(json => aas.jsonization.submodelFromJsonable(json).value);
}

const getSubmodelDescriptor = async (submodelRegistryEndpoint, submodelId) => {

    const getSubmodelDescriptorUrl = submodelRegistryEndpoint + "/submodel-descriptors/" + encodeBase64Url(submodelId);

    return fetch(getSubmodelDescriptorUrl).then(response => response.json());
}

const getSubmodelViaRegistry = async (submodelRegistryEndpoint, submodelId) => {

    return getSubmodelDescriptor(submodelRegistryEndpoint, submodelId)
        .then(descriptor => (descriptor.endpoint || descriptor.endpoints[0]).protocolInformation.href)
        .then(submodelEndpoint => getSubmodel(submodelEndpoint));
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
        getShellsViaServer: getShellsViaServer,
        getShellViaServer: getShellViaServer,
        getSubmodelsViaServer: getSubmodelsViaServer,
        getFirstSubmodelFromServer: getFirstSubmodelFromServer,
        getSubmodelViaServer: getSubmodelViaServer
    },
    registryBasedApi: {
        getShellsViaRegistry: getShellsViaRegistry,
        getShellViaRegistry: getShellViaRegistry,
        getSubmodelsViaRegistry: getSubmodelsViaRegistry,
        getFirstSubmodelViaRegistry: getFirstSubmodelViaRegistry,
        getSubmodelViaRegistry: getSubmodelViaRegistry
    }
}
