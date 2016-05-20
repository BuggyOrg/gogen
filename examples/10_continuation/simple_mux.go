package main

// imports
import  "fmt"
import  "strconv"
import unsafe "unsafe"
import  "sync"

// global variables

// process declarations

func P_io0stdout(input_chan chan string , wg* sync.WaitGroup ) {
  for {
    // ### Definition of variables ###
input,ok0 := <- input_chan
    if !ok0 {
      break
    }
    // ### Code from metadata ###
    fmt.Print(input)

    // ### process output ###
  }
  wg.Done()
}



func P_translator0number_to_string(input_chan chan int64 , output_chan chan string ) {
  for {
    // ### Definition of variables ###
var output string
input,ok0 := <- input_chan
    if !ok0 {
      break
    }
    // ### Code from metadata ###
    output = strconv.FormatInt(int64(input), 10)

    // ### process output ###
output_chan <- output
  }
close(output_chan)
}



func P_logic0muxint64(control_chan chan bool , input1_chan chan int64, cont1 chan bool , input2_chan chan int64, cont2 chan bool , output_chan chan int64 ) {
  for {
    // ### Definition of variables ###
var output int64
control,ok2 := <- control_chan
    if !ok2 {
      break
    }
    // ### Code from metadata ###
  if(control) {
    cont1 <- true
    cont2 <- false
    input1,ok0 := <- input1_chan
    if !ok0 {
      break
    }
    output = input1
  } else {
    cont1 <- false
    cont2 <- true
    input2,ok1 := <- input2_chan
    if !ok1 {
      break
    }
    output = input2
  }

    // ### process output ###
output_chan <- output
  }
close(output_chan)
}



func P_math0const51eaea9682e43d559ae94dec4acc4b4f1a7f63c3(continuation chan bool, output_chan chan int64 ) {
  for {
    cont := <- continuation
    if !cont {
      continue
    }
    // ### Definition of variables ###
var output int64
    // ### Code from metadata ###
    output = 4
    fmt.Println("go path with 4")

    // ### process output ###
output_chan <- output
  }
close(output_chan)
}



func P_math0const10bb8f8faa2fbeeb1510a91ff7fbd65b4182e8e4(continuation chan bool,output_chan chan int64 ) {
  for {
    cont := <- continuation
    if !cont {
      continue
    }
    // ### Definition of variables ###
var output int64
    // ### Code from metadata ###
    output = 2
    fmt.Println("go path with 2")

    // ### process output ###
output_chan <- output
  }
close(output_chan)
}



func P_math0less(isLess_chan chan int64 , than_chan chan int64 , value_chan chan bool ) {
  for {
    // ### Definition of variables ###
var value bool
isLess,ok0 := <- isLess_chan
    if !ok0 {
      break
    }
than,ok1 := <- than_chan
    if !ok1 {
      break
    }
    // ### Code from metadata ###
    value = isLess < than

    // ### process output ###
value_chan <- value
  }
close(value_chan)
}



func P_translator0string_to_number(input_chan chan string , output_chan chan int64 ) {
  for {
    // ### Definition of variables ###
var output int64
input,ok0 := <- input_chan
    if !ok0 {
      break
    }
    // ### Code from metadata ###
    i_64, err := strconv.ParseInt(input, 10, 8*int(unsafe.Sizeof(output)))
i := int64(i_64) // convert to the correct type
if err != nil {
  fmt.Println("could not parse")
} else {
  output = i
}

    // ### process output ###
output_chan <- output
  }
close(output_chan)
}



func P_io0stdin(output_chan chan string ) {
  for {
    // ### Definition of variables ###
var output string
    // ### Code from metadata ###
    inputStr := ""
_, err := fmt.Scanln(&inputStr)
if err == nil {
	output = inputStr
} else {
	break
}

    // ### process output ###
output_chan <- output
  }
close(output_chan)
}



func P_math0const26e7214cd2296596e1f8951916893112d99eafca(output_chan chan int64 ) {
  for {
    // ### Definition of variables ###
var output int64
    // ### Code from metadata ###
    output = 10

    // ### process output ###
output_chan <- output
  }
close(output_chan)
}



// parents / compounds

func P_main() {
  var wg_inner sync.WaitGroup
  var wg sync.WaitGroup
  wg.Add(1)
  

  chan_mux_2_PORT_input1 := make(chan int64)
  chan_mux_2_PORT_input2 := make(chan int64)
  chan_string_to_number_6_PORT_input := make(chan string)
  chan_less_5_PORT_isLess := make(chan int64)
  chan_less_5_PORT_than := make(chan int64)
  chan_mux_2_PORT_control := make(chan bool)
  chan_mux_2_cont1 := make(chan bool)
  chan_mux_2_cont2 := make(chan bool)
  chan_number_to_string_1_PORT_input := make(chan int64)
  chan_stdout_0_PORT_input := make(chan string)
  chan_const647_3_PORT_output := chan_mux_2_PORT_input1
  chan_const627_4_PORT_output := chan_mux_2_PORT_input2
  chan_stdin_7_PORT_output := chan_string_to_number_6_PORT_input
  chan_string_to_number_6_PORT_output := chan_less_5_PORT_isLess
  chan_const6107_8_PORT_output := chan_less_5_PORT_than
  chan_less_5_PORT_value := chan_mux_2_PORT_control
  chan_mux_2_PORT_output := chan_number_to_string_1_PORT_input
  chan_number_to_string_1_PORT_output := chan_stdout_0_PORT_input

  go P_io0stdout(chan_stdout_0_PORT_input , &wg )
  go P_translator0number_to_string(chan_number_to_string_1_PORT_input , chan_number_to_string_1_PORT_output )
  go P_logic0muxint64(chan_mux_2_PORT_control , chan_mux_2_PORT_input1, chan_mux_2_cont1 , chan_mux_2_PORT_input2, chan_mux_2_cont2 , chan_mux_2_PORT_output )
  go P_math0const51eaea9682e43d559ae94dec4acc4b4f1a7f63c3(chan_mux_2_cont1, chan_const647_3_PORT_output )
  go P_math0const10bb8f8faa2fbeeb1510a91ff7fbd65b4182e8e4(chan_mux_2_cont2, chan_const627_4_PORT_output )
  go P_math0less(chan_less_5_PORT_isLess , chan_less_5_PORT_than , chan_less_5_PORT_value )
  go P_translator0string_to_number(chan_string_to_number_6_PORT_input , chan_string_to_number_6_PORT_output )
  go P_io0stdin(chan_stdin_7_PORT_output )
  go P_math0const26e7214cd2296596e1f8951916893112d99eafca(chan_const6107_8_PORT_output )
  
  
  wg.Wait()
  
  
  wg_inner.Wait()
}



func main() {
  P_main()
}
