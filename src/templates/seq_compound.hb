func P_{{#if id}}{{sanitize id}}{{else}}{{sanitize name}}{{/if}}(
{{~#each arguments~}}
{{sanitize name}} {{#if inputPrefix}}{{inputPrefix}}{{/if}}{{type}} {{#unless @last}}, {{/unless}}
{{~/each}}
) {
  {{#ifEq name "main"~}}for { {{~/ifEq}}
    {{#each channels}}
    var {{sanitize outPort}} {{channelType}}
    {{sanitize inPort}} := &{{sanitize outPort}}
    {{/each}}
    {{#unless atomic}}
    {{#each inputPorts}}
    {{sanitize ../name}}_PORT_{{sanitize @key}} = *{{sanitize @key}}
    {{/each}}
    {{/unless}}

    {{#each processes}}
    // ###### {{#if id}}{{sanitize id}}{{else}}{{sanitize name}}{{/if}} ######
    {
      // inputs
      {{#each inputPorts}}
      {{sanitize @key}} := *{{sanitize ../name}}_PORT_{{sanitize @key}}
      {{/each}}
      // outputs
      {{#each outputPorts}}
      var {{sanitize @key}} {{this}}
      {{/each}}
      {{#if atomic}}
      // code
      {{compiledCode}}
      {{else}}
      // function call
      P_{{sanitize id}}(
      {{~#each arguments~}}
      {{#if passingPrefix}}{{passingPrefix}}{{/if}}{{sanitize name}}{{#unless @last}}, {{/unless}}
      {{~/each}})
      {{/if}}
      // outputs to edges
      {{#each outputPorts}}
      {{sanitize ../name}}_PORT_{{sanitize @key}}  = {{sanitize @key}}
      {{/each}}
    }
  {{/each}}
  {{#unless atomic}}
  {{#each outputPorts}}
  *{{sanitize @key}} = *{{sanitize ../name}}_PORT_{{sanitize @key}}
  {{/each}}
  {{/unless}}
  {{#ifEq name "main"~}} } {{~/ifEq}}
}
