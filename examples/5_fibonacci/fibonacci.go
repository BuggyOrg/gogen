// Main = STDIN >> FIB >> STDOUT

package main

import "sync"
import "../lib/io"
import "../lib/conversion"
import "../lib/control"
import "../lib/numbers"

func fib(input chan int, output chan int) {
  for N := range input {
    // N := <- input
    
    c1 := make(chan int) // N -> Switch_Value
    c2 := make(chan int) // Constant >> Switch_Comparison
    c3 := make(chan int) // Switch_Equal >> Join_1
    c4 := make(chan int) // Switch_NotEqual >> Duplicate
    c41:= make(chan int) // Duplicate_1 >> Decrement
    c42:= make(chan int) // Duplicate_2 >> Decrement
    c43:= make(chan int) // Decrement >> Decrement
    c5 := make(chan int) // Decrement >> fib
    c6 := make(chan int) // Decrement >> fib
    c7 := make(chan int) // fib >> Add_1
    c8 := make(chan int) // fib >> Add_2
    c9 := make(chan int) // Add >> Join_2
    
    go numbers.Constant(1)(c2)
    go control.Switch(c1, c2, c3, c4) // duplicate the input value
    go control.Duplicate(c4, c41, c42)
    go numbers.Decrement(c41, c5)
    go fac(c5, c6)
    go numbers.Multiply(c42, c6, c7)
    go control.Join(c3, c7, output)
    
    c1 <- N
  }
}

func main() {
  stdout := make(chan string)
  stdin := make(chan string)

  var wg sync.WaitGroup
  wg.Add(1)
  go io.Stdout(stdout, wg)
  go io.Stdin(stdin, wg)

  c1 := make(chan int) // string_to_int >> fac
  c2 := make(chan int) // fac >> int_to_string_process
  
  go conversion.String2Int(stdin, c1)
  go fac(c1, c2)
  go conversion.Int2String(c2, stdout)

  wg.Wait()
}

