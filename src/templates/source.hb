package main

// imports
{{#each imports}}
import {{#ifEq this "unsafe"}}unsafe{{/ifEq}} "{{this}}"
{{/each}}
import "runtime"

// global variables
var __wg__global sync.WaitGroup
{{#each globals}}
var {{sanitize name}} {{type}}
{{/each}}

// process declarations
{{#each processes}}

{{this}}

{{/each}}

// parents / compounds
{{#each compounds}}

{{this}}

{{/each}}

func main() {
  // prevent crashes due to too many processes
  runtime.GOMAXPROCS(2)
  P_main()
}
