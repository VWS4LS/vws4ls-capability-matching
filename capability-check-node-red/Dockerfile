FROM nodered/node-red

# Install the capability-check node
COPY capability-check ./capability-check
COPY capability-check-node-red ./capability-check-node-red
RUN npm install ./capability-check-node-red
