# vws4ls-capability-matching

This repository provides functionalities to check if a certain machine is able to provide a certain capability required
to produce (parts of) a wiring harness. One example would be to crimp a certain contact with a wire of a certain diameter.

This is a result from the research project [Asset Administration Shell for the Wiring Harness](https://arena2036.de/en/asset-administration-shell-for-wire-harness) (*VWS4LS*) funded by the German Federal Ministry of Education and Research. 

A detailed description of the results of the various subprojects can be found [here](https://arena2036.de/de/vws4ls-ergebnisse) (German only).

This repository contains to projects:

- The actual algorithm to execute a capability check (see [capability-check/readme.md](./capability-check/readme.md))
- The definition of a node for Node-RED (see [capability-check-node-red/readme.md](./capability-check-node-red/readme.md))
