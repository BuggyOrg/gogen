package main

// imports
{{#each imports}}
import "{{this}}"
{{/each}}

// global variables
var wg sync.WaitGroup
{{#if countOps}}
var global_op_count int64
{{/if}}
{{#each globals}}
var {{sanitize name}} {{type}}
{{/each}}

// parents / compounds
{{#each compounds}}

{{this}}

{{/each}}

func main() {
  {{#if countOperations}}
  global_op_count = 0
  {{/if}}
  P_main()
  {{#if countOperations}}
  fmt.Println()
  fmt.Print("#Operations: ", global_op_count)
  {{/if}}
}
