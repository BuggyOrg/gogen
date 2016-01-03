// ((s1:STDIN) // (s2:STDIN) // ADD) >> STDOUT
// (preprocessing will make ((s1:STDIN >> TO_INT) // (s2:STDIN >> TO_INT) // ADD >> TO_STRING >> STDOUT out of it)
// INC is an atomic process

package main

import "sync"
import "../lib/io"
import "../lib/conversion"
import "../lib/numbers"
import "../lib/control"

func main() {
  stdout := make(chan string)
  stdin := make(chan string)

  var wg sync.WaitGroup
  go io.Stdout(stdout, wg)
  wg.Add(1)
  go io.Stdin(stdin, wg)

  c2 := make(chan int) // String2Int >> Distribute
  c21:= make(chan int) // Distribute_1 >> Add
  c22:= make(chan int) // Distribute_2 >> Add
  c3 := make(chan int) // Add >> Int2String

  go conversion.String2Int(stdin, c2)
  go control.Distribute(c2, c21, c22)
  go numbers.Add(c21, c22, c3)
  go conversion.Int2String(c3, stdout)

  wg.Wait()
}
