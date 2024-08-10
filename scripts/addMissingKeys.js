const fs = require("fs");
const path = require("path");

updateTranslationFiles("./website");

// Function to get deeply nested keys from an object
function getNestedKeys(obj, prefix = "") {
	return Object.keys(obj).reduce((res, key) => {
		const fullKey = prefix ? `${prefix}.${key}` : key;
		if (typeof obj[key] === "object" && obj[key] !== null) {
			res = res.concat(getNestedKeys(obj[key], fullKey));
		} else {
			res.push(fullKey);
		}
		return res;
	}, []);
}

// Function to set a nested key in an object, creating nested objects if necessary
function setNestedKey(obj, keyPath, value) {
	const keys = keyPath.split(".");
	let current = obj;
	for (let i = 0; i < keys.length - 1; i++) {
		const key = keys[i];
		if (!current[key]) {
			current[key] = {};
		}
		current = current[key];
	}
	current[keys[keys.length - 1]] = value;
}

// Function to process the directory and update the JSON files
function updateTranslationFiles(directory) {
	const masterFilePath = path.join(directory, "en.json");
	if (!fs.existsSync(masterFilePath)) {
		console.error(`Master file en.json not found in ${directory}`);
		return;
	}

	const masterData = JSON.parse(fs.readFileSync(masterFilePath, "utf8"));
	const masterKeys = getNestedKeys(masterData);

	const files = fs
		.readdirSync(directory)
		.filter((file) => file.endsWith(".json") && file !== "en.json");
	const results = {};
	const newKeys = new Set();

	files.forEach((file) => {
		const filePath = path.join(directory, file);
		const fileData = JSON.parse(fs.readFileSync(filePath, "utf8"));
		const fileKeys = getNestedKeys(fileData);

		const missingKeys = masterKeys.filter((key) => !fileKeys.includes(key));
		missingKeys.forEach((key) => {
			setNestedKey(fileData, key, null);
			newKeys.add(key);
		});

		fs.writeFileSync(filePath, JSON.stringify(fileData, null, 2), "utf8");
		results[file] = missingKeys.length;
	});

	console.log("Keys added to files:");
	console.log(results);
	console.log("New Keys:");
	console.log(Array.from(newKeys));
}
