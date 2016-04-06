func {{name}}(
{{~#each arguments~}}
{{sanitize @key}}_chan chan {{this}} {{#unless @last}}, {{/unless}}
{{~/each}}
) {
  for {
    // ### Definition of variables ###
    {{#each outputPorts~}}
    var {{sanitize @key}} {{this}}
    {{/each}}
    {{#each inputPorts~}}
    {{sanitize @key}},ok{{@index}} := <- {{sanitize @key}}_chan
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