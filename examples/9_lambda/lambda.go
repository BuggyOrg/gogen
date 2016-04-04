package main

import "sync"
import "../lib/io"
import "../lib/conversion"

func lambda(output chan func(chan int, chan int)) {
  for {
    output <- func(in chan int, out chan int){
      for i := range(in) { out <- i }
      close(out)
    }
  }
  close(output)
}

func apply(input chan int, inFn chan func(chan int, chan int), output chan int) {
  fn,ok1 := <- inFn
  if !ok1 {
    close(output)
    return
  }
  out := make(chan int)
  fn(input, out)
  for {
    o,ok2 := <- out
    if !ok2 {
      break
    }
    output <- o
  }
  close(output)
}

func main(){
  stdout := make(chan string)
  l := make(chan func(chan int, chan int))
  in := make(chan int)
  a := make(chan int)

  var wg sync.WaitGroup
  wg.Add(1)
  go lambda(l)
  go apply(in, l, a)
  go conversion.Int2String(a, stdout)
  go io.Stdout(stdout, &wg)

  in <- 2
  close(in)

  wg.Wait()
}
