func {{name}}(
{{~#each arguments~}}
{{sanitize @key}} chan {{this}} {{#unless @last}}, {{/unless}}
{{~/each}}
) {
  {{#each prefixes}}
  {{this}}
  {{/each}}
  
  {{#each channels}}
  chan{{@index}} := make(chan {{type}})
  {{/each}}
  
  {{#each processes}}
  go {{name}}({{#each parameters}}{{name}} {{#unless @last}}, {{/unless}}{{/each}})
  {{/each}}
}