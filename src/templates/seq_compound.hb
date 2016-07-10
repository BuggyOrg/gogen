// {{id}}
func P_{{#if uid}}{{sanitize uid}}{{else}}{{sanitize name}}{{/if}}(
{{~#each arguments~}}
{{sanitize name}} *{{#if inputPrefix}}{{inputPrefix}}{{/if}}{{normType type}} {{#unless @last}}, {{/unless}}
{{~/each}}
) {
  {{#if recursesTo}}
  P_{{sanitize recursesTo.branchPath}}({{~#each arguments~}}
{{sanitize name}}{{#unless @last}}, {{/unless}}
{{~/each}})
  return
  {{else}}
  for {
    {{#each channels}}
    var {{sanitize outPort}} {{normType channelType}}
    {{sanitize inPort}} := &{{sanitize outPort}}
    {{/each}}
    {{#unless atomic}}
    {{#each inputPorts}}
    {{sanitize ../name}}_PORT_{{sanitize @key}} = *{{sanitize @key}}
    {{/each}}
    {{/unless}}

    {{#each processes}}
    // ###### {{#if uid}}{{uid}}{{else}}{{name}}{{/if}} ######
    {{#if settings.packagedContinuation}}
    // packaged continuation
    {{else}}
    {
      // conts
      // inputs
      {{#each inputPorts}}
      {{#isNotPacked @key ..}}
      {{sanitize @key}} := *{{sanitize ../../name}}_PORT_{{sanitize @key}}
      {{else}}
      // packed port {{@key}}
      {{/isNotPacked}}
      {{/each}}
      // outputs
      {{#each outputPorts}}
      var {{sanitize @key}} {{normType this}}
      {{/each}}
      {{#if atomic}}
      // code
      {{#ifEq id 'logic/mux'}}
        {{#if countOperations}}
        global_op_count++
        {{/if}}
        // mux Code!!
        if (control) {
          {{#isPackedMux 'input1' ..}}
          {{sanitize ../../name}}_PORT_input1 = {{sanitize ../../name}}_PORT_input1
          {{#each node.inputPorts}}
          {{#isPacked @key ..}}
          {{sanitize @key}} := *{{sanitize ../../name}}_PORT_{{sanitize @key}}
          {{/isPacked}}
          {{/each}}
          // outputs
          {{#each node.outputPorts}}
          var {{sanitize @key}} {{normType this}}
          {{/each}}
          // packed input1
          {{call}}
          // outputs
          {{#each node.outputPorts}}
          output = {{sanitize @key}}
          {{/each}}
          {{else}}
          output = input1
          {{/isPackedMux}}
        } else {
          {{#isPackedMux 'input2' ..}}
          {{sanitize ../../name}}_PORT_input2 = {{sanitize ../../name}}_PORT_input2
          {{#each node.inputPorts}}
          {{#isPacked @key ..}}
          {{sanitize @key}} := *{{sanitize ../../name}}_PORT_{{sanitize @key}}
          {{/isPacked}}
          {{/each}}
          // outputs
          {{#each node.outputPorts}}
          var {{sanitize @key}} {{normType this}}
          {{/each}}
          // packed input2 
          {{call}}
          // outputs
          {{#each node.outputPorts}}
          output = {{sanitize @key}}
          {{/each}}
          {{else}}
          output = input2
          {{/isPackedMux}}
        }
        {{#each inputPorts}}
        {{#isPacked @key ..}}
        // packed port {{@key}}
        {{/isPacked}}
        {{/each}}
      {{else}}
        {{#if countOperations}}
        global_op_count++
        {{/if}}
        {{../compiledCode}}
      {{/ifEq}}
      {{else}}
      // function call
      P_{{sanitize uid}}(
      {{~#each arguments~}}
      {{#if passingPrefix}}{{passingPrefix}}{{/if}}{{sanitize name}}{{#unless @last}}, {{/unless}}
      {{~/each}})
      {{/if}}
      // outputs to edges
      {{#each outputPorts}}
      {{sanitize ../name}}_PORT_{{sanitize @key}}  = {{sanitize @key}}
      {{/each}}
    }
    {{/if}}
  {{/each}}
  {{#unless atomic}}
  {{#each outputPorts}}
  *{{sanitize @key}} = *{{sanitize ../name}}_PORT_{{sanitize @key}}
  {{/each}}
  {{/unless}}
  {{#ifEq name "main"~}}{{else}}break{{~/ifEq}}
  }
  {{/if}}
}
