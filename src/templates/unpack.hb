func P_{{#if id}}{{sanitize id}}{{else}}{{sanitize name}}{{/if}}(
{{~#each arguments~}}
{{#if inputPrefix}}{{inputPrefix}}{{/if}}{{sanitize name}}{{#unless inputPrefix}}_chan chan {{/unless}}{{type}} {{#unless @last}}, {{/unless}}
{{~/each}}
) {
  // unpacking
  {{#each inputPorts}}
  up_input_{{sanitize ../name}}_PORT_{{sanitize @key}} = {{sanitize @key}}_chan
  {{/each}}
  {{#each unpacks}}
  up_chan_{{sanitize inPort}} := make(chan chan {{arrayType channelType}})
  go P_unpack(up_input_{{sanitize outPort}}, up_chan_{{sanitize inPort}})
  {{/each}}
  {{#each packs}}
  pack_chan_{{sanitize outPort}} := make(chan chan {{arrayType channelType}})
  {{/each}}
  
  go func() {
    var wg_inner sync.WaitGroup
    {{#if arguments.length}}
    for {
    {{/if}}
    {{#each prefixes}}
    {{this}}
    {{/each}}
    
    {{#each inputPorts~}}
    {{sanitize @key}},ok{{@index}} := <- up_chan_{{sanitize ../name}}_PORT_{{sanitize @key}}
    if !ok{{@index}} {
      break
    }
    {{/each}}

    {{#each channels}}
    chan_{{sanitize inPort}} := make(chan {{channelType}})
    {{/each}}
    {{#each outputPorts~}}
    im_{{sanitize @key}}_chan := make(chan {{arrayType this}})
    go func(){
      for o := range chan_{{sanitize ../name}}_PORT_{{sanitize @key}} {
        im_{{sanitize @key}}_chan <- o
      }
      wg_inner.Done()
    }()
    wg_inner.Add(1)
    {{/each}}
    {{#each channels}}
    chan_{{sanitize outPort}} := chan_{{sanitize inPort}}
    {{/each}}

    {{#each processes}}
    go P_{{sanitize uid}}({{#each arguments~}}
    {{#if passingPrefix}}{{passingPrefix}}{{sanitize name}}
    {{~else~}}
    chan_{{sanitize ../name}}_PORT_{{sanitize name}}{{/if}} {{#unless @last}}, {{/unless}}{{/each}})
    {{/each}}
    
    {{#each inputPorts~}}
    chan_{{sanitize ../name}}_PORT_{{sanitize @key}} <- {{sanitize @key}}
    close(chan_{{sanitize ../name}}_PORT_{{sanitize @key}})
    {{/each}}
    
    {{#each outputPorts~}}
    pack_chan_{{sanitize ../name}}_PORT_{{sanitize @key}} <- im_{{sanitize @key}}_chan
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
  
  {{#each outputPorts}}
  pack_output_{{sanitize ../name}}_PORT_{{sanitize @key}} = {{sanitize @key}}_chan
  {{/each}}
  {{#each packs}}
  go P_unpack(pack_chan_{{sanitize outPort}}, pack_output_{{sanitize inPort}})
  {{/each}}
}
