    {{#each arguments}}
    {{this}} := initial_{{this}}
    {{/each}}
    for {
      {{#each predicates}}
      {{#unless @last}}
      var {{name}}_value bool
      {{name}}({{argList ../arguments}}, &{{name}}_value)
      {{/unless}}
      {{/each}}
      if false { // remove unecessary codegen special case
      {{#each predicates}}
      } else{{#unless @last}} if {{name}}_value {{/unless}} {
        {{call}}({{argListCall ../arguments}})
        {{#if tailcall}}continue{{else}}break{{/if}}
      {{/each}}
      }
    }
    value = {{returnPort}}