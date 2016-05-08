func P_{{#if id}}{{sanitize id}}{{else}}{{sanitize name}}{{/if}}(
{{~#each arguments~}}
{{#if inputPrefix}}{{inputPrefix}}{{/if}}{{sanitize name}}{{#unless inputPrefix}}_chan chan {{/unless}}{{normType type}} {{#unless @last}}, {{/unless}}
{{~/each}}
) {
  // unpacking the elements in the nodes input channel. The channels deliver arrays which are converted into channels of channels
  // create an alias for the input channel
  {{#each inputPorts}}
  up_input_{{sanitize ../name}}_PORT_{{sanitize @key}} := {{sanitize @key}}_chan
  {{/each}}

  // start the unpacking
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
    
    // get the new values in each input channel
    {{#each inputPorts~}}
    {{sanitize @key}},ok{{@index}} := <- up_chan_{{sanitize ../name}}_PORT_{{sanitize @key}}
    if !ok{{@index}} {
      break
    }
    {{/each}}

    // create channels for every edge in the graph
    {{#each channels}}
    chan_{{sanitize inPort}} := make(chan {{normType channelType}})
    {{/each}}
    // go through every element in every out port to pin point the time when all output ports are closed.
    // it is very important to close every output port correctly!
    {{#each outputPorts~}}
    im_{{sanitize ../name}}_PORT_{{sanitize @key}}_chan := make(chan {{arrayType this}})
    go func(){
      for o := range chan_{{sanitize ../name}}_PORT_{{sanitize @key}} {
        im_{{sanitize ../name}}_PORT_{{sanitize @key}}_chan <- o
      }
      wg_inner.Done()
    }()
    wg_inner.Add(1)
    {{/each}}
    // channels are named after the inPort, but not every node only nows the in ports of their
    // ingoing channels. Create an alias for every channel named after their out port.
    {{#each channels}}
    chan_{{sanitize outPort}} := chan_{{sanitize inPort}}
    {{/each}}

    // start all processes with their input channels and output channels as arguments
    {{#each processes}}
    go P_{{sanitize uid}}({{#each arguments~}}
    {{#if passingPrefix}}{{passingPrefix}}{{sanitize name}}
    {{~else~}}
    chan_{{sanitize ../name}}_PORT_{{sanitize name}}{{/if}} {{#unless @last}}, {{/unless}}{{/each}})
    {{/each}}
    
    // fill inputs and close channels afterwards. They cannot be reused, in case of an error or to
    // avoid any stateful possible interaction
    {{#each inputPorts~}}
    chan_{{sanitize ../name}}_PORT_{{sanitize @key}} <- {{sanitize @key}}
    close(chan_{{sanitize ../name}}_PORT_{{sanitize @key}})
    {{/each}}
    
    // we have to stream the output channel into the packing channel. It processes those channels sequentially
    // to produce the same ordering in the output.
    {{#each packs~}}
    pack_chan_{{sanitize outPort}} <- im_{{sanitize inPort}}_chan
    {{/each}}
    
    {{#each postfixes}}
    {{this}}
    {{/each}}
    
    {{#if arguments.length}}
    }
    {{/if}}
    
    wg_inner.Wait()
    // if we reach this state close every output port, we are finished with this execution
    {{#each outputPorts~}}
    close({{sanitize @key}}_chan)
    {{/each}}
  }
  
  // identify the output port of this node with the output of the packing operation
  {{#each outputPorts}}
  pack_output_{{sanitize ../name}}_PORT_{{sanitize @key}} = {{sanitize @key}}_chan
  {{/each}}
  // for every unpacked array, do an unpacking step
  {{#each packs}}
  go P_unpack(pack_chan_{{sanitize outPort}}, pack_output_{{sanitize inPort}})
  {{/each}}
}
