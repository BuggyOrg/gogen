package main

import "sync"
import "../lib/io"
import "../lib/conversion"

func lambda(input chan int, output chan int) {
  for i := range(input) {
    output <- i
  }
  close(output)
}

func apply(input chan int, output chan int) {
  for i := range(input) {
    output <- i
  }
  close(output)
}

func main(){
  stdout := make(chan string)
  in := make(chan int)
  l := make(chan int)
  a := make(chan int)

  var wg sync.WaitGroup
  wg.Add(1)
  go lambda(in, l)
  go apply(l, a)
  go conversion.Int2String(a, stdout)
  go io.Stdout(stdout, wg)

  in <- 1
  close(in)

  wg.Wait()
}
