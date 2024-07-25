const url = "http://localhost:4321/api";

// This is the graph traversal function. It recursively fetches all dependencies from the server to assemble the graph.
// We first need to fetch the dependencies of the root node, then for each dependency, we fetch its dependencies, and so on.

const json = await fetch(`${url}/generic-wooden-towels/1.9.5`).then((response) => response.json()) as Object;

async function fetchDependencies(pkg: Object): Promise<Object[]> {
	const deps = [];
	for (const {name, version} of pkg.dependencies) {
		const json = await fetch(`${url}/${name}/${version}`).then((response) => response.json()) as Object;

		deps.push(json.body);
		deps.push(...(await fetchDependencies(json.body)));
	}

	return deps;
}

const deps = await fetchDependencies(json.body);

console.log(deps.length);
