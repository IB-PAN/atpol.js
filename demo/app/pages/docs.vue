<script setup lang="ts">
import readmeRaw from "../../../README.md?raw";
import { marked } from "marked";
import hljs from "highlight.js/lib/core";

useSeoMeta({
	title: "Dokumentacja biblioteki",
	description: "Dokumentacja techniczna biblioteki TypeScript/JavaScript atpol.js — API reference.",
});

const html = marked.parse(readmeRaw) as string;

onMounted(() => {
	hljs.highlightAll();
});
</script>

<template>
	<div class="max-w-3xl">
		<div class="mb-8">
			<div class="flex items-center gap-3 mb-3">
				<UIcon
					name="i-lucide-book-open"
					class="text-primary size-8 shrink-0"
				/>
				<h1 class="text-3xl font-bold">
					Dokumentacja biblioteki atpol.js
				</h1>
			</div>
			<p class="text-lg text-muted">
				Poniżej znajduje się dokumentacja techniczna biblioteki
				<UButton
					to="https://www.npmjs.com/package/@ib-pan/atpol"
					target="_blank"
					label="@ib-pan/atpol"
					variant="link"
					color="primary"
					class="px-0 font-semibold"
				/>
				— TypeScript/JavaScript API reference w języku angielskim.
			</p>
		</div>

		<USeparator class="mb-8" />

		<div
			class="prose"
			v-html="html"
		/>
	</div>
</template>

<style scoped>
.prose :deep(h1) {
	font-size: 1.875rem;
	font-weight: 700;
	line-height: 1.25;
	margin-top: 2rem;
	margin-bottom: 1rem;
}

.prose :deep(h2) {
	font-size: 1.5rem;
	font-weight: 600;
	line-height: 1.3;
	margin-top: 2rem;
	margin-bottom: 0.75rem;
	padding-bottom: 0.375rem;
	border-bottom: 1px solid var(--ui-border);
}

.prose :deep(h3) {
	font-size: 1.125rem;
	font-weight: 600;
	line-height: 1.4;
	margin-top: 1.5rem;
	margin-bottom: 0.5rem;
}

.prose :deep(h4) {
	font-size: 1rem;
	font-weight: 600;
	margin-top: 1.25rem;
	margin-bottom: 0.375rem;
}

.prose :deep(p) {
	margin-top: 0.75rem;
	margin-bottom: 0.75rem;
	line-height: 1.7;
}

.prose :deep(a) {
	color: var(--ui-primary);
	text-decoration: underline;
}

.prose :deep(a:hover) {
	opacity: 0.8;
}

.prose :deep(strong) {
	font-weight: 600;
}

.prose :deep(em) {
	font-style: italic;
}

.prose :deep(hr) {
	border: none;
	border-top: 1px solid var(--ui-border);
	margin: 2rem 0;
}

.prose :deep(ul),
.prose :deep(ol) {
	padding-left: 1.5rem;
	margin: 0.75rem 0;
}

.prose :deep(ul) {
	list-style-type: disc;
}

.prose :deep(ol) {
	list-style-type: decimal;
}

.prose :deep(li) {
	margin: 0.25rem 0;
	line-height: 1.7;
}

.prose :deep(code:not(pre code)) {
	font-family: ui-monospace, monospace;
	font-size: 0.875em;
	padding: 0.125rem 0.375rem;
	border-radius: 0.25rem;
	background-color: var(--ui-bg-elevated);
	border: 1px solid var(--ui-border);
}

.prose :deep(pre) {
	margin: 1rem 0;
	border-radius: 0.5rem;
	overflow-x: auto;
}

.prose :deep(table) {
	width: 100%;
	border-collapse: collapse;
	margin: 1rem 0;
	font-size: 0.9rem;
}

.prose :deep(th) {
	text-align: left;
	padding: 0.5rem 0.75rem;
	border-bottom: 2px solid var(--ui-border);
	font-weight: 600;
}

.prose :deep(td) {
	padding: 0.5rem 0.75rem;
	border-bottom: 1px solid var(--ui-border);
	vertical-align: top;
}

.prose :deep(tr:last-child td) {
	border-bottom: none;
}

.prose :deep(blockquote) {
	border-left: 4px solid var(--ui-border);
	padding-left: 1rem;
	margin: 1rem 0;
	color: var(--ui-text-muted);
}
</style>
