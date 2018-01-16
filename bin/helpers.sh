get_directories() {
	parent="${1}"; shift

	find "${parent}" -maxdepth 1 -not -path "${parent}" -type d | sort | xargs -n1 readlink -f | trim
}

trim() {
	awk '{$1=$1};1'
}

get_packages() {
	get_directories "packages/node_modules"
}
