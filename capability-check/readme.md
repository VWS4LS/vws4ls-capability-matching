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

// whether the capability check shall take into account only the currently mounted tools (true) or all tools that can theoretically be mounted (false); 
// default is 'false'
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

// a result code that further describes the result of the check
const resultCode = result.resultCode;

// the result object contains more information about the result of the capability
// check, see below for a detailed explanation
console.log(result);
```

## Example Result

```javascript
{
    // the 'endpoint' that was set in the request
    "endpoint": "http://aas-env:8081", 
    // the 'requiredCapabiltySubmodelId' that was set in the request
    "requiredCapabiltySubmodelId": "www.tier1.com/ids/sm/2135_1132_8032_2655",
    // the 'requiredCapabilityContainerIdShortPath' that was set in the request
    "requiredCapabilityContainerIdShortPath": "CapabilitySet/CapabilityContainer01",
    // the 'machineAasId' that was set in the request
    "machineAasId": "www.komaxgroup.com/ids/aas/4420_0010_1010_9339",
    // the 'assetKind' of the requested asset/AAS (instance/type)
    "assetKind": "instance",
    // wheter only currently mounted tools shall be regarded (this is equivalent to the 'instanceCheck' parameter in the request)
    "onlyRegardMountedTools": false,
    // if the algorithm determined that a tool is required by the machine to execute the capability
    "toolRequired": true,
    // which type of tool is required by the machine to execute the capability (only if 'toolRequired' is true)
    "requiredToolType": "CrimpingApplicator",
    // the list of tools currently mounted in the machine (represented by their AAS id)
    "mountedTools": [
        "www.schaefer.biz/ids/aas/3000_0010_1010_9927"
    ],
    // the subset of the mounted tools that are of the 'requiredTooltype'
    "suitableMountedTools": [],
    // the list of tools that are of the 'requiredToolType' and are able to fulfil the capability (represented by their AAS id);
    // NOTE: this also includes tools that are not currently mounted!
    "suitableTools": [
        "www.schaefer.biz/ids/aas/0505_3180_7042_9750"
    ],
    // whether the capability check succeeded, i.e. whether the machine is (theoretically) capable of executing the required capability, potentially with the help of a tool to be mounted
    "success": true,
    // a result code that further describes the result of the check; this is one of:
    // 'CAPABILTY_FULFILLED_BY_MACHINE'
    //      --> successful: the machine fulfills the capability and no tool is required
    // 'SUITABLE_TOOL_MOUNTED'
    //      --> successful: the machine fulfills the capability and is already equipped with a suitable tol
    // 'SUITABLE_TOOL_NEEDS_TO_BE_MOUNTED'
    //      --> successflu: the machine fulfills the capability and a suitable tool exists but the tool needs
    //          to be mounted into the machine first
    // 'CAPABILTY_NOT_FULFILLED_BY_MACHINE'
    //      --> not successful: the machine does not fulfill the capability
    // 'NO_SUITABLE_TOOL_MOUNTED' 
    //      --> not successful: the machine fulfills the capability but no suitable tool was mounted 
    //          (only if 'instanceCheck' was set to 'true')
    // 'NO_SUITABLE_TOOL_EXISTS'
    //      --> not successful: the machine fulfills the capability but no suitable tool was found (in the registry)
    // 'NO_MOUNTING_PATH_FOR_SUITABLE_TOOL_FOUND'
    //      --> not successful: the machine fulfills the capabiilty and at least one suitable tool was found but the 
    //          tool canot be mounted in the machine
    // 'INTERNAL_ERROR'
    //      --> not sucessful: an internal error occurred
    "resultCode": "SUITABLE_TOOL_NEEDS_TO_BE_MOUNTED",
    // a human readable message explaining the result
    "message": "AAS with id \"www.komaxgroup.com/ids/aas/4420_0010_1010_9339\" offers the required capability \"Crimp\" and fulfills all constraints\"! However, a suitable tool needs to be mounted.",
    // for each of the 'suitableTools', a list of potential 'mounting paths';
    // each mounting path is represented by an array that starts with the AAS id of the tool and ends with the AAS id of the machine; these are connected by a list of 'slots' (represented by their name) and further resources that are required to mount the tool into the machine (represented by the AAS id)
    "mountingPathsByTool": {
        "www.schaefer.biz/ids/aas/0505_3180_7042_9750": [
            [
                "www.schaefer.biz/ids/aas/0505_3180_7042_9750",
                "KomaxApplicator",
                "www.komaxgroup.com/ids/aas/5420_0010_1010_4681",
                "KomaxModule",
                "www.komaxgroup.com/ids/aas/4420_0010_1010_9339"
            ]
        ]
    }
}
```