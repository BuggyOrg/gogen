// {{name}}
func P_{{sanitize uid}}(
{{~#each arguments~}}
{{#if inputPrefix}}{{inputPrefix}}{{/if}}{{sanitize name}}{{#unless inputPrefix}}_chan chan {{/unless}}{{normType type}} {{#unless @last}}, {{/unless}}
{{~/each}}
) {
  var wg_inner sync.WaitGroup
  {{#if arguments.length}}
  for {
  {{/if}}
  {{#each prefixes}}
  {{this}}
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
  // wait for continuation
  b_cont := <- continuation_{{sanitize name}}_chan
  // reject branch if continuation says so
  if (!b_cont) {
    {{#if arguments.length}}
    continue
    {{else}}
    return
    {{/if}}
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

  {{#each channels}}
  chan_{{sanitize inPort}} := make(chan {{normType channelType}})
  {{/each}}
  {{#each channels}}
  chan_{{sanitize outPort}} := chan_{{sanitize inPort}}
  {{/each}}
  {{#each outputPorts~}}
  go func(){
    {{#if ../recursesTo}}
    for o := range chan_{{sanitize ../recursesTo/branchPath}}_PORT_{{sanitize @key}} {
    {{else}}
    for o := range chan_{{sanitize ../name}}_PORT_{{sanitize @key}} {
    {{/if}}
      {{sanitize @key}}_chan <- o
    }
    wg_inner.Done()
  }()
  wg_inner.Add(1)
  {{/each}}
  
  {{#each continuations}}
  // continuation channels
  continuation_{{sanitize w}} := make(chan bool)
  {{/each}}

  {{#each processes}}
  {{#if params.recursiveRoot}}
  continuation_{{sanitize name}} := make(chan bool)
  go func() {
    for {
      continuation_{{sanitize name}} <- true
    }
  }()
  {{/if}}
  {{#if recursive}}go /*recursive*/ P_{{sanitize name}}{{else}}go P_{{sanitize uid}}{{/if}}({{#each arguments~}}
  {{#if passingPrefix}}{{passingPrefix}}{{sanitize name}}
  {{~else~}}
  chan_{{sanitize ../name}}_PORT_{{sanitize name}}{{/if}} {{#unless @last}}, {{/unless}}{{/each}})
  {{/each}}
  
  {{#each inputPorts~}}
  {{#if ../recursesTo}}
  go func() {
    chan_{{sanitize ../recursesTo/branchPath}}_PORT_{{sanitize @key}} <- {{sanitize @key}}
    close(chan_{{sanitize ../recursesTo/branchPath}}_PORT_{{sanitize @key}})
  }()
  {{else}}
  go func() {
    chan_{{sanitize ../name}}_PORT_{{sanitize @key}} <- {{sanitize @key}}
    close(chan_{{sanitize ../name}}_PORT_{{sanitize @key}})
  }()
  {{/if}}
  {{/each}}
  
  {{#each postfixes}}
  {{this}}
  {{/each}}
  
  {{#if arguments.length}}
  }
  {{/if}}
  
  wg_inner.Wait()
  {{#each outputPorts~}}
  close({{sanitize @key}}_chan)
  {{/each}}
}

{{#ifEq name uid}}
{{else}}
var P_{{sanitize ../name}} = P_{{sanitize ../uid}}
{{/ifEq}}
