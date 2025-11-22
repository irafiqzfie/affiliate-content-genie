// In-memory store to track video generation status
const operationStore = new Map<string, { startTime: number }>();

export function setOperation(id: string) {
    operationStore.set(id, { startTime: Date.now() });
}

export function getOperation(id: string) {
    return operationStore.get(id);
}

export function deleteOperation(id: string) {
    operationStore.delete(id);
}
