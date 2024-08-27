const capabilityCheck = require('capability-check');

module.exports = function (RED) {
    function CapabilityCheckNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.on('input', async function (msg, send, done) {


            try {
                let payload = msg.payload;


                let result = await capabilityCheck.executeCapabilityCheck(
                    payload.endpoint,
                    payload.requiredCapabiltySubmodelId,
                    payload.requiredCapabilityContainerIdShortPath,
                    payload.machineAasId,
                    payload.instanceCheck,
                    payload.username,
                    payload.password
                );

                msg.payload = result;
                send(msg);
                if (done) {
                    done();
                }
            } catch (error) {
                if (done) {
                    done(error);
                }
            }
            
        });
    }
    RED.nodes.registerType("capability-check", CapabilityCheckNode);
}