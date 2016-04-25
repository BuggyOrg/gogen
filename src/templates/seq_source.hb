package main

// imports
{{#each imports}}
import "{{this}}"
{{/each}}

// global variables
var wg sync.WaitGroup
{{#each globals}}
var {{sanitize name}} {{type}}
{{/each}}

// parents / compounds
{{#each compounds}}

{{this}}

{{/each}}

func main() {
  P_main()
}
