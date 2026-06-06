# Architecture Overview

StackTest partitions execution into three decoupled stages:

```mermaid
flowchart LR
    Config[Configuration] --> Planner[Matrix Planner]
    Planner --> Orchestrator[Run Orchestrator]
    Orchestrator --> Provider[Provider Registry]
```

This guarantees that core systems are entirely decoupled from cloud provider SDK details.
