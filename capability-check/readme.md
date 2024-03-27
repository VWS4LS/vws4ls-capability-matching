# Capability Check

This project is a result from the research project "VWS4LS". It provides functionality
to check if a certain machine is able to provide a certain capability required
to produce (parts of) a wiring harness. One example would be to crimp a certain
contact with a wire of a certain diameter.

The capability check is based on information from the digital twins of machines,
tools, the wiring harness itself, etc. all being defined as part of a set of
Asset Administration Shells (AAS).

(The content of) these AASes are queried by the algorithm. Therefore, all relevant AASes need to
be available via an AAS server that offers the content of the AASes via the
official REST API of the Asset Administration Shell.

## Installation

`npm install <local-path-to/>capability-check`

## Usage

This node module provides exactly one function that can be called and that will execute the capability check.

```javascript
const capabilityCheck = require('capability-check');

// endpoint of the AAS server providing access to all relevant AASes
const aasServerEndpoint = 'http://localhost:5001'; 

// alternatively, instead of providing the endpoint of an aasServer, it is also possible
// to provide an object with two members 'aasRegistryEndpoint' and 'submodelRegistryEndpoint' 
// describing the registry endpoints used to find the servers hosting the relevant AASes and submodels;
const registryEndpoints = {
    aasRegistryEndpoint = 'http://localhost:5001',
    submodelRegistryEndpoint = 'http://localhost:5001'
}

// id of the AAS submodel defining the required capability
// (this is expected to be available at the AAS server, see above)
const requiredCapabiltySubmodelId = 'www.tier1.com/ids/sm/2135_1132_8032_2655';

// idShort path(s) pointing to the required capability/ies to check; this is expected
// to be within the required capability submodel identified via 'requiredCapabiltySubmodelId'
const requiredCapabilityContainerIdShortPath = 'CapabilitySet/CapabilityContainer01'; // or: ['CapabilitySet/CapabilityContainer01', 'CapabilitySet/CapabilityContainer02']

// the id of the AAS representing the machine to check for the required capability
// (this is expected to be available at the AAS server, see above)
const machineAasId = 'www.komaxgroup.com/ids/aas/4420_0010_1010_9339';

// whether the capability check shall be executed on an instance-base (taking into account the 
// currently mounted tools) or on a type-base (taking into account tools that can theoretically 
// be mounted); if this parameter is omitted, the type of check will be determined based on 
// the type of machine AAS (AAS type == instance -> instance check; AAS type == type -> type check)
const instanceCheck = false;

// username that will be included when fetching data from the endpoint(s); username/password will be included directly in the fetch urls; it 
// is assumed that username and passwords for all endpoints are identical
const username = 'my-username';

// password that will be included when fetching data from the endpoint(s); username/password will be included directly in the fetch urls; it 
// is assumed that username and passwords for all endpoints are identical
const password = 'my-password';

let result = await capabilityCheck.executeCapabilityCheck(
    aasRestServerEndpoint, // or: registryEndpoints
    requiredCapabiltySubmodelId, 
    requiredCapabilityContainerIdShortPath, 
    machineAasId,
    instanceCheck, // or: omit this parameter
    username, // or: omit this parameter
    password // or: omit this parameter
);

// whether the capability check succeeded
const success = result.success;

// the result object contains more information about the result of the capability
// check, e.g. a message via the check failed or information about additional 
// tools required to provide a capability
console.log(result);
```