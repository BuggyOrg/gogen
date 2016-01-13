// STDIN >> INC >> STDOUT
// (preprocessing will make STDIN >> TO_INT >> INC >> TO_STRING >> STDOUT out of it)
// INC is an atomic process

package main
import "sync"
import "../lib/numbers"
import "../lib/conversion"
import "../lib/io"

func main() {
  stdout := make(chan string)
  stdin := make(chan string)

  var wg sync.WaitGroup
  wg.Add(1)
  go io.Stdout(stdout, wg)
  go io.Stdin(stdin, wg)

  c2 := make(chan int) // string_to_int >> inc
  c3 := make(chan int) // inc >> int_to_string

  go conversion.String2Int(stdin, c2)
  go numbers.Increment(c2, c3)
  go conversion.Int2String(c3, stdout)

  //stdout.close()

  wg.Wait()
}
