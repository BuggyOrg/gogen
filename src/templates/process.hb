// {{name}}
func P_{{sanitize uid}}(
{{~#each arguments~}}
{{sanitize name}}{{#if inputPrefix}}{{inputPrefix}} {{/if}}{{#unless inputPrefix}}_chan chan {{/unless}}{{normType type}} {{#unless @last}}, {{/unless}}
{{~/each}}
) {
  for {
    // ### Definition of variables ###
    {{#each outputPorts~}}
    var {{sanitize @key}} {{normType this}}
    {{/each}}
    {{#each inputPorts~}}
    {{#necessaryForContinuation @key ..}}
    {{sanitize @key}},ok{{@index}} := <- {{sanitize @key}}_chan
    if !ok{{@index}} {
      break
    }
    {{/necessaryForContinuation}}
    {{/each}}
    {{#if params.isContinuation}}
    // continuation
    cont := <- continuation_{{sanitize name}}_chan
    if !cont {
      continue
    }
    {{/if}}
    {{#each inputPorts~}}
    {{#necessaryForContinuation @key ..}}
    {{else}}
    {{sanitize @key}},ok{{@index}} := <- {{sanitize @key}}_chan
    if !ok{{@index}} {
      break
    }
    {{/necessaryForContinuation}}
    {{/each}}
    // ### Code from metadata ###
    {{compiledCode}}
    // ### process output ###
    {{#each outputPorts~}}
    {{sanitize @key}}_chan <- {{sanitize @key}}
    {{/each}}
  }
  {{#if properties.needsWaitGroup}}
  wg.Done()
  {{/if}}
  {{#each outputPorts~}}
  close({{sanitize @key}}_chan)
  {{/each}}
}

var P_{{sanitize name}} = P_{{sanitize uid}}
