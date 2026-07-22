import { ATPOL } from "../../../main";

declare global {
	interface Window {
		ATPOL: typeof ATPOL;
	}
}

export default defineNuxtPlugin(() => {
	window.ATPOL = ATPOL;
});
