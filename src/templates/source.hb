package main

// imports
{{#each imports}}
import "{{this}}"
{{/each}}

// global variables
{{#each globals}}
var {{name}} {{type}}
{{/each}}

// process declarations
{{#each processes}}

{{this}}

{{/each}}

// parents / compounds
{{#each compounds}}

{{this}}

{{/each}}