func P_{{sanitize name}}(
{{~#each arguments~}}
{{#if inputPrefix}}{{inputPrefix}}{{/if}}{{sanitize name}}{{#unless inputPrefix}}_chan chan {{/unless}}{{type}} {{#unless @last}}, {{/unless}}
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
  go P_{{sanitize name}}({{#each arguments~}}
  {{#if passingPrefix}}{{passingPrefix}}{{sanitize name}}
  {{~else~}}
  chan_{{sanitize ../name}}_PORT_{{sanitize name}}{{/if}} {{#unless @last}}, {{/unless}}{{/each}})
  {{/each}}
  
  {{#each postfixes}}
  {{this}}
  {{/each}}
}
