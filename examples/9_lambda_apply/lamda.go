package main

import "sync"
import "../lib/io"
import "../lib/conversion"

var wg sync.WaitGroup

func l(input chan int, output chan func(int)int) {
  for i := range input {
    output <- func(n int)int { return n+i }
  }
  close(output)
}

func a(input chan func(int)int, output chan int) {
  for fn := range input {
    output <- fn(1)
  }
  close(output)
}

func main(){
  stdout := make(chan string)
  i2s := make(chan int)
  i1 := make(chan int)
  i2 := make(chan func(int)int)

  wg.Add(1)
  go l(i1, i2)
  go a(i2, i2s)
  go conversion.Int2String(i2s, stdout)
  go io.Stdout(stdout, wg)

  i1 <- 1

  close(i1)
  wg.Wait()
}
