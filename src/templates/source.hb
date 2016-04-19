package main

// imports
{{#each imports}}
import {{#ifEq this "unsafe"}}unsafe{{/ifEq}} "{{this}}"
{{/each}}

// global variables
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
  P_main()
}