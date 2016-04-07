func P_{{#if id}}{{sanitize id}}{{else}}{{sanitize name}}{{/if}}(
{{~#each arguments~}}
{{#if inputPrefix}}{{inputPrefix}}{{/if}}{{sanitize name}}{{#unless inputPrefix}}_chan chan {{/unless}}{{type}} {{#unless @last}}, {{/unless}}
{{~/each}}
) {
  {{#if arguments.length}}
  for {
  {{/if}}
  {{#each prefixes}}
  {{this}}
  {{/each}}
  
  {{#each inputPorts~}}
  {{sanitize @key}},ok{{@index}} := <- {{sanitize @key}}_chan
  if !ok{{@index}} {
    break
  }
  {{/each}}

  {{#each channels}}
  chan_{{sanitize inPort}} := make(chan {{channelType}})
  {{/each}}
  {{#each outputPorts~}}
  chan_{{sanitize ../name}}_PORT_{{sanitize @key}} = {{sanitize @key}}_chan
  {{/each}}
  {{#each channels}}
  chan_{{sanitize outPort}} := chan_{{sanitize inPort}}
  {{/each}}

  {{#each processes}}
  go P_{{#if id}}{{sanitize id}}{{else}}{{sanitize name}}{{/if}}({{#each arguments~}}
  {{#if passingPrefix}}{{passingPrefix}}{{sanitize name}}
  {{~else~}}
  chan_{{sanitize ../name}}_PORT_{{sanitize name}}{{/if}} {{#unless @last}}, {{/unless}}{{/each}})
  {{/each}}
  
  {{#each inputPorts~}}
  chan_{{sanitize ../name}}_PORT_{{sanitize @key}} <- {{sanitize @key}}
  {{/each}}
  
  {{#each postfixes}}
  {{this}}
  {{/each}}
  
  {{#if arguments.length}}
  }
  {{/if}}
  
  {{#each outputPorts~}}
  close({{sanitize @key}}_chan)
  {{/each}}
}
