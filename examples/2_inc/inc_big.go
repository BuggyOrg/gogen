// STDIN >> INC >> STDOUT
// (preprocessing will make STDIN >> TO_INT >> INC >> TO_STRING >> STDOUT out of it)
// INC is an atomic process

package main
import "sync"
import "math/big"
import "../lib/io"

func P_translator_string_to_number(input_chan chan string , output_chan chan big.Int ) {
  for {
    // ### Definition of variables ###
var output big.Int
input,ok0 := <- input_chan
    if !ok0 {
      break
    }
    // ### Code from metadata ###
    output.SetString(input, 10)

    // ### process output ###
output_chan <- output
  }
close(output_chan)
}

func P_translator_number_to_string(input_chan chan big.Int , output_chan chan string ) {
  for {
    // ### Definition of variables ###
var output string
input,ok0 := <- input_chan
    if !ok0 {
      break
    }
    // ### Code from metadata ###
    output = input.String()

    // ### process output ###
output_chan <- output
  }
close(output_chan)
}
/*
func P_math_add(s1_chan chan uint64 , s2_chan chan uint64 , sum_chan chan uint64 ) {
  for {
    // ### Definition of variables ###
var sum uint64
s1,ok0 := <- s1_chan
    if !ok0 {
      break
    }
s2,ok1 := <- s2_chan
    if !ok1 {
      break
    }
    // ### Code from metadata ###
    sum = s1 + s2

    // ### process output ###
sum_chan <- sum
  }
close(sum_chan)
}
*/

func P_math_inc(s1_chan chan big.Int, sum_chan chan big.Int ) {
  for {
    // ### Definition of variables ###
var sum big.Int
s1,ok0 := <- s1_chan
    if !ok0 {
      break
    }
    // ### Code from metadata ###
    sum.Add(&s1, big.NewInt(1))

    // ### process output ###
  sum_chan <- sum
  }
close(sum_chan)
}

func main() {
  stdout := make(chan string)
  stdin := make(chan string)

  var wg sync.WaitGroup
  wg.Add(1)
  go io.Stdout(stdout, &wg)
  go io.Stdin(stdin, wg)

  c2 := make(chan big.Int) // string_to_int >> inc
  c3 := make(chan big.Int) // inc >> int_to_string

  go P_translator_string_to_number(stdin, c2)
  go P_math_inc(c2, c3)
  go P_translator_number_to_string(c3, stdout)

  //stdout.close()

  wg.Wait()
}
