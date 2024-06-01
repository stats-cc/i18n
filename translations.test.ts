import { describe, it, assert, expect, test } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import englishTranslation from "./website/en.json";

const testFilePaths = readdirSync("./website").filter((file) => file !== "en.json");
const testFiles = testFilePaths.map((path) => [path, readFileSync(`./website/${path}`, "utf-8")]);

describe("translations", () => {
	it.each(testFiles)("should be valid json", (path, content) => {
		assert.doesNotThrow(() => JSON.parse(content));
	});

	it.each(testFiles)("should have all the same keys as the english file %s", (path, content) => {
		const fileJSON = JSON.parse(content);
		const englishKeys = getObjectKeysDeep(englishTranslation);
		expect(getObjectKeysDeep(fileJSON)).toEqual(englishKeys);
	});

	it.each(testFiles)(
		"each translation should still have replacement variables present %s",
		(path, content) => {
			const fileJSON = JSON.parse(content);
			const fileNullKeychains = getObjectKeysDeep(fileJSON).filter((key, index) => {
				const keys: string[] = key.split(".");
				let value = fileJSON;
				for (let i = 0; i < keys.length; i++) {
					value = value[keys[i]];
				}
				return value === null;
			});

			const englishKeyReplacements = getObjectReplacementValuesByKey(
				englishTranslation,
				fileNullKeychains
			);
			expect(getObjectReplacementValuesByKey(fileJSON, fileNullKeychains)).toEqual(
				englishKeyReplacements
			);
		}
	);
});

test("getObjectKeysDeep", () => {
	expect(getObjectKeysDeep({ a: { b: 5 } })).toEqual(["a", "a.b"]);
	expect(getObjectKeysDeep({ a: { b: { c: 5 } } })).toEqual(["a", "a.b", "a.b.c"]);
	expect(getObjectKeysDeep({ a: { b: { c: 5, d: 6 } } })).toEqual(["a", "a.b", "a.b.c", "a.b.d"]);
});

function getObjectReplacementValuesByKey(obj: Record<string, any>, exceptions: string[] = []) {
	const englishKeys: string[] = getObjectKeysDeep(obj);

	const englishKeyReplacements: Record<string, string[]> = {};
	englishKeys.forEach((key) => {
		if (exceptions.includes(key)) {
			return;
		}

		const keyValue: any = key.split(".").reduce((acc, key) => acc[key], obj);
		if (typeof keyValue !== "string") {
			return;
		}

		// Find all strings between curly braces
		const regex = /{(.*?)}/;
		const matches = keyValue.match(regex);
		if (!matches) {
			return;
		}

		if (!englishKeyReplacements[key]) {
			englishKeyReplacements[key] = [];
		}

		englishKeyReplacements[key].push(matches[0]);
	});

	return englishKeyReplacements;
}

/**
 * Gets all the keys of an object, including nested objects.
 * Nested keys should be separated by a dot.
 *
 * example:
 *  {a: {b: 5}} => ["a.b"]
 *  {a: {b: {c: 5}}} => ["a.b.c"]
 *
 * @param obj an object
 */
function getObjectKeysDeep(obj: any): string[] {
	return Object.keys(obj)
		.filter((key) => obj[key] instanceof Object)
		.map((key) => getObjectKeysDeep(obj[key]).map((k) => `${key}.${k}`))
		.reduce((x, y) => x.concat(y), Object.keys(obj));
}
