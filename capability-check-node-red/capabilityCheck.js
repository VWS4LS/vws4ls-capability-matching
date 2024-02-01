const capabilityCheck = require('capability-check');

module.exports = function (RED) {
    function CapabilityCheckNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.on('input', async function (msg) {
            let payload = msg.payload;

            let result = await capabilityCheck.executeCapabilityCheck(
                payload.aasRestServerEndpoint,
                payload.requiredCapabiltySubmodelId,
                payload.requiredCapabilityContainerIdShortPath,
                payload.machineAasId,
                payload.instanceCheck
            );

            msg.payload = result;

            node.send(msg);
        });
    }
    RED.nodes.registerType("capability-check", CapabilityCheckNode);
}