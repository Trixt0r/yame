

export interface Plugin {
    initRenderer();
    initMain();
    activate();
    deactivate();
    dispose();
}