func {{process}}(
{{~#each arguments~}}
{{name}}_chan chan {{type}} {{#unless @last}}, {{/unless}}
{{~/each}}
) {
  for {
    // ### Definition of variables ###
    {{#each outputs~}}
    var {{name}} {{type}}
    {{/each}}
    // ### Code from metadata ###
    {{code}}
    // ### process output ###
    {{#each outputs~}}
    {{name}}_chan <- {{name}}
    {{/each}}
  }
  {{#each outputs~}}
  close({{name}}_chan)
  {{/each}}
}