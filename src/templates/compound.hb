func {{name}}(
{{~#each arguments~}}
{{sanitize name}} chan {{type}} {{#unless @last}}, {{/unless}}
{{~/each}}
) {
  {{#each prefixes}}
  {{this}}
  {{/each}}

  {{#each channels}}
  chan_{{sanitize inPort}} := make(chan {{channelType}})
  chan_{{sanitize outPort}} := chan_{{sanitize inPort}}
  {{/each}}

  {{#each processes}}
  go {{sanitize id}}({{#each arguments}}chan_{{sanitize ../name}}_PORT_{{sanitize name}} {{#unless @last}}, {{/unless}}{{/each}})
  {{/each}}
}
