/* eslint-disable @typescript-eslint/no-explicit-any */

import { object, string, array } from "valibot";
import { useRegistryScript } from "#nuxt-scripts/utils";
import type { NuxtUseScriptOptions } from "#nuxt-scripts/types";
import type { PlausibleConfig } from "@plausible-analytics/tracker";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface PlausibleApi {}

// Schema for validation and DevTools metadata
const PlausibleSchema = object({
	scriptSrc: string(),
	domain: string(),
	endpoint: string(),
	fileExtensions: array(string()),
});

type PlausibleFunction = ((event: "404", options: Record<string, any>) => void) & ((event: "event", options: Record<string, any>) => void) & ((...params: any[]) => void) & {
	q: any[];
	o: object;
	init: (options: PlausibleConfig) => void;
};

interface PlausibleAnalyticsApi {
	plausible: PlausibleFunction;
}

export function useScriptPlausible<T extends PlausibleFunction>(options: {
	scriptSrc: string;
	domain: string;
	endpoint: string;
	fileExtensions: string[];
	scriptOptions?: NuxtUseScriptOptions;
}) {
	return useRegistryScript<T, typeof PlausibleSchema>("plausible", () => ({
		scriptInput: {
			src: options.scriptSrc,
		},
		scriptOptions: {
			...options.scriptOptions,
			use() {
				const w = window as (typeof window & PlausibleAnalyticsApi);

				w.plausible = w.plausible || function (...args: any[]) {
					(w.plausible.q = w.plausible.q || []).push(args);
				};
				w.plausible.init = w.plausible.init || function (i: object) {
					w.plausible.o = i || {};
				};

				w.plausible.init({
					domain: options.domain,
					endpoint: options.endpoint,
					fileDownloads: {
						fileExtensions: options?.fileExtensions || [],
					},
					autoCapturePageviews: true,
				});

				return window.plausible as any as T;
			},
		},
		schema: PlausibleSchema,
	}), options);
}
