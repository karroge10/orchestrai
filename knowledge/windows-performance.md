# Windows performance triage

Keywords: slow, lag, performance, CPU, memory, disk.

Start with CPU and memory pressure, then inspect the largest processes. Check system-drive free space because Windows updates, paging, and temporary files need headroom. Review startup entries as possible sign-in overhead, not as proof of a fault. Event Viewer errors are supporting evidence and can be noisy; correlate provider, event ID, and timing before recommending action.
