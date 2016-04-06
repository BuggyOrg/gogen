func {{sanitize id}}(
{{~#each arguments~}}
{{sanitize name}}_chan chan {{type}} {{#unless @last}}, {{/unless}}
{{~/each}}
) {
  for {
    // ### Definition of variables ###
    {{#each outputPorts~}}
    var {{sanitize @key}} {{this}}
    {{/each}}
    {{#each inputPorts~}}
    {{sanitize @key}},ok{{@index}} := <- {{sanitize @key}}_chan
    if !ok{{@index}} {
      break
    }
    {{/each}}
    // ### Code from metadata ###
    {{code}}
    // ### process output ###
    {{#each outputPorts~}}
    {{sanitize @key}}_chan <- {{sanitize @key}}
    {{/each}}
  }
  {{#each outputPorts~}}
  close({{sanitize @key}}_chan)
  {{/each}}
}
