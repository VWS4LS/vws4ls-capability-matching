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
    // whether the capability check shall be executed on an instance-base (taking into account the 
    // currently mounted tools) or on a type-base (taking into account tools that can theoretically 
    // be mounted); if this parameter is omitted, the type of check will be determined based on 
    // the type of machine AAS (AAS type == instance -> instance check; AAS type == type -> type check)
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
information about additional tools required to provide a capability.