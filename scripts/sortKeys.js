const fs = require("fs");
const path = require("path");

sortJsonFiles("./website");

function deepSortObject(obj) {
	if (typeof obj !== "object" || obj === null) {
		return obj;
	}

	if (Array.isArray(obj)) {
		return obj.map(deepSortObject);
	}

	const sortedObj = {};
	const keys = Object.keys(obj).sort();

	keys.forEach((key) => {
		sortedObj[key] = deepSortObject(obj[key]);
	});

	return sortedObj;
}

function sortJsonFiles(directory) {
	const files = fs.readdirSync(directory).filter((file) => file.endsWith(".json"));

	files.forEach((file) => {
		const filePath = path.join(directory, file);
		const fileData = JSON.parse(fs.readFileSync(filePath, "utf8"));

		const sortedData = deepSortObject(fileData);
		fs.writeFileSync(filePath, JSON.stringify(sortedData, null, 4), "utf8");
	});

	console.log("All JSON files have been sorted.");
}
