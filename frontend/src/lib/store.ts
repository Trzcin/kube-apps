import { writable } from 'svelte/store';

export const userId = writable<string | null>();

export const requestLogs = writable<{ date: Date; msg: string }[]>([]);
export function logRequest(msg: string) {
	requestLogs.update((logs) => [...logs, { date: new Date(), msg }]);
}
