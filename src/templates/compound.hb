// {{name}}
func P_{{sanitize uid}}(
{{~#each arguments~}}
{{#if inputPrefix}}{{inputPrefix}}{{/if}}{{sanitize name}}{{#unless inputPrefix}}_chan chan {{/unless}}{{normType type}} {{#unless @last}}, {{/unless}}
{{~/each}}
) {
  {{#each prefixes}}
  {{this}}
  {{/each}}

  {{#each channels}}
  {{#cmpdChannel .. outPort inPort}}
  {{else}}
  chan_{{sanitize ../outPort}} := make(chan {{normType ../channelType}})
  {{/cmpdChannel}}
  {{/each}}
  {{#each inputPorts~}}
  chan_{{sanitize ../name}}_PORT_{{sanitize @key}} := {{sanitize @key}}_chan
  {{/each}}
  {{#each outputPorts~}}
  chan_{{sanitize ../name}}_PORT_{{sanitize @key}} := {{sanitize @key}}_chan
  {{/each}}
  {{#each channels}}
  {{#hasPort .. inPort}}
  chan_{{sanitize ../outPort}} := chan_{{sanitize ../inPort}}
  {{else}}
  chan_{{sanitize ../inPort}} := chan_{{sanitize ../outPort}}
  {{/hasPort}}
  {{/each}}


  {{#each continuations}}
  // continuation channels
  continuation_{{sanitize value.target}}_chan := make(chan bool)
  {{/each}}
  {{#each processes}}
  {{#if params.recursiveRoot}}
  continuation_{{sanitize name}}_chan := make(chan bool)
  go func() {
    for {
      continuation_{{sanitize name}}_chan <- true
    }
  }()
  {{/if}}
  {{#if recursive}}go /*recursive*/ P_{{sanitize name}}{{else}}go P_{{sanitize uid}}{{/if}}({{#each arguments~}}
  {{#if passingPrefix}}{{passingPrefix}}{{sanitize name}}{{#if callingPostfix}}{{callingPostfix}}{{/if}}
  {{~else~}}
  chan_{{sanitize ../name}}_PORT_{{sanitize name}}{{/if}} {{#unless @last}}, {{/unless}}{{/each}})
  {{/each}}

  {{#each postfixes}}
  {{this}}
  {{/each}}
}

{{#ifEq name uid}}
{{else}}
var P_{{sanitize ../name}} = P_{{sanitize ../uid}}
{{/ifEq}}
