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

## Usage

Once installed correctly, your Node-RED runtime should provide an addtional node called `capability-check` in the 'function' section. 
After instantiating this node, make sure to provide its input with messages containing a payload object of the following structure:

```javascript
{
    // endpoint of the AAS server providing access to all relevant AASes
    aasRestServerEndpoint : 'http://localhost:5001',
    // id of the AAS submodel defining the required capability
    // (this is expected to be available at the AAS server, see above)
    requiredCapabiltySubmodelId : 'www.tier1.com/ids/sm/2135_1132_8032_2655',
    // idShort path(s) pointing to the required capability/ies to check; this is expected
    // to be within the required capability submodel identified via 'requiredCapabiltySubmodelId'
    requiredCapabilityContainerIdShortPath : 'CapabilitySet/CapabilityContainer01', // or: ['CapabilitySet/CapabilityContainer01', 'CapabilitySet/CapabilityContainer04']
    // the id of the AAS representing the machine to check for the required capability
    // (this is expected to be available at the AAS server, see above)
    machineAasId : 'www.komaxgroup.com/ids/aas/4420_0010_1010_9339'
}
```

When triggered, the node will send a message with the result(s) of the capability 
check to the output. The result object(s) contain/s detailed information about the 
result of the capability check, e.g. a message via the check failed or 
information about additional tools required to provide a capability.