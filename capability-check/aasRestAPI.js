const fetch = require('node-fetch');
const aas = require('@aas-core-works/aas-core3.0-typescript');

const getShells = async (aasRestServerEndpoint, predicate = () => true) => {

    const getShellsUrl = aasRestServerEndpoint + "/shells";

    return fetch(getShellsUrl).then(response => response.json())
        .then(data => data.result)
        .then(shells => shells.map(json => aas.jsonization.assetAdministrationShellFromJsonable(json).value))
        .then(shells => shells.filter(predicate));
};

const getShell = async (aasRestServerEndpoint, aasId) => {

    const getShellUrl = aasRestServerEndpoint + "/shells/" + encodeBase64Url(aasId);

    return fetch(getShellUrl).then(response => response.json())
        .then(json => aas.jsonization.assetAdministrationShellFromJsonable(json).value);
}

const getSubmodelRefs = async (aasRestServerEndpoint, aasId) => {

    const getSubmodelRefsUrl = aasRestServerEndpoint + "/shells/" +
        encodeBase64Url(aasId) + "/submodel-refs";

    return fetch(getSubmodelRefsUrl).then(response => response.json()).then(data => data.result);
}

const getSubmodels = async (aasRestServerEndpoint, aasId, predicate = () => true) => {

    const submodelRefs = await getSubmodelRefs(aasRestServerEndpoint, aasId);

    return Promise.all(submodelRefs.map(submodelRef => getSubmodelByRef(aasRestServerEndpoint, submodelRef))).then(submodels => submodels.filter(predicate));
}

const getFirstSubmodel = async (aasRestServerEndpoint, aasId, predicate = () => true) => {
    return getSubmodels(aasRestServerEndpoint, aasId, predicate).then(submodels => submodels.find(predicate));
}

const getSubmodelByRef = async (aasRestServerEndpoint, submodelRef) => {

    var submodelId = submodelRef.keys[0].value;

    return getSubmodel(aasRestServerEndpoint, submodelId);
}

const getSubmodel = async (aasRestServerEndpoint, submodelId, deep = false) => {

    let getSubmodelUrl = aasRestServerEndpoint + "/submodels/" +
        encodeBase64Url(submodelId);

    return fetch(getSubmodelUrl).then(response => response.json()).then(json => aas.jsonization.submodelFromJsonable(json).value);
}

const encodeBase64Url = (string) => {
    return Buffer.from(string).toString('base64').replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

module.exports = {
    getShells: getShells,
    getShell: getShell,
    getSubmodelRefs: getSubmodelRefs,
    getSubmodels: getSubmodels,
    getFirstSubmodel: getFirstSubmodel,
    getSubmodel: getSubmodel
}