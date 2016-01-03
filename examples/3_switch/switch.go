// Main = STDIN >> SWITCH_INC >> STDOUT
// Decision making via conditional propagation (PROP_EQ, PROP_NEQ)

package main

import "sync"
import "../lib/io"
import "../lib/control"
import "../lib/numbers"
import "../lib/conversion"


func main() {
  stdout := make(chan string)
  stdin := make(chan string)

  var wg sync.WaitGroup
  wg.Add(1)
  go io.Stdout(stdout, wg)
  go io.Stdin(stdin, wg)

  c1 := make(chan int) // String2Int >> Switch_Value
  c2 := make(chan int) // Constant(0) >> Switch_Comparison
  c3 := make(chan int) // Switch_Equals >> Join_1
  c4 := make(chan int) // Switch_NotEquals >> Increment
  c5 := make(chan int) // Increment >> Join_2
  c6 := make(chan int) // Join >> Int2String  

  go conversion.String2Int(stdin, c1)
  go numbers.Constant(0)(c2)
  go control.Switch(c1, c2, c3, c4)
  go numbers.Increment(c4, c5)
  go control.Join(c3, c5, c6)
  go conversion.Int2String(c6, stdout)

  wg.Wait()
}

