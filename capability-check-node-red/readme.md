# Capability Check Node Red

This project is a result from the research project "VWS4LS". It provides a node
definition for node-red that checks if a certain machine is able to provide a 
certain capability required to produce (parts of) a wiring harness. One example 
would be to crimp a certain contact with a wire of a certain diameter.

The actual capability check is performed by the node module `capability-check`.
More information can be found in its own [readme](../capability-check//readme.md).

## Installation

- Clone the Git repository
- Install this node module into you Node-RED runtime:
    `npm install <local-path-to-git-repository>/capability-check-node-red`

For more information about installing a module into your Node-RED runtime,
refer to [the Node-RED documentation](https://nodered.org/docs/creating-nodes/first-node#testing-your-node-in-node-red).

## Docker

A Docker container that already includes node-red as well as the capability-check node can be created executing the following command in this directory:
`docker build -t node-red-capability-check -f Dockerfile ..`

## Usage

Once installed correctly, your Node-RED runtime should provide an addtional node called `capability-check` in the 'function' section. 
After instantiating this node, make sure to provide its input with messages containing a payload object of the following structure:

```javascript
{
    // either a string representing the endpoint of an AAS server providing access to all relevant AASes and submodels or an object with two members 
    // 'aasRegistryEndpoint' and 'submodelRegistryEndpoint' describing the registry endpoints used to find the servers hosting the relevant AASes and submodels
    "endpoint" : "http://localhost:5001", // or: {"aasRegistryEndpoint" = "http://localhost:5001", "submodelRegistryEndpoint" = "http://localhost:5001"}
    // id of the AAS submodel defining the required capability
    // (this is expected to be available at the AAS server, see above)
    "requiredCapabiltySubmodelId" : "www.tier1.com/ids/sm/2135_1132_8032_2655",
    // idShort path(s) pointing to the required capability/ies to check; this is expected
    // to be within the required capability submodel identified via 'requiredCapabiltySubmodelId'
    "requiredCapabilityContainerIdShortPath" : "CapabilitySet/CapabilityContainer01", // or: ["CapabilitySet/CapabilityContainer01", "CapabilitySet/CapabilityContainer04"]
    // the id of the AAS representing the machine to check for the required capability
    // (this is expected to be available at the AAS server, see above)
    "machineAasId" : "www.komaxgroup.com/ids/aas/4420_0010_1010_9339",
    // whether the capability check shall take into account only the currently mounted tools (true) or all tools that can theoretically be mounted (false); 
    // default is 'false'
    "instanceCheck" : false, // or: omit this parameter
    // username that will be included when fetching data from the endpoint(s); username/password will be included directly in the fetch urls; it 
    // is assumed that username and passwords for all endpoints are identical
    "username" : "my-username", // or: omit this parameter
    // password that will be included when fetching data from the endpoint(s); username/password will be included directly in the fetch urls; it 
    // is assumed that username and passwords for all endpoints are identical
    "password" : "my-password" // or: omit this parameter
}
```

When triggered, the node will send a message with the result(s) of the capability 
check to the output. The result object(s) contain/s detailed information about the 
result of the capability check, e.g. a message via the check failed or 
information about additional tools required to provide a capability. A detailed explanation of the various fields of the result object is provided in the following section.

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