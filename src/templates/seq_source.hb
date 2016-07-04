package main

// imports
{{#each imports}}
import "{{this}}"
{{/each}}

// global variables
var wg sync.WaitGroup
var global_op_count int64
{{#each globals}}
var {{sanitize name}} {{type}}
{{/each}}

// parents / compounds
{{#each compounds}}

{{this}}

{{/each}}

func main() {
  global_op_count = 0
  P_main()
  fmt.Println()
  fmt.Print("#Operations: ", global_op_count)
}
