func P_{{sanitize uid}}(
{{~#each arguments~}}
{{sanitize name}}{{#if inputPrefix}}{{inputPrefix}} {{/if}}{{#unless inputPrefix}}_chan chan {{/unless}}{{normType type}} {{#unless @last}}, {{/unless}}
{{~/each}}
) {
  for {
    {{compiledCode}}
  }
  {{#if properties.needsWaitGroup}}
  wg.Done()
  {{/if}}
  {{#each outputPorts~}}
  close({{sanitize @key}}_chan)
  {{/each}}
}
