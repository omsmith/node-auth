get_directories() {
	parent="${1}"; shift

	find "${parent}" -maxdepth 1 -not -path "${parent}" -type d | xargs -n1 readlink -f
}

get_packages() {
	get_directories "packages/node_modules"
}
