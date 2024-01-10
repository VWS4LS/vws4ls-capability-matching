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
const aasRestServerEndpoint = 'http://localhost:5001'; 

// id of the AAS submodel defining the required capability
// (this is expected to be available at the AAS server, see above)
const requiredCapabiltySubmodelId = 'www.tier1.com/ids/sm/2135_1132_8032_2655';

// idShort path(s) pointing to the required capability/ies to check; this is expected
// to be within the required capability submodel identified via 'requiredCapabiltySubmodelId'
const requiredCapabilityContainerIdShortPath = 'CapabilitySet/CapabilityContainer01';

// the id of the AAS representing the machine to check for the required capability
// (this is expected to be available at the AAS server, see above)
const machineAasId = 'www.komaxgroup.com/ids/aas/4420_0010_1010_9339';

let result = await capabilityCheck.executeCapabilityCheck(
    aasRestServerEndpoint, 
    requiredCapabiltySubmodelId, 
    requiredCapabilityContainerIdShortPath, 
    machineAasId
);

// whether the capability check succeeded
const success = result.success;

// the result object contains more information about the result of the capability
// check, e.g. a message via the check failed or information about additional 
// tools required to provide a capability
console.log(result);
```